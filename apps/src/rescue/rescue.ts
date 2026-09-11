import { CallType, EvmParachain } from '@galacticcouncil/xc-core';
import { SubstrateCall } from '@galacticcouncil/xc-sdk';
import { h160 } from '@galacticcouncil/common';

import { Binary, Enum } from 'polkadot-api';

import { config } from '../setup';

const { H160, isEvmAddress } = h160;

export const hydration = config.getChain('hydration') as EvmParachain;

/** pallet_evm dispatch precompile - runs a substrate call as its caller. */
const DISPATCH = '0x0000000000000000000000000000000000000401';

/**
 * WETH (weth_wh, id 20) - what an evm account pays gas in by default.
 *
 * - Only a default: `account_currency` first honours the account's own
 *   `MultiTransactionPayment.AccountCurrencyMap` entry
 * - A phantom usually has one - `AddTxAssetOnAccount` pins the first asset
 *   deposited into an account holding no HDX as its fee currency, provided
 *   the asset is an accepted fee currency (usdc, dot, ...)
 * - `scan` reports the resolved asset as `feeAsset`
 */
export const EVM_FEE_ASSET = 20;

/** Ceiling for the dispatched transfer; unused gas is refunded. */
const GAS_LIMIT = 600_000n;

/** Xcm version `dry_run_call` reports forwarded messages in. */
const XCM_VERSION = 4;

const U64_MASK = (1n << 64n) - 1n;

/** U256 as 4 little-endian u64 limbs (papi wire format). */
const toU256 = (value: bigint): bigint[] => [
  value & U64_MASK,
  (value >> 64n) & U64_MASK,
  (value >> 128n) & U64_MASK,
  (value >> 192n) & U64_MASK,
];

export type Held = {
  id: number;
  free: bigint;
  /** Dry run verdict of sweeping this asset right now. */
  ok: boolean;
  /** Why the sweep would fail. */
  reason?: string;
};

export type Scan = {
  h160: string;
  account: string;
  bound: boolean;
  nonce: number;
  held: Held[];
  /** Asset the phantom pays evm gas in. */
  feeAsset: number;
};

/** Where a deposit to `owner` lands while the account is unbound. */
export function stranded(owner: string) {
  const evmAddress = H160.fromAny(owner);
  return { h160: evmAddress, account: H160.toAccount(evmAddress) };
}

/**
 * Everything the phantom account holds, plus whether it is still reachable.
 *
 * - `bound` decides that: once `EVMAccounts.AccountExtension` holds an entry
 *   the h160 resolves to the bound account instead, nothing addresses the
 *   phantom any more, and its `ETH\0` account id has no key to sign with
 * - Each held asset carries the dry run verdict of its sweep
 */
export async function scan(owner: string): Promise<Scan> {
  const { h160: evmAddress, account } = stranded(owner);
  const api = hydration.client.getUnsafeApi();

  const [extension, system, tokens, feeCurrency] = (await Promise.all([
    api.query.EVMAccounts.AccountExtension.getValue(evmAddress),
    api.query.System.Account.getValue(account),
    api.query.Tokens.Accounts.getEntries(account),
    api.query.MultiTransactionPayment.AccountCurrencyMap.getValue(account),
  ])) as [unknown, any, any[], number | undefined];

  const balances: { id: number; free: bigint }[] = tokens
    .map((entry: any) => ({
      id: Number(entry.keyArgs[1]),
      free: entry.value.free as bigint,
    }))
    .filter((row) => row.free > 0n);

  if (system.data.free > 0n) {
    balances.unshift({ id: 0, free: system.data.free });
  }

  // An evm owner has no substrate origin to dry run as - and needs none,
  // the account above is its own.
  const held = await Promise.all(
    balances.map(async (row) => ({
      ...row,
      ...(isEvmAddress(owner)
        ? { ok: false, reason: 'evm address - spend from the evm wallet' }
        : await preflight(owner, row.id)),
    }))
  );

  return {
    h160: evmAddress,
    account: account,
    bound: !!extension,
    // Unbound, the h160's evm nonce is the phantom's - non-zero bars
    // `bind_evm_address` (validate_bind_evm_address).
    nonce: system.nonce,
    held: held,
    feeAsset: feeCurrency ?? EVM_FEE_ASSET,
  };
}

/**
 * Dry run the sweep of `assetId` and report whether it would go through.
 *
 * - The runtime rejects the whole extrinsic when the phantom cannot pay
 *   gas (`withdraw_fee` fails)
 * - The dispatch precompile swallows an inner failure into
 *   `EVM.ExecutedFailed` with the extrinsic still succeeding, so events
 *   are checked, not just the dispatch result
 */
async function preflight(
  owner: string,
  assetId: number
): Promise<{ ok: boolean; reason?: string }> {
  const api = hydration.client.getUnsafeApi();
  try {
    const call = await sweepCall(owner, assetId);
    const origin = Enum('system', Enum('Signed', owner));
    const raw = (await api.apis.DryRunApi.dry_run_call(
      origin,
      call.decodedCall,
      XCM_VERSION
    )) as any;

    if (!raw.success) {
      return { ok: false, reason: 'dry run rejected' };
    }
    const result = raw.value;
    if (!result.execution_result?.success) {
      return { ok: false, reason: describe(result.execution_result.value) };
    }
    const evm = (result.emitted_events as any[]).find(
      ({ type }) => type === 'EVM'
    );
    if (evm?.value.type !== 'Executed') {
      return { ok: false, reason: 'evm call reverted' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

const describe = (error: any): string => {
  try {
    return JSON.stringify(error, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    );
  } catch {
    return String(error);
  }
};

const substrateCall = (
  from: string,
  data: Parameters<typeof Binary.toHex>[0]
): SubstrateCall =>
  ({
    from: from,
    data: Binary.toHex(data),
    type: CallType.Substrate,
    txOptions: undefined,
    dryRun: async () => undefined,
  }) as SubstrateCall;

/**
 * Top the phantom account up with its fee asset so it can pay for a sweep.
 *
 * An executor delivered transfer refunds its unused destination gas to the
 * recipient, so the phantom may already hold enough.
 */
export async function fundGas(owner: string, asset: number, amount: bigint) {
  const { account } = stranded(owner);
  const api = hydration.client.getUnsafeApi();
  const tx = api.tx.Currencies.transfer({
    // Hydration's `Lookup` is `IdentityLookup`, so this is a plain account
    // id - not the `MultiAddress` most runtimes take here.
    dest: account,
    currency_id: asset,
    amount: amount,
  });
  return substrateCall(owner, await tx.getEncodedData());
}

/**
 * `EVM.call` moving everything the phantom holds of `assetId` to `dest`.
 *
 * - `transfer_all` moves what is free when the call executes - gas has
 *   already been withdrawn by then, so the fee asset sweeps clean without
 *   sizing anything client side; the gas refund is what stays behind
 * - The `EVM.call` is assembled here rather than through
 *   `SubstrateEvm.buildCall`, whose evm-origin argument is unreleased. The
 *   origin is the whole point: an unbound truncated h160, which
 *   `EnsureAddressTruncated` accepts on truncation alone and which is the
 *   only thing still resolving to the phantom
 */
async function sweepCall(owner: string, assetId: number, dest: string = owner) {
  const api = hydration.client.getUnsafeApi();

  const transfer =
    assetId === 0
      ? api.tx.Balances.transfer_all({ dest: dest, keep_alive: false })
      : api.tx.Tokens.transfer_all({
          dest: dest,
          currency_id: assetId,
          keep_alive: false,
        });
  const input = await transfer.getEncodedData();

  const gasPrice = await hydration.evmClient.getProvider().getGasPrice();
  const maxFeePerGas = gasPrice + gasPrice / 10n;

  return api.tx.EVM.call({
    source: stranded(owner).h160,
    target: DISPATCH,
    input: Binary.fromHex(Binary.toHex(input)),
    value: toU256(0n),
    gas_limit: GAS_LIMIT,
    max_fee_per_gas: toU256(maxFeePerGas),
    max_priority_fee_per_gas: undefined,
    nonce: undefined,
    access_list: [],
    // Required since the eip-7702 runtime upgrade - omitting it fails the
    // papi compatibility check, not just encoding.
    authorization_list: [],
  });
}

/**
 * Move all of a stranded asset out of the phantom account.
 *
 * Defaults to paying the owner itself - the substrate account, not its h160,
 * which would land right back where it started.
 */
export async function sweep(
  owner: string,
  assetId: number,
  dest: string = owner
) {
  const call = await sweepCall(owner, assetId, dest);
  return substrateCall(owner, await call.getEncodedData());
}

/** Symbol & decimals by substrate asset id - `scan` reports ids. */
const assetById = new Map(
  Array.from(hydration.assetsData.values()).map((data) => [
    Number(data.id),
    { symbol: data.asset.originSymbol, decimals: data.decimals ?? 12 },
  ])
);

export const meta = (id: number) =>
  assetById.get(id) ?? { symbol: '#' + id, decimals: 0 };

export const fmt = (amount: bigint, decimals: number) => {
  const base = 10n ** BigInt(decimals);
  const frac = (amount % base).toString().padStart(decimals, '0');
  return `${amount / base}.${frac.slice(0, 6) || '0'}`;
};
