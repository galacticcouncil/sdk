import { Parachain } from '@galacticcouncil/xc-core';
import { clients, tags } from '@galacticcouncil/xc-cfg';

import { config } from '../setup';

const { HydrationClient, ASSET_LOCKDOWN_PERIOD_BLOCKS, nttClient } = clients;
const { Tag } = tags;

const HDX_DECIMALS = 12;

/** Parachain block time since runtime 51 (2s blocks). */
const BLOCK_TIME_MS = 2_000;

const hydration = config.getChain('hydration') as Parachain;
const client = new HydrationClient(hydration);

export function fmt(amount: bigint, decimals: number, fractionDigits = 2) {
  const neg = amount < 0n;
  const abs = neg ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr = frac
    .toString()
    .padStart(decimals, '0')
    .slice(0, fractionDigits);
  const sign = neg ? '-' : '';
  return fractionDigits > 0
    ? `${sign}${whole.toLocaleString('en-US')}.${fracStr}`
    : `${sign}${whole.toLocaleString('en-US')}`;
}

/** `used / limit` as a fraction, unbounded above 1. */
function ratio(used: bigint, limit: bigint): number {
  if (limit === 0n) return 0;
  return Number((used * 10_000n) / limit) / 10_000;
}

export function hours(ms: bigint | number): string {
  const h = Number(ms) / 3_600_000;
  if (h < 0) return '0m';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

/** Shared health scale so badges & meters read the same across tables. */
export type Health = 'ok' | 'warn' | 'bad' | 'info' | 'none';

export type Meter = {
  /** 0..1 fill, clamped for drawing */
  fill: number;
  /** Text under the bar */
  label: string;
  health: Health;
};

export type GlobalState = {
  configured: boolean;
  lockdown: boolean;
  meter: Meter;
  rows: { term: string; value: string }[];
};

export type AssetRow = {
  asset: string;
  assetId: number;
  status: string;
  health: Health;
  category: string;
  netChange: string;
  limit: string;
  usage: Meter;
  /** Progress through the period (or the lockdown), label says when it ends */
  window: Meter;
  locked: boolean;
};

/** Lockdown period, as the chain constant reads at the current block time. */
export const ASSET_PERIOD = {
  blocks: ASSET_LOCKDOWN_PERIOD_BLOCKS,
  label: hours(ASSET_LOCKDOWN_PERIOD_BLOCKS * BLOCK_TIME_MS),
};

export type NttRow = {
  leg: string;
  asset: string;
  send: Meter;
  sendLast: string;
  receive: Meter;
  receiveLast: string;
  window: string;
  /** Tightest of the two directions, for ordering */
  headroom: number;
  error?: string;
};

export type Summary = {
  block: number;
  lockedAssets: number;
  tightLegs: number;
};

const pct = (r: number) => `${(r * 100).toFixed(2)}%`;

/** Usage against a limit: bad at the cap, warn at half. */
function usageMeter(used: bigint, limit: bigint): Meter {
  const r = ratio(used, limit);
  return {
    fill: Math.min(r, 1),
    label: pct(r),
    health: r >= 1 ? 'bad' : r >= 0.5 ? 'warn' : 'ok',
  };
}

/** Headroom left in a refilling bucket: bad under a fifth, warn under half. */
function headroomMeter(rl: clients.NttRateLimit, decimals: number): Meter {
  if (rl.windowMs === 0) {
    return { fill: 1, label: 'not metered', health: 'none' };
  }
  const r = ratio(rl.capacity, rl.limit);
  return {
    fill: Math.min(r, 1),
    label: `${pct(r)} · ${fmt(rl.capacity, decimals)} / ${fmt(rl.limit, decimals)}`,
    health: r < 0.2 ? 'bad' : r < 0.5 ? 'warn' : 'ok',
  };
}

/** Elapsed share of a span of blocks, labelled by what happens at its end. */
function windowMeter(
  elapsedBlocks: number,
  totalBlocks: number,
  ending: string
): Meter {
  const left = Math.max(totalBlocks - elapsedBlocks, 0);
  const fill = totalBlocks > 0 ? Math.min(elapsedBlocks / totalBlocks, 1) : 0;
  return {
    fill: fill,
    label: `${ending} ~${hours(left * BLOCK_TIME_MS)}`,
    health: 'info',
  };
}

export async function currentBlock(): Promise<number> {
  return client.api().query.System.Number.getValue({ at: 'best' });
}

/** Global withdraw limit - one bucket over every external asset, in hdx. */
export async function loadGlobal(): Promise<GlobalState> {
  const global = await client.getGlobalWithdrawLimit();
  if (!global.configured) {
    return {
      configured: false,
      lockdown: false,
      meter: { fill: 0, label: 'not configured', health: 'none' },
      rows: [],
    };
  }

  const meter = usageMeter(global.used, global.limit);
  meter.label = `${meter.label} · ${fmt(global.used, HDX_DECIMALS)} / ${fmt(global.limit, HDX_DECIMALS)} HDX`;
  if (global.lockdown) {
    meter.health = 'bad';
  }

  const rows = [
    { term: 'Window', value: hours(global.windowMs) + ', decays linearly' },
    {
      term: 'Last update',
      value: new Date(Number(global.lastUpdateMs)).toUTCString(),
    },
  ];
  if (global.lockdown && global.lockdownUntilMs !== undefined) {
    rows.unshift({
      term: 'Lockdown lifts in',
      value: hours(global.lockdownUntilMs - BigInt(Date.now())),
    });
  }

  return {
    configured: true,
    lockdown: global.lockdown,
    meter: meter,
    rows: rows,
  };
}

/**
 * Per-asset deposit lockdown - net issuance against the limit per period.
 *
 * Locked assets first, then by usage, so what blocks a claim is on top.
 */
export async function loadAssets(block: number): Promise<AssetRow[]> {
  const states = await client.getAllAssetDepositLimits();

  const rows = Array.from(states.values()).map((s): AssetRow => {
    const netChange =
      s.periodExpired || s.baselineIssuance === undefined
        ? 0n
        : s.currentIssuance - s.baselineIssuance;
    const used = netChange > 0n ? netChange : 0n;

    let window: Meter;
    if (s.locked && s.lockedUntilBlock !== undefined) {
      const elapsed =
        block - (s.lockedUntilBlock - ASSET_LOCKDOWN_PERIOD_BLOCKS);
      window = windowMeter(elapsed, ASSET_LOCKDOWN_PERIOD_BLOCKS, 'lifts in');
    } else if (s.periodExpired) {
      window = { fill: 1, label: 'expired, next mint resets', health: 'none' };
    } else if (s.lastResetBlock !== undefined) {
      const elapsed = block - s.lastResetBlock;
      window = windowMeter(elapsed, ASSET_LOCKDOWN_PERIOD_BLOCKS, 'resets in');
    } else {
      window = { fill: 0, label: '–', health: 'none' };
    }

    let usage: Meter;
    if (s.limit === null) {
      usage = { fill: 0, label: 'unlimited', health: 'none' };
    } else if (s.locked) {
      usage = { fill: 1, label: '100.00%', health: 'bad' };
    } else {
      usage = usageMeter(used, s.limit);
    }

    return {
      asset: s.symbol,
      assetId: s.assetId,
      status: s.locked ? 'Locked' : 'Open',
      health: s.locked ? 'bad' : usage.health === 'none' ? 'ok' : usage.health,
      category: s.category,
      netChange:
        netChange === 0n
          ? '–'
          : (netChange > 0n ? '+' : '') + fmt(netChange, s.decimals, 4),
      limit: s.limit !== null ? fmt(s.limit, s.decimals, 4) : '∞',
      usage: usage,
      window: window,
      locked: s.locked,
    };
  });

  return rows.sort(
    (a, b) =>
      Number(b.locked) - Number(a.locked) ||
      b.usage.fill - a.usage.fill ||
      a.asset.localeCompare(b.asset)
  );
}

/**
 * How far below the limit the bucket sat the last time it was touched.
 *
 * Not a windowed counter - the bucket refills linearly, so headroom is back
 * at the limit within `amount / (limit / window)` and reads as no traffic
 * ever. This residual is the only volume the manager still remembers.
 */
function lastTx(rl: clients.NttRateLimit, decimals: number): string {
  const took = rl.limit - rl.capacityAtLastTx;
  if (rl.lastTxMs === 0 || took === 0n) return '–';
  return `${fmt(took, decimals)}, ${hours(Date.now() - rl.lastTxMs)} ago`;
}

/**
 * Wormhole ntt rate limits, per leg & direction.
 *
 * The circuit breaker only governs the hydration side; an ntt transfer is
 * metered a second time by its manager. Driven off the `Ntt` tag, so a newly
 * wired token shows up on its own. Tightest legs first.
 */
export async function loadNtt(): Promise<NttRow[]> {
  const legs = Array.from(config.routes.values()).flatMap((chainRoutes) =>
    chainRoutes
      .getRoutes()
      .filter((route) => route.tags?.includes(Tag.Ntt))
      .filter((route) => !route.tags?.includes(Tag.NttExecutor))
      .map((route) => ({ source: chainRoutes.chain, route }))
  );

  const rows = await Promise.all(
    legs.map(async ({ source, route }): Promise<NttRow> => {
      const destination = route.destination.chain;
      const sent = route.source.asset;
      const received = route.destination.asset;
      const leg = `${source.name} → ${destination.name}`;
      const none: Meter = { fill: 0, label: '', health: 'none' };

      try {
        const [out, inbound] = await Promise.all([
          nttClient(source, sent).getOutboundLimit(),
          nttClient(destination, received).getInboundLimit(source),
        ]);
        const sentDecimals = source.getAssetDecimals(sent) ?? 0;
        const receivedDecimals = destination.getAssetDecimals(received) ?? 0;
        const send = headroomMeter(out, sentDecimals);
        const receive = headroomMeter(inbound, receivedDecimals);

        return {
          leg: leg,
          asset: sent.originSymbol,
          send: send,
          sendLast: lastTx(out, sentDecimals),
          receive: receive,
          receiveLast: lastTx(inbound, receivedDecimals),
          window: hours(out.windowMs),
          headroom: Math.min(send.fill, receive.fill),
        };
      } catch (e) {
        return {
          leg: leg,
          asset: sent.originSymbol,
          send: none,
          sendLast: '',
          receive: none,
          receiveLast: '',
          window: '',
          headroom: 1,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );

  return rows.sort(
    (a, b) => a.headroom - b.headroom || a.leg.localeCompare(b.leg)
  );
}
