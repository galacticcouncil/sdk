import { Parachain } from '@galacticcouncil/xc-core';
import { clients } from '@galacticcouncil/xc-cfg';

import { ctx } from './setup';

const { HydrationClient, PERIOD_BLOCKS } = clients;

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

const { config } = ctx;
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
    const blocksLeft = s.lastResetBlock + PERIOD_BLOCKS - currentBlock;
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
    usage: s.limit !== null ? pct(used, s.limit) : '–',
    window,
  };
});

console.table(rows);
console.groupEnd();

console.groupEnd();