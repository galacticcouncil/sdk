import { Enum, PolkadotClient, SizedHex, TxCallData } from 'polkadot-api';

import { encodeFunctionData, hexToBytes } from 'viem';

import { acc, erc20, h160 } from '@galacticcouncil/common';
import {
  XcmVersionedAssetId,
  XcmVersionedLocation,
  XcmVersionedXcm,
} from '@galacticcouncil/descriptors';

import { AAVE_POOL_ABI, AAVE_POOL_PROXY } from '../aave';
import {
  ASSET_HUB_PARACHAIN_ID,
  BIFROST_PARACHAIN_ID,
  HYDRATION_PARACHAIN_ID,
} from '../consts';

import { TxBuilder } from './TxBuilder';
import {
  Transaction,
  VdotMintBudgets,
  VdotMintChains,
  VdotMintSupplyTx,
} from './types';
import { enumPath } from './utils';
import {
  DOT_LOCATION,
  VDOT_ASSET_ID,
  VDOT_LOCATION,
  buildVdotMintXcm,
  buildVdotSupplyRehearsalXcm,
  buildVdotSupplyXcm,
  sibling,
} from './vdot';

const { ERC20 } = erc20;
const { H160 } = h160;

const DOT = 10_000_000_000n;

/** Hydration only pays delivery to Asset Hub; the rest is refunded there */
const HYDRATION_BUDGET = DOT / 500n;

/** Probe budgets: generous, each hop refunds what it leaves over */
const PROBE_BUDGETS: VdotMintBudgets = {
  hydration: HYDRATION_BUDGET,
  assetHub: DOT / 10n,
  bifrost: DOT / 10n,
};
const PROBE_SUPPLY_FEE = DOT / 1000n;

/** Padding on quoted fees */
const FEE_PAD_PCT = 25n;

/** vDOT the helper keeps for the supply's EVM gas */
const SUPPLY_GAS_RESERVE = DOT / 100n;
const SUPPLY_GAS_LIMIT = 525_000n;

const EXECUTE_MAX_WEIGHT = { ref_time: 1_000_000_000n, proof_size: 50_000n };

/** Runtime API result, as the unsafe api returns it */
type RuntimeResult = { success: boolean; value: any };

interface Supply {
  /** Hydration account that supplies on the beneficiary's behalf */
  helper: string;
  /** vDOT supplied */
  amount: bigint;
  /** vDOT the helper pays Hydration to run the supply */
  fee: bigint;
  /** Hydration call the helper runs */
  call: Uint8Array;
}

/** Messages each hop of the route receives */
interface RouteMessages {
  assetHub: unknown;
  bifrost: unknown;
  /** Bifrost's vDOT transfer to the helper */
  vdot: unknown;
  /** Bifrost account's supply message to Hydration */
  supply: unknown;
}

const pad = (fee: bigint) => (fee * (100n + FEE_PAD_PCT)) / 100n;

/** Value of a runtime API result; throws `error` with the decoded cause otherwise */
const unwrap = (result: unknown, error: string): any => {
  const { success, value } = result as RuntimeResult;
  if (!success) {
    throw new Error(`vDOT mint: ${error}`, { cause: enumPath(value) });
  }
  return value;
};

const isFromPara = (location: any, paraId: number) =>
  location.value.interior.type === 'X1' &&
  location.value.interior.value.type === 'Parachain' &&
  location.value.interior.value.value === paraId;

const forwardedTo = (result: any, paraId: number): unknown[] =>
  result.forwarded_xcms
    .filter(([dest]: any) => isFromPara(dest, paraId))
    .flatMap(([, messages]: any) => messages);

const hasEvent = (result: any, pallet: string, name: string): boolean =>
  result.emitted_events.some(
    (e: any) => e.type === pallet && e.value.type === name
  );

export class VdotMintSupplyTxBuilder extends TxBuilder {
  // InitiateTransfer has no form older than XCM v5
  protected readonly dryRunXcmVersion = 5;

  private _amount?: bigint;
  private _beneficiary?: string;
  private _chains?: VdotMintChains;

  setAmount(amount: bigint): this {
    this._amount = amount;
    return this;
  }

  /**
   * Account that signs the transaction and receives the supplied vDOT.
   *
   * - The route keeps the signer's origin, so it must be the same account
   *
   * @param beneficiary - signer address
   */
  withBeneficiary(beneficiary: string): this {
    this._beneficiary = beneficiary;
    return this;
  }

  withChains(chains: VdotMintChains): this {
    this._chains = chains;
    return this;
  }

  private get amount(): bigint {
    if (this._amount === undefined) {
      throw new Error('Amount not set. Use setAmount().');
    }
    return this._amount;
  }

  private get beneficiary(): string {
    if (!this._beneficiary) {
      throw new Error('Beneficiary not set. Use withBeneficiary().');
    }
    return this._beneficiary;
  }

  private get chains(): VdotMintChains {
    if (!this._chains) {
      throw new Error('Chains not set. Use withChains().');
    }
    return this._chains;
  }

  /**
   * Builds the mint and supply, priced against live state.
   *
   * - A probe dry-runs the route to get the message each hop receives
   * - Each hop is priced on its message with XcmPaymentApi, then padded
   * - The supply is rehearsed on Hydration with the vDOT the mint credits
   */
  async build(): Promise<VdotMintSupplyTx> {
    const amount = this.amount;
    const { assetHub, bifrost } = this.chains;

    const bifrostAccount = acc.getMultilocationDerivatedAccount(
      HYDRATION_PARACHAIN_ID,
      this.beneficiary,
      1
    );
    const helper = acc.getMultilocationDerivatedAccount(
      BIFROST_PARACHAIN_ID,
      bifrostAccount,
      1
    );

    const minMint = (await bifrost
      .getUnsafeApi()
      .query.VtokenMinting.MinimumMint.getValue(Enum('Token2', 0))) as bigint;

    const probe = await this.probe(
      amount,
      minMint,
      await this.supply(helper, 1n, PROBE_SUPPLY_FEE)
    );
    const [assetHubFee, assetHubDelivery, bifrostFee, returnFee, supplyFee] =
      await Promise.all([
        this.weightFee(assetHub, probe.assetHub, DOT_LOCATION),
        this.deliveryFee(assetHub, BIFROST_PARACHAIN_ID, probe.bifrost),
        this.weightFee(bifrost, probe.bifrost, DOT_LOCATION),
        this.weightFee(this.client, probe.vdot, VDOT_LOCATION),
        this.weightFee(this.client, probe.supply, VDOT_LOCATION),
      ]);

    const budgets: VdotMintBudgets = {
      hydration: HYDRATION_BUDGET,
      assetHub: pad(assetHubFee + assetHubDelivery),
      bifrost: pad(bifrostFee),
    };
    const mintAmount =
      amount - budgets.hydration - budgets.assetHub - budgets.bifrost;
    if (mintAmount < minMint) {
      throw new Error('vDOT mint: amount too small', {
        cause: { mintAmount, minMint },
      });
    }

    const fee = pad(supplyFee);
    const credited = (await this.mintedVdot(mintAmount)) - returnFee;
    const supplyAmount = credited - fee - SUPPLY_GAS_RESERVE;
    if (supplyAmount <= 0n) {
      throw new Error('vDOT mint: amount too small to supply');
    }

    const supply = await this.supply(helper, supplyAmount, fee);
    await this.rehearseSupply(credited, supply, bifrostAccount);

    const tx = await this.execute(amount, budgets, mintAmount, supply);
    return {
      ...this.wrapTx('VdotMintSupply', tx),
      plan: {
        amount,
        mintAmount,
        supplyAmount,
        supplyFee: fee,
        budgets,
        bifrostAccount,
        helper,
      },
    };
  }

  /**
   * `PolkadotXcm.execute` of the mint program, the supply riding along on Bifrost.
   */
  private async execute(
    amount: bigint,
    budgets: VdotMintBudgets,
    mintAmount: bigint,
    supply: Supply
  ): Promise<Transaction> {
    const message = buildVdotMintXcm({
      account: this.beneficiary,
      amount,
      budgets,
      bifrostCall: await this.bifrostCall(mintAmount, supply),
    });
    return this.client.getUnsafeApi().tx.PolkadotXcm.execute({
      message: XcmVersionedXcm.V5(message),
      max_weight: EXECUTE_MAX_WEIGHT,
    }) as unknown as Transaction;
  }

  /**
   * Dry-runs the route hop by hop with probe budgets; throws naming the hop that fails.
   */
  private async probe(
    amount: bigint,
    mintAmount: bigint,
    supply: Supply
  ): Promise<RouteMessages> {
    const tx = await this.execute(amount, PROBE_BUDGETS, mintAmount, supply);

    const hydration = unwrap(
      await this.dryRun(this.beneficiary, tx),
      'Hydration dry run failed'
    );

    const [toAssetHub] = forwardedTo(hydration, ASSET_HUB_PARACHAIN_ID);
    const assetHub = await this.dryRunXcm(
      this.chains.assetHub,
      HYDRATION_PARACHAIN_ID,
      toAssetHub,
      'Asset Hub'
    );

    const [toBifrost] = forwardedTo(assetHub, BIFROST_PARACHAIN_ID);
    const bifrost = await this.dryRunXcm(
      this.chains.bifrost,
      ASSET_HUB_PARACHAIN_ID,
      toBifrost,
      'Bifrost'
    );
    if (!hasEvent(bifrost, 'VtokenMinting', 'Minted')) {
      throw new Error('vDOT mint: Bifrost did not mint');
    }

    const [vdot, supplyMessage] = forwardedTo(bifrost, HYDRATION_PARACHAIN_ID);
    return {
      assetHub: toAssetHub,
      bifrost: toBifrost,
      vdot,
      supply: supplyMessage,
    };
  }

  /**
   * Bifrost call the beneficiary's Bifrost account runs: mint to the helper, then the supply message.
   */
  private async bifrostCall(
    mintAmount: bigint,
    supply: Supply
  ): Promise<Uint8Array> {
    const api = this.chains.bifrost.getUnsafeApi();
    const mint = api.tx.Slpx.mint({
      currency_id: Enum('Token2', 0),
      currency_amount: mintAmount,
      target_chain: Enum('Hydradx', supply.helper),
      remark: new Uint8Array(),
      channel_id: 0,
    });
    const send = api.tx.PolkadotXcm.send({
      dest: XcmVersionedLocation.V5(sibling(HYDRATION_PARACHAIN_ID)),
      message: XcmVersionedXcm.V5(
        buildVdotSupplyXcm({
          helper: supply.helper,
          fee: supply.fee,
          helperCall: supply.call,
        })
      ),
    });
    return api.tx.Utility.batch_all({
      calls: [mint.decodedCall, send.decodedCall],
    }).getEncodedData();
  }

  /**
   * Supply with the Hydration call the helper runs.
   *
   * - One-time setup first: vDOT as fee currency (EVM gas is paid in it), then EVM binding
   * - Both are skipped once done; repeating them fails the batch
   * - Then the supply of `amount` vDOT on the beneficiary's behalf
   */
  private async supply(
    helper: string,
    amount: bigint,
    fee: bigint
  ): Promise<Supply> {
    const helperEvm = H160.fromSS58(helper) as SizedHex<20>;
    const [bound, feeCurrency, gasPrice] = await Promise.all([
      this.api.apis.EvmAccountsApi.bound_account_id(helperEvm),
      this.api.query.MultiTransactionPayment.AccountCurrencyMap.getValue(
        helper
      ),
      this.evm.getProvider().getGasPrice(),
    ]);

    const calls: TxCallData[] = [];
    if (feeCurrency !== VDOT_ASSET_ID) {
      calls.push(
        this.api.tx.MultiTransactionPayment.set_currency({
          currency: VDOT_ASSET_ID,
        }).decodedCall
      );
    }
    if (!bound) {
      calls.push(this.api.tx.EVMAccounts.bind_evm_address().decodedCall);
    }

    const input = encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: 'supply',
      args: [
        ERC20.fromAssetId(VDOT_ASSET_ID) as `0x${string}`,
        amount,
        H160.fromAny(this.beneficiary) as `0x${string}`,
        0,
      ],
    });
    calls.push(
      this.api.tx.EVM.call({
        source: helperEvm,
        target: AAVE_POOL_PROXY as SizedHex<20>,
        input: hexToBytes(input),
        value: [0n, 0n, 0n, 0n],
        gas_limit: SUPPLY_GAS_LIMIT,
        // Executes a minute or two after signing: room for base fee drift
        max_fee_per_gas: [gasPrice * 2n, 0n, 0n, 0n],
        max_priority_fee_per_gas: undefined,
        nonce: undefined,
        access_list: [],
        authorization_list: [],
      }).decodedCall
    );

    const call = await this.api.tx.Utility.batch_all({
      calls,
    }).getEncodedData();
    return { helper, amount, fee, call };
  }

  /**
   * vDOT Bifrost mints for `mintAmount` DOT at its current rate.
   */
  private async mintedVdot(mintAmount: bigint): Promise<bigint> {
    const minted = await this.chains.bifrost
      .getUnsafeApi()
      .apis.VtokenMintingRuntimeApi.get_v_currency_amount_by_currency_amount(
        Enum('Token2', 0),
        Enum('VToken2', 0),
        mintAmount
      );
    return BigInt(minted as bigint);
  }

  /**
   * Fee `client`'s chain charges in `asset` to execute `message`.
   */
  private async weightFee(
    client: PolkadotClient,
    message: unknown,
    asset: typeof DOT_LOCATION | typeof VDOT_LOCATION
  ): Promise<bigint> {
    const { XcmPaymentApi } = client.getUnsafeApi().apis;
    const weight = unwrap(
      await XcmPaymentApi.query_xcm_weight(message),
      "can't query XCM weight"
    );
    const fee = unwrap(
      await XcmPaymentApi.query_weight_to_asset_fee(
        weight,
        XcmVersionedAssetId.V5(asset)
      ),
      "can't convert weight to fee"
    );
    return BigInt(fee);
  }

  /**
   * DOT `client`'s chain charges to deliver `message` to sibling `paraId`.
   */
  private async deliveryFee(
    client: PolkadotClient,
    paraId: number,
    message: unknown
  ): Promise<bigint> {
    const fees = unwrap(
      await client
        .getUnsafeApi()
        .apis.XcmPaymentApi.query_delivery_fees(
          XcmVersionedLocation.V5(sibling(paraId)),
          message,
          XcmVersionedAssetId.V5(DOT_LOCATION)
        ),
      "can't query delivery fee"
    );
    const dot = fees.value.find(
      (a: any) => a.id.parents === 1 && a.id.interior.type === 'Here'
    );
    return dot ? BigInt(dot.fun.value) : 0n;
  }

  /**
   * Replays the supply on a helper funded with the credited vDOT; throws unless it executes.
   */
  private async rehearseSupply(
    credited: bigint,
    supply: Supply,
    bifrostAccount: string
  ): Promise<void> {
    const message = buildVdotSupplyRehearsalXcm({
      credited,
      fee: supply.fee,
      helper: supply.helper,
      helperCall: supply.call,
      bifrostAccount,
    });
    const result = await this.dryRunXcm(
      this.client,
      BIFROST_PARACHAIN_ID,
      XcmVersionedXcm.V5(message),
      'Hydration supply'
    );
    if (
      !hasEvent(result, 'Utility', 'BatchCompleted') ||
      !hasEvent(result, 'EVM', 'Executed')
    ) {
      throw new Error('vDOT mint: supply did not execute');
    }
  }

  /**
   * `dry_run_xcm` on `client` for a message from sibling `fromParaId`; throws unless complete.
   */
  private async dryRunXcm(
    client: PolkadotClient,
    fromParaId: number,
    message: unknown,
    hop: string
  ): Promise<any> {
    if (!message) {
      throw new Error(`vDOT mint: nothing forwarded to ${hop}`);
    }
    const effects = unwrap(
      await client
        .getUnsafeApi()
        .apis.DryRunApi.dry_run_xcm(
          XcmVersionedLocation.V5(sibling(fromParaId)),
          message
        ),
      `${hop} dry run failed`
    );
    const outcome = effects.execution_result;
    if (outcome.type !== 'Complete') {
      throw new Error(`vDOT mint: ${hop} execution failed`, {
        cause: enumPath(outcome.value.error?.error ?? outcome),
      });
    }
    return effects;
  }
}
