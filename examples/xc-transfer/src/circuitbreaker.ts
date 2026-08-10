import { Parachain } from '@galacticcouncil/xc-core';
import { clients, tags } from '@galacticcouncil/xc-cfg';

import { xc } from './setup';

const { config } = xc;
const { Tag } = tags;

const { HydrationClient, ASSET_LOCKDOWN_PERIOD_BLOCKS, nttClient } = clients;

const HDX_DECIMALS = 12;
const BLOCK_TIME_MS = 6_000;

function fmt(amount: bigint, decimals: number, fractionDigits = 4): string {
  const neg = amount < 0n;
  const abs = neg ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr = frac
    .toString()
    .padStart(decimals, '0')
    .slice(0, fractionDigits);
  return `${neg ? '-' : ''}${whole.toLocaleString('en-US')}.${fracStr}`;
}

function pct(used: bigint, limit: bigint): string {
  if (limit === 0n) return '–';
  const ratio = Number((used * 10000n) / limit) / 100;
  return `${ratio.toFixed(2)}%`;
}

function hours(ms: bigint | number): string {
  const h = Number(ms) / 3_600_000;
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${h.toFixed(1)}h`;
}

const hydration = config.getChain('hydration') as Parachain;
const client = new HydrationClient(hydration);
const currentBlock = await client
  .api()
  .query.System.Number.getValue({ at: 'best' });

console.group('Hydration Circuit Breaker');

// --- Global withdraw limit ---
const global = await client.getGlobalWithdrawLimit();
console.group('Global Withdraw Limit');
if (!global.configured) {
  console.log('Status: not configured');
} else {
  console.log('Status:', global.lockdown ? 'LOCKDOWN' : 'Active');
  console.log(
    'Used / Limit:',
    `${fmt(global.used, HDX_DECIMALS)} HDX / ${fmt(global.limit, HDX_DECIMALS)} HDX`
  );
  console.log('Utilised:', pct(global.used, global.limit));
  console.log('Window:', hours(global.windowMs), '(decays linearly)');
  console.log('Block:', `#${currentBlock}`);
  console.log(
    'Last on-chain update:',
    new Date(Number(global.lastUpdateMs)).toISOString()
  );
  if (global.lockdown && global.lockdownUntilMs !== undefined) {
    const remainingMs = global.lockdownUntilMs - BigInt(Date.now());
    console.log('Lockdown lifts in:', hours(remainingMs));
  }
}
console.groupEnd();

// --- Per-asset deposit lockdown ---
const states = await client.getAllAssetDepositLimits();

console.group('Per-Asset Deposit Lockdown');
const rows = Array.from(states.values()).map((s) => {
  const netChange =
    s.periodExpired || s.baselineIssuance === undefined
      ? 0n
      : s.currentIssuance - s.baselineIssuance;
  const used = netChange > 0n ? netChange : 0n;

  let window = '–';
  if (s.locked && s.lockedUntilBlock !== undefined) {
    window = `lockdown lifts in ~${hours(BigInt((s.lockedUntilBlock - currentBlock) * BLOCK_TIME_MS))}`;
  } else if (s.periodExpired) {
    window = 'expired — next mint resets';
  } else if (s.lastResetBlock !== undefined) {
    const blocksLeft =
      s.lastResetBlock + ASSET_LOCKDOWN_PERIOD_BLOCKS - currentBlock;
    window = `resets in ~${hours(BigInt(blocksLeft * BLOCK_TIME_MS))}`;
  }

  return {
    asset: `${s.symbol} #${s.assetId}`,
    status: s.locked ? 'Locked' : 'Unlocked',
    class: s.category,
    netChange:
      netChange === 0n
        ? '–'
        : (netChange > 0n ? '+' : '') + fmt(netChange, s.decimals),
    limit: s.limit !== null ? fmt(s.limit, s.decimals) : '∞',
    usage: s.limit === null ? '–' : s.locked ? '100.00%' : pct(used, s.limit),
    window,
  };
});

console.table(rows);
console.groupEnd();

console.groupEnd();

// --- Wormhole ntt rate limits ---
//
// The circuit breaker only governs the hydration side; an ntt transfer is
// metered a second time by its manager, per token & per direction. Driven
// off the `Ntt` tag, so a newly wired token shows up here on its own.

/**
 * Headroom left right now, out of the limit.
 *
 * The hydration legs read in the hundreds of billions, which is a real
 * metered limit set high enough never to bind - not an opt out. Only
 * `rateLimitDuration == 0` is that, and it reads as no window at all.
 */
function headroom(rl: clients.NttRateLimit, decimals: number): string {
  if (rl.windowMs === 0) return 'not metered';
  return `${fmt(rl.capacity, decimals)} / ${fmt(rl.limit, decimals)}`;
}

/**
 * How far below the limit the bucket sat the last time it was touched.
 *
 * Unlike the circuit breaker above, this is not a windowed counter - the
 * bucket refills linearly, so headroom is back at the limit within
 * `amount / (limit / window)` seconds and reads as no traffic ever. This
 * residual is the only volume the manager still remembers.
 *
 * A transfer consumes at both ends *and* backfills the two opposite legs,
 * so an outbound reading 0 alongside a recent stamp means the traffic went
 * the other way - which is why the two directions of a pair mirror.
 */
function lastTx(rl: clients.NttRateLimit, decimals: number): string {
  const took = rl.limit - rl.capacityAtLastTx;
  if (rl.lastTxMs === 0 || took === 0n) return '–';
  return `${fmt(took, decimals)} (${hours(BigInt(Date.now() - rl.lastTxMs))} ago)`;
}

const nttRoutes = Array.from(config.routes.values()).flatMap((chainRoutes) =>
  chainRoutes
    .getRoutes()
    .filter((route) => route.tags?.includes(Tag.Ntt))
    .map((route) => ({ source: chainRoutes.chain, route }))
);

console.group('Wormhole NTT Rate Limits (capacity / limit per 24h)');
const nttRows = await Promise.all(
  nttRoutes.map(async ({ source, route }) => {
    const destination = route.destination.chain;
    const sent = route.source.asset;
    const received = route.destination.asset;
    const leg = `${source.name} → ${destination.name}`;

    try {
      const [out, inbound] = await Promise.all([
        nttClient(source, sent).getOutboundLimit(),
        nttClient(destination, received).getInboundLimit(source),
      ]);

      const sentDecimals = source.getAssetDecimals(sent) ?? 0;
      const receivedDecimals = destination.getAssetDecimals(received) ?? 0;

      return {
        leg: leg,
        asset: sent.originSymbol,
        send: headroom(out, sentDecimals),
        sendLast: lastTx(out, sentDecimals),
        receive: headroom(inbound, receivedDecimals),
        receiveLast: lastTx(inbound, receivedDecimals),
        window: hours(out.windowMs),
      };
    } catch (e) {
      return {
        leg: leg,
        asset: sent.originSymbol,
        send: e instanceof Error ? e.message : String(e),
      };
    }
  })
);

console.table(nttRows);
console.groupEnd();
