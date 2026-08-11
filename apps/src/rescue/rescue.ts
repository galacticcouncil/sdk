import { CallType, EvmParachain } from '@galacticcouncil/xc-core';
import { SubstrateCall } from '@galacticcouncil/xc-sdk';
import { h160 } from '@galacticcouncil/common';

import { Binary } from 'polkadot-api';

import { config } from '../setup';

const { H160 } = h160;

export const hydration = config.getChain('hydration') as EvmParachain;

/** pallet_evm dispatch precompile - runs a substrate call as its caller. */
const DISPATCH = '0x0000000000000000000000000000000000000401';

/**
 * WETH (weth_wh, id 20). Hydration meters evm gas in it and the phantom
 * account cannot set a fee currency of its own - `account_currency` defaults
 * an `ETH\0` account to `EvmAssetId`, which is this - so nothing else pays.
 */
export const GAS_ASSET = 20;

/** Ceiling for the dispatched transfer; unused gas is refunded. */
const GAS_LIMIT = 600_000n;

const U64_MASK = (1n << 64n) - 1n;

/** U256 as 4 little-endian u64 limbs (papi wire format). */
const toU256 = (value: bigint): bigint[] => [
  value & U64_MASK,
  (value >> 64n) & U64_MASK,
  (value >> 128n) & U64_MASK,
  (value >> 192n) & U64_MASK,
];

export type Held = { id: number; free: bigint };

export type Scan = {
  h160: string;
  account: string;
  bound: boolean;
  nonce: number;
  held: Held[];
  gasCost: bigint;
};

/** Where a deposit to `owner` lands while the account is unbound. */
export function stranded(owner: string) {
  const evmAddress = H160.fromAny(owner);
  return { h160: evmAddress, account: H160.toAccount(evmAddress) };
}

/**
 * Everything the phantom account holds, plus whether it is still reachable.
 *
 * `bound` decides that: once `EVMAccounts.AccountExtension` holds an entry
 * the h160 resolves to the bound account instead, nothing addresses the
 * phantom any more, and its `ETH\0` account id has no key to sign with.
 */
export async function scan(owner: string): Promise<Scan> {
  const { h160: evmAddress, account } = stranded(owner);
  const api = hydration.client.getUnsafeApi();

  const [extension, system, tokens, gasPrice] = (await Promise.all([
    api.query.EVMAccounts.AccountExtension.getValue(evmAddress),
    api.query.System.Account.getValue(account),
    api.query.Tokens.Accounts.getEntries(account),
    hydration.evmClient.getProvider().getGasPrice(),
  ])) as [unknown, any, any[], bigint];

  const held: Held[] = tokens
    .map((entry: any) => ({
      id: Number(entry.keyArgs[1]),
      free: entry.value.free as bigint,
    }))
    .filter((row) => row.free > 0n);

  if (system.data.free > 0n) {
    held.unshift({ id: 0, free: system.data.free });
  }

  return {
    h160: evmAddress,
    account: account,
    bound: !!extension,
    // Unbound, the h160's evm nonce is the phantom's - non-zero bars
    // `bind_evm_address` (validate_bind_evm_address).
    nonce: system.nonce,
    held: held,
    // What one sweep costs in weth, the runner charging `gas_limit` upfront.
    gasCost: GAS_LIMIT * (gasPrice + gasPrice / 10n),
  };
}

const substrateCall = (from: string, data: Binary): SubstrateCall =>
  ({
    from: from,
    data: Binary.toHex(data),
    type: CallType.Substrate,
    txOptions: undefined,
    dryRun: async () => undefined,
  }) as SubstrateCall;

/**
 * Top the phantom account up with weth so it can pay for the sweep.
 *
 * An executor delivered transfer refunds its unused destination gas to the
 * recipient, so the phantom may already hold enough.
 */
export async function fundGas(owner: string, amount: bigint) {
  const { account } = stranded(owner);
  const api = hydration.client.getUnsafeApi();
  const tx = api.tx.Currencies.transfer({
    // Hydration's `Lookup` is `IdentityLookup`, so this is a plain account
    // id - not the `MultiAddress` most runtimes take here.
    dest: account,
    currency_id: GAS_ASSET,
    amount: amount,
  });
  return substrateCall(owner, await tx.getEncodedData());
}

/**
 * Move `amount` of a stranded asset out of the phantom account.
 *
 * The `EVM.call` is assembled here rather than through
 * `SubstrateEvm.buildCall`, whose evm-origin argument is unreleased - this
 * collapses into that call once xc-sdk ships it. The origin is the whole
 * point: an unbound truncated h160, which `EnsureAddressTruncated` accepts
 * on truncation alone and which is the only thing still resolving to the
 * phantom.
 *
 * Defaults to paying the owner itself - the substrate account, not its h160,
 * which would land right back where it started.
 */
export async function sweep(
  owner: string,
  assetId: number,
  amount: bigint,
  dest: string = owner
) {
  const api = hydration.client.getUnsafeApi();

  const transfer = api.tx.Currencies.transfer({
    dest: dest,
    currency_id: assetId,
    amount: amount,
  });
  const input = await transfer.getEncodedData();

  const gasPrice = await hydration.evmClient.getProvider().getGasPrice();
  const maxFeePerGas = gasPrice + gasPrice / 10n;

  const call = api.tx.EVM.call({
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
