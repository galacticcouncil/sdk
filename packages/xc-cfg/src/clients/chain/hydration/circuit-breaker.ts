import type { TypedApi } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

export const ASSET_LOCKDOWN_PERIOD_BLOCKS = 14400;

export type AssetCategory = 'External' | 'Local';

export interface AssetDepositLimit {
  assetId: number;
  symbol: string;
  decimals: number;
  limit: bigint | null;
  locked: boolean;
  lockedUntilBlock?: number;
  lastResetBlock?: number;
  baselineIssuance?: bigint;
  currentIssuance: bigint;
  headroom: bigint | null;
  category: AssetCategory;
  periodExpired: boolean;
}

export interface GlobalWithdrawLimit {
  configured: boolean;
  limit: bigint;
  windowMs: bigint;
  used: bigint;
  lastUpdateMs: bigint;
  headroom: bigint;
  lockdown: boolean;
  lockdownUntilMs?: bigint;
}

type Api = TypedApi<typeof hydration>;
type RegistryEntry = Awaited<
  ReturnType<Api['query']['AssetRegistry']['Assets']['getValue']>
>;
type LockdownState = Awaited<
  ReturnType<Api['query']['CircuitBreaker']['AssetLockdownState']['getValue']>
>;
type CategoryOverride = Awaited<
  ReturnType<Api['query']['CircuitBreaker']['GlobalAssetOverrides']['getValue']>
>;

function buildAssetDepositLimit(
  assetId: number,
  registry: RegistryEntry,
  lockdown: LockdownState,
  override: CategoryOverride,
  currentBlock: number,
  currentIssuance: bigint
): AssetDepositLimit {
  const limit: bigint | null =
    registry?.xcm_rate_limit != null ? BigInt(registry.xcm_rate_limit) : null;

  const symbol = registry?.symbol
    ? new TextDecoder().decode(registry.symbol)
    : `#${assetId}`;
  const decimals = registry?.decimals ?? 12;

  let locked = false;
  let lockedUntilBlock: number | undefined;
  let lastResetBlock: number | undefined;
  let baselineIssuance: bigint | undefined;

  if (lockdown) {
    if (lockdown.type === 'Locked') {
      lockedUntilBlock = lockdown.value;
      locked = currentBlock < lockdown.value;
    } else {
      lastResetBlock = lockdown.value[0];
      baselineIssuance = lockdown.value[1];
    }
  }

  const category: AssetCategory =
    override?.type === 'Local' ? 'Local' : 'External';

  const periodExpired =
    !locked &&
    lastResetBlock !== undefined &&
    lastResetBlock + ASSET_LOCKDOWN_PERIOD_BLOCKS <= currentBlock;

  let headroom: bigint | null = null;
  if (limit !== null) {
    if (locked) {
      headroom = 0n;
    } else if (periodExpired) {
      headroom = limit;
    } else {
      const baseline = baselineIssuance ?? currentIssuance;
      const usedSinceBaseline =
        currentIssuance > baseline ? currentIssuance - baseline : 0n;
      headroom = limit > usedSinceBaseline ? limit - usedSinceBaseline : 0n;
    }
  }

  return {
    assetId,
    symbol,
    decimals,
    limit,
    locked,
    lockedUntilBlock,
    lastResetBlock,
    baselineIssuance,
    currentIssuance,
    headroom,
    category,
    periodExpired,
  };
}

export async function getAssetDepositLimit(
  api: Api,
  assetId: number
): Promise<AssetDepositLimit> {
  const issuanceQuery =
    assetId === 0
      ? api.query.Balances.TotalIssuance.getValue({ at: 'best' })
      : api.query.Tokens.TotalIssuance.getValue(assetId, { at: 'best' });

  const [registry, lockdown, override, currentBlock, currentIssuance] =
    await Promise.all([
      api.query.AssetRegistry.Assets.getValue(assetId, { at: 'best' }),
      api.query.CircuitBreaker.AssetLockdownState.getValue(assetId, {
        at: 'best',
      }),
      api.query.CircuitBreaker.GlobalAssetOverrides.getValue(assetId, {
        at: 'best',
      }),
      api.query.System.Number.getValue({ at: 'best' }),
      issuanceQuery,
    ]);

  return buildAssetDepositLimit(
    assetId,
    registry,
    lockdown,
    override,
    currentBlock,
    currentIssuance
  );
}

export async function getAllAssetDepositLimits(
  api: Api
): Promise<Map<string, AssetDepositLimit>> {
  const [
    registryEntries,
    lockdownEntries,
    overrideEntries,
    currentBlock,
    nativeIssuance,
    tokenIssuanceEntries,
  ] = await Promise.all([
    api.query.AssetRegistry.Assets.getEntries({ at: 'best' }),
    api.query.CircuitBreaker.AssetLockdownState.getEntries({ at: 'best' }),
    api.query.CircuitBreaker.GlobalAssetOverrides.getEntries({ at: 'best' }),
    api.query.System.Number.getValue({ at: 'best' }),
    api.query.Balances.TotalIssuance.getValue({ at: 'best' }),
    api.query.Tokens.TotalIssuance.getEntries({ at: 'best' }),
  ]);

  const lockdownByAsset = new Map(
    lockdownEntries.map((e) => [e.keyArgs[0], e.value])
  );
  const overrideByAsset = new Map(
    overrideEntries.map((e) => [e.keyArgs[0], e.value])
  );
  const tokenIssuanceByAsset = new Map(
    tokenIssuanceEntries.map((e) => [e.keyArgs[0], e.value])
  );

  const result = new Map<string, AssetDepositLimit>();
  for (const entry of registryEntries) {
    const id = entry.keyArgs[0];
    const registry = entry.value;
    if (registry?.xcm_rate_limit == null) continue;

    const issuance =
      id === 0 ? nativeIssuance : (tokenIssuanceByAsset.get(id) ?? 0n);

    const state = buildAssetDepositLimit(
      id,
      registry,
      lockdownByAsset.get(id),
      overrideByAsset.get(id),
      currentBlock,
      issuance
    );
    result.set(id.toString(), state);
  }
  return result;
}

export async function getGlobalWithdrawLimit(
  api: Api
): Promise<GlobalWithdrawLimit> {
  const [config, accumulator, lockdownUntil, now] = await Promise.all([
    api.query.CircuitBreaker.GlobalWithdrawLimitConfig.getValue({ at: 'best' }),
    api.query.CircuitBreaker.WithdrawLimitAccumulator.getValue({ at: 'best' }),
    api.query.CircuitBreaker.WithdrawLockdownUntil.getValue({ at: 'best' }),
    api.query.Timestamp.Now.getValue({ at: 'best' }),
  ]);

  const lockdownUntilMs = lockdownUntil ?? undefined;
  const lockdown = lockdownUntilMs !== undefined && now < lockdownUntilMs;
  const [current, lastUpdate] = accumulator;

  if (!config) {
    return {
      configured: false,
      limit: 0n,
      windowMs: 0n,
      used: 0n,
      lastUpdateMs: lastUpdate,
      headroom: 0n,
      lockdown,
      lockdownUntilMs,
    };
  }

  const { limit, window: windowMs } = config;

  // Mirror pallet's linear decay (try_to_decay_withdraw_limit_accumulator).
  let used = current;
  if (!lockdown && windowMs > 0n) {
    const dt = now > lastUpdate ? now - lastUpdate : 0n;
    if (dt > 0n) {
      const cappedDt = dt > windowMs ? windowMs : dt;
      const decay = (current * cappedDt) / windowMs;
      used = current > decay ? current - decay : 0n;
    }
  }

  const headroom = lockdown || used >= limit ? 0n : limit - used;

  return {
    configured: true,
    limit,
    windowMs,
    used,
    lastUpdateMs: lastUpdate,
    headroom,
    lockdown,
    lockdownUntilMs,
  };
}
