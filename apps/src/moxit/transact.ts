import {
  Abi,
  AnyChain,
  Parachain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';
import { big, encodeLocation } from '@galacticcouncil/common';

import { decodeFunctionData } from 'viem';

import {
  XcmV2OriginKind,
  XcmV3Junction,
  XcmV3Junctions,
  XcmV3MultiassetFungibility,
  XcmV3WeightLimit,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
  XcmV4Instruction,
} from '@galacticcouncil/descriptors';

import { Binary } from 'polkadot-api';

import { config } from '../setup';
import { HYDRATION_SA, MoxitAsset, moonbeam } from './assets';

const hydration = config.getChain('hydration') as Parachain;
const glmr = moonbeam.getAsset('glmr')!;

const V4 = 'V4';

// Fallback require_weight_at_most if on-chain payment-info estimation fails.
// Matches the SDK's EthereumXcm transact gas ceiling (5M gas × 25k weight/gas).
const FALLBACK_WEIGHT = { refTime: 125_000_000_000n, proofSize: 100_000n };

export interface TransactInput {
  asset: MoxitAsset;
  /** Recipient account on the origin chain. */
  recipient: string;
  /** Human-readable transfer amount. */
  amount: string;
  /** GLMR spent by the SA on BuyExecution (defaults to 1; surplus is refunded). */
  feeGlmr?: string;
}

/** A single decoded EVM call inside the Moonbeam batch. */
export interface DecodedCall {
  /** Contract the call targets. */
  to: string;
  /** e.g. `Erc20.approve`, `TokenBridge.transferTokens`. */
  label: string;
  args: { name: string; value: string }[];
}

export interface TransactResult {
  /** Encoded Hydration `PolkadotXcm.send` call — this is what governance dispatches. */
  callHex: string;
  /** Encoded Moonbeam `EthereumXcm.transact` executed as the SA. */
  transactHex: string;
  /** Precompile the batch targets (Moonbeam Batch precompile). */
  batchTo?: string;
  /** Decoded inner EVM calls (approve + transferTokens). */
  decoded: DecodedCall[];
  amountRaw: bigint;
  feeRaw: bigint;
  weight: { refTime: bigint; proofSize: bigint };
  originName: string;
  wormholeId: number;
  tokenBridge: string;
}

const CANDIDATE_ABIS: [string, any][] = [
  ['Erc20', Abi.Erc20],
  ['TokenBridge', Abi.TokenBridge],
];

function stringifyArg(v: any): string {
  if (typeof v === 'bigint') return v.toString();
  if (Array.isArray(v)) return '[' + v.map(stringifyArg).join(', ') + ']';
  return String(v);
}

/** Decode one sub-call by trying the ERC20 / Wormhole ABIs until one matches. */
function decodeSub(to: string, data: `0x${string}`): DecodedCall {
  for (const [name, abi] of CANDIDATE_ABIS) {
    try {
      const d = decodeFunctionData({ abi, data });
      const item: any = abi.find(
        (x: any) => x.type === 'function' && x.name === d.functionName
      );
      const args = (((d.args as any[]) ?? []) as any[]).map((v, i) => ({
        name: item?.inputs?.[i]?.name ?? `arg${i}`,
        value: stringifyArg(v),
      }));
      return { to, label: `${name}.${d.functionName}`, args };
    } catch {
      /* try next abi */
    }
  }
  return { to, label: 'unknown', args: [{ name: 'data', value: data }] };
}

/**
 * Decode the EVM calldata actually carried by the built `EthereumXcm.transact`
 * — the Moonbeam `Batch.batchAll([approve, transferTokens])`. Route-agnostic:
 * it reads the real bytes, so it reflects exactly what will execute.
 */
function decodeMoonbeamCall(tx: { decodedCall: any }): {
  batchTo?: string;
  calls: DecodedCall[];
} {
  try {
    const xt = tx.decodedCall?.value?.value?.xcm_transaction?.value;
    const action = xt?.action;
    const asHex = (v: any): string | undefined =>
      typeof v === 'string'
        ? v
        : typeof v?.asHex === 'function'
          ? v.asHex()
          : v instanceof Uint8Array
            ? Binary.toHex(v)
            : undefined;

    const batchTo = action?.type === 'Call' ? asHex(action.value) : undefined;
    const inputHex = asHex(xt?.input);
    if (!inputHex) return { batchTo, calls: [] };

    const batch = decodeFunctionData({
      abi: Abi.Batch,
      data: inputHex as `0x${string}`,
    });
    if (batch.functionName !== 'batchAll') {
      return {
        batchTo,
        calls: [decodeSub(batchTo ?? '', inputHex as `0x${string}`)],
      };
    }
    const [toArr, , callDataArr] = batch.args as [
      string[],
      bigint[],
      string[],
      bigint[],
    ];
    return {
      batchTo,
      calls: callDataArr.map((cd, i) =>
        decodeSub(toArr[i], cd as `0x${string}`)
      ),
    };
  } catch {
    return { calls: [] };
  }
}

async function estimateWeight(tx: {
  getPaymentInfo: (from: string) => Promise<any>;
}) {
  try {
    const info = await tx.getPaymentInfo(HYDRATION_SA);
    return {
      refTime: info.weight.ref_time as bigint,
      proofSize: info.weight.proof_size as bigint,
    };
  } catch {
    return FALLBACK_WEIGHT;
  }
}

/**
 * Build the governance call: a Hydration `PolkadotXcm.send` carrying a Transact
 * that bridges an ERC20 out of Hydration's Moonbeam sovereign account back to
 * its origin chain.
 *
 * The Moonbeam-side call (ERC20 approve + `TokenBridge.transferTokens`) is
 * produced by reusing the asset's existing MRL route transact — the same config
 * the SDK uses for user MRL transfers. It runs under
 * `origin_kind: SovereignAccount`, so the EVM `msg.sender` is the SA that holds
 * the tokens. Execution fees + surplus stay with the SA; governance only needs
 * to enact the returned `callHex`.
 */
export async function buildGovernanceTransact(
  input: TransactInput
): Promise<TransactResult> {
  const { asset, recipient, amount, feeGlmr = '1' } = input;
  const { route } = asset;
  const rcv = route.destination.chain as AnyChain;

  const amountRaw = big.toBigInt(amount, asset.decimals);
  const glmrDecimals = moonbeam.getAssetDecimals(glmr) ?? 18;
  const feeRaw = big.toBigInt(feeGlmr, glmrDecimals);

  // 1. Reuse the route's Moonbeam transact (EthereumXcm.transact wrapping the
  //    Wormhole approve + transferTokens batch). Only the recipient + amount
  //    vary; everything else comes from the config.
  const ctx = {
    address: recipient,
    amount: amountRaw,
    asset: route.source.asset,
    sender: HYDRATION_SA,
    source: { chain: moonbeam },
    destination: { chain: rcv },
    transact: { chain: moonbeam },
  } as any;

  const transactExt = await route.transact!.extrinsic.build(ctx);
  const transactTx = transactExt.getTx(moonbeam.client);
  const transactCall = await transactTx.getEncodedData();
  const weight = await estimateWeight(transactTx);
  const { batchTo, calls } = decodeMoonbeamCall(transactTx);

  // 2. XCM message: pay execution in GLMR, run the Transact as the SA, refund
  //    surplus back to the SA.
  const feeLocation = encodeLocation(moonbeam.getAssetXcmLocation(glmr));
  const feeFun = XcmV3MultiassetFungibility.Fungible(feeRaw);
  const account = XcmV3Junction.AccountKey20({
    key: HYDRATION_SA as any,
    network: undefined,
  });

  const message = {
    type: V4,
    value: [
      XcmV4Instruction.WithdrawAsset([{ id: feeLocation, fun: feeFun }]),
      XcmV4Instruction.BuyExecution({
        fees: { id: feeLocation, fun: feeFun },
        weight_limit: XcmV3WeightLimit.Unlimited(),
      }),
      XcmV4Instruction.Transact({
        origin_kind: XcmV2OriginKind.SovereignAccount(),
        require_weight_at_most: {
          ref_time: weight.refTime,
          proof_size: weight.proofSize,
        },
        call: transactCall,
      }),
      XcmV4Instruction.RefundSurplus(),
      XcmV4Instruction.DepositAsset({
        assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
        beneficiary: { parents: 0, interior: XcmV3Junctions.X1(account) },
      }),
    ],
  };

  const dest = {
    type: V4,
    value: {
      parents: 1,
      interior: XcmV3Junctions.X1(
        XcmV3Junction.Parachain(moonbeam.parachainId)
      ),
    },
  };

  // 3. Hydration PolkadotXcm.send — the governance call.
  const sendTx = hydration.client
    .getUnsafeApi()
    .tx.PolkadotXcm.send({ dest, message });

  const rcvWh = Wh.fromChain(rcv);
  return {
    callHex: Binary.toHex(await sendTx.getEncodedData()),
    transactHex: Binary.toHex(transactCall),
    batchTo,
    decoded: calls,
    amountRaw,
    feeRaw,
    weight,
    originName: asset.originName,
    wormholeId: rcvWh.getWormholeId(),
    tokenBridge: Wh.fromChain(moonbeam).getTokenBridge(),
  };
}
