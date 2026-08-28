/** Asset id -> the EVM address the runtime uses for it; structural inputs only */

/**
 * The `0x…01 ++ id` precompile alias.
 *
 * Correct ONLY for `Token`-kind assets; {@link assetAddress} makes the choice.
 * Must agree with `common`'s `ERC20.fromAssetId`.
 */
export function aliasAddress(id: number): `0x${string}` {
  if (!Number.isInteger(id) || id < 0 || id > 0xffffffff) {
    throw new Error(`asset id out of range for an alias address: ${id}`);
  }
  // 20 bytes: 15 zero, then 0x01, then the id big-endian in the last 4.
  return `0x${'00'.repeat(15)}01${id.toString(16).padStart(8, '0')}` as const;
}

/** An asset's location, structurally; the junction union is narrowed at runtime */
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
 * Resolve one asset the way `HydraErc20Mapping::asset_address` does: the
 * registry contract first, the alias only as a fallback.
 *
 * - An `Erc20` asset's alias is a live precompile answering `symbol()` and
 *   `decimals()`, so it looks like the token but addresses a different pool
 * - v3 sorts a pair by raw address, so this also decides which asset is token0
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
  // A broken registration, not a Token asset — flag it rather than fall back to
  // an address the runtime never uses.
  return {
    address: aliasAddress(id),
    viaContract: false,
    problem: `asset ${id} is Erc20 but carries no AccountKey20 location`,
  };
}
