/**
 * Asset id -> the EVM address the RUNTIME uses for it.
 *
 * Kept free of papi and `@galacticcouncil/common` imports on purpose: this is the
 * rule that decides which pool the venue addresses, and everything that imports
 * those two is currently untestable under this package's jest setup. Structural
 * inputs, so a spec can hand it plain objects.
 */

/**
 * The `0x…01 ++ id` precompile alias.
 *
 * Correct ONLY for `Token`-kind assets. Written out rather than borrowed from
 * `common`'s `ERC20.fromAssetId` so this module stays importable in isolation;
 * the two must agree, and {@link assetAddress} is where the choice between alias
 * and contract is actually made.
 */
export function aliasAddress(id: number): `0x${string}` {
  if (!Number.isInteger(id) || id < 0 || id > 0xffffffff) {
    throw new Error(`asset id out of range for an alias address: ${id}`);
  }
  // 20 bytes: 15 zero, then 0x01, then the id big-endian in the last 4.
  return `0x${'00'.repeat(15)}01${id.toString(16).padStart(8, '0')}` as const;
}

/**
 * An asset's location, structurally — see the module note.
 *
 * `value` is `unknown` because the real junction type is a discriminated union
 * whose other variants carry a plain number (`Parachain`) or bytes; only the
 * `AccountKey20` variant has a `key`, so the shape is narrowed at runtime.
 */
export type AssetLocationLike = {
  interior?: { type?: string; value?: unknown };
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

/** The H160 an asset's location carries, if it carries one. */
export function contractFromLocation(
  location: AssetLocationLike | undefined
): `0x${string}` | undefined {
  const interior = location?.interior;
  if (interior?.type !== 'X1') return undefined;

  const junction = interior.value;
  if (!isRecord(junction) || junction.type !== 'AccountKey20') return undefined;

  const inner = junction.value;
  if (!isRecord(inner)) return undefined;

  const key = inner.key;
  return typeof key === 'string'
    ? (key.toLowerCase() as `0x${string}`)
    : undefined;
}

export type ResolvedAssetAddress = {
  address: `0x${string}`;
  /** True when it came from the registry contract rather than the alias. */
  viaContract: boolean;
  /** Set when the registration is inconsistent; the caller should not proceed. */
  problem?: string;
};

/**
 * Resolve one asset the way `HydraErc20Mapping::asset_address` does:
 * `contract_address(id)` first, the alias only as a fallback.
 *
 * The alias is not a harmless second name for an `Erc20` asset. It is a live
 * precompile that answers `symbol()` and `decimals()` — on Hydration the aDOT
 * alias reports "aDOT", 10 decimals — so it looks like the token right up until
 * it is used to address a pool, at which point `getPool` resolves somewhere else
 * entirely and the venue quietly carries no route.
 *
 * It also decides ordering. v3 sorts a pair by raw address, so for two `Erc20`
 * assets that is the CONTRACT sort, which can invert the id sort: aDOT/HOLLAR
 * sorts HOLLAR-first by alias and aDOT-first by contract.
 */
export function assetAddress(
  id: number,
  kind: string | undefined,
  location: AssetLocationLike | undefined
): ResolvedAssetAddress {
  if (kind !== 'Erc20') {
    return { address: aliasAddress(id), viaContract: false };
  }
  const contract = contractFromLocation(location);
  if (contract) return { address: contract, viaContract: true };
  // Erc20 with no AccountKey20 is a broken registration, not a Token asset. The
  // alias would address a different pool, so flag it rather than silently swap in
  // an address the runtime never uses.
  return {
    address: aliasAddress(id),
    viaContract: false,
    problem: `asset ${id} is Erc20 but carries no AccountKey20 location`,
  };
}
