import { Wormhole } from '@galacticcouncil/xc-core';

import { ctx } from './setup';

function pct(used: number, limit: number): string {
  if (limit === 0) return '–';
  return `${((used / limit) * 100).toFixed(2)}%`;
}

function usd(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

const { config, wormhole } = ctx;
const { governor } = wormhole;

console.group('Wormhole Governor Rate Limits');

// Wormhole chains present in the config, de-duplicated by wormhole id.
const wormholeIds = new Map<number, string>();
for (const chain of config.chains.values()) {
  if (Wormhole.isKnown(chain)) {
    wormholeIds.set(Wormhole.fromChain(chain).getWormholeId(), chain.name);
  }
}

const rows: Record<string, string | number>[] = [];
for (const [wormholeId, name] of wormholeIds) {
  const state = await governor.getWormholeRateLimit(wormholeId);

  rows.push({
    chain: `${name} (wh:${wormholeId})`,
    status: !state.configured
      ? 'not governed'
      : state.availableNotional <= 0
        ? 'LOCKDOWN'
        : 'Active',
    available: state.configured
      ? `${usd(state.availableNotional)} / ${usd(state.notionalLimit)}`
      : '–',
    utilised: state.configured
      ? pct(state.notionalLimit - state.availableNotional, state.notionalLimit)
      : '–',
    bigTx: state.configured ? usd(state.maxTransactionSize) : '–',
    enqueued: state.enqueuedCount,
  });
}

console.table(rows);
console.groupEnd();

// Resolve each configured asset to its Governor price using the SAME origin
// probe as WormholeRateLimitValidation — verifies origin keys match the
// Governor token list.
console.group('Configured Asset → Governor Price');

const prices = await governor.getTokenPrices();
const priceKey = (id: number, addr: string) => `${id}:${addr.toLowerCase()}`;

const tokenRows: Record<string, string | number>[] = [];
for (const asset of config.assets.values()) {
  for (const chain of config.chains.values()) {
    if (!Wormhole.isKnown(chain) || !chain.getAsset(asset.key)) continue;

    const wormhole = Wormhole.fromChain(chain);
    let originAddress: string;
    try {
      originAddress = wormhole.normalizeAddress(String(chain.getAssetId(asset)));
    } catch {
      continue;
    }

    const price = prices.get(priceKey(wormhole.getWormholeId(), originAddress));
    tokenRows.push({
      asset: asset.originSymbol,
      chain: `${chain.name} (wh:${wormhole.getWormholeId()})`,
      originAddress,
      governed: price !== undefined ? 'yes' : 'no',
      price: price !== undefined ? `$${price}` : '–',
    });
  }
}

console.table(tokenRows);
console.groupEnd();
