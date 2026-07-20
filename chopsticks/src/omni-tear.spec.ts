import { pool, evm } from '@galacticcouncil/sdk-next';

import { jest } from '@jest/globals';
import { Subscription } from 'rxjs';

import * as c from 'console';

import { spawn, configs, Fork } from './lib';

const { OmniPoolClient } = pool.omni;
const { EvmClient } = evm;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reproduce the omnipool "add-liquidity price distortion" incident.
 *
 * add_liquidity moves Omnipool.Assets (hub_reserve/shares) AND the pool's
 * reserve balance in the SAME block. If the SDK's live subscription applies the
 * state change but not the coupled balance change, hub_reserve/balance (the
 * implied price) is distorted until something re-triggers the balance — exactly
 * what a user saw (~0.9% inflation for ~20 blocks).
 *
 * We inject the coupled change via dev.setStorage (price-neutral: both sides
 * bumped +1%), then step blocks and watch what the SDK's subscription believes.
 */
describe('omnipool add-liquidity coherence (tear repro)', () => {
  jest.setTimeout(10 * 60 * 1000);

  let fork: Fork;
  let omni: InstanceType<typeof OmniPoolClient>;
  let sub: Subscription;

  // latest snapshot the SDK subscription has emitted
  let latest: any[] = [];

  let poolAddr: string;
  let assetId: number;
  let assetSym = '?';

  const unsafe = () => fork.client.getUnsafeApi();

  const tokenOf = (id: number) =>
    latest?.[0]?.tokens?.find((t: any) => t.id === id);

  const ratio = (t: any) =>
    t && t.balance > 0n ? Number(t.hubReserves) / Number(t.balance) : NaN;

  const blockNo = async () =>
    Number(await unsafe().query.System.Number.getValue());

  const logRow = async (label: string) => {
    const t = tokenOf(assetId);
    const n = await blockNo();
    c.log(
      `#${n} ${label.padEnd(14)} ` +
        `bal=${t?.balance} hub=${t?.hubReserves} ` +
        `ratio=${ratio(t).toFixed(10)}`
    );
    return { n, t, r: ratio(t) };
  };

  const step = async (label: string) => {
    await fork.newBlock();
    await sleep(2000); // let the SDK subs receive + apply the block
    return logRow(label);
  };

  beforeAll(async () => {
    fork = await spawn(configs.hydration);
    omni = new OmniPoolClient(fork.client, new EvmClient(fork.client));

    // start the live subscription (this is the state we are testing)
    sub = omni.getSubscriber().subscribe((pools) => {
      latest = pools;
    });

    // wait for the initial seed to land
    for (let i = 0; i < 30 && latest.length === 0; i++) await sleep(1000);

    const [pool0] = latest;
    if (!pool0) throw new Error('omnipool seed never arrived');
    poolAddr = pool0.address;

    // discover aDOT by symbol; fall back to the first non-hub token
    const assets = await unsafe().query.AssetRegistry.Assets.getEntries();
    const symText = (v: any) => {
      try {
        return v?.symbol?.asText?.() ?? v?.symbol?.toString?.() ?? '';
      } catch {
        return '';
      }
    };
    const aDot = assets.find((e: any) => /adot/i.test(symText(e.value)));
    if (aDot) {
      assetId = Number(aDot.keyArgs[0]);
      assetSym = symText(aDot.value) || 'aDOT';
    } else {
      const t = pool0.tokens.find((x: any) => x.id !== pool0.hubAssetId);
      assetId = t.id;
      assetSym = `#${assetId}(fallback)`;
    }
    c.log(`\npool=${poolAddr}\nasset=${assetSym} id=${assetId}\n`);
  });

  afterAll(async () => {
    sub?.unsubscribe();
    await fork?.close();
  });

  it('holds hub_reserve/balance coherent across an add-liquidity block', async () => {
    const base = await logRow('baseline');
    await step('empty');
    await step('empty');

    // inject a price-neutral add-liquidity: bump hub_reserve, shares AND the
    // pool reserve balance by +1% together, in one block.
    const state: any = await unsafe().query.Omnipool.Assets.getValue(assetId);
    const bal: any = await unsafe().query.Tokens.Accounts.getValue(
      poolAddr,
      assetId
    );
    const bump = (x: bigint) => x + x / 100n;

    // papi decodes `tradable` (a `{ bits: u8 }` bitflags struct) as a bare
    // number; chopsticks/@polkadot setStorage wants the struct shape back.
    const tradableBits =
      state.tradable && typeof state.tradable === 'object'
        ? state.tradable.bits
        : state.tradable;

    await fork.setStorage({
      Omnipool: {
        Assets: [
          [
            [assetId],
            {
              hub_reserve: bump(state.hub_reserve),
              shares: bump(state.shares),
              protocol_shares: state.protocol_shares,
              cap: state.cap,
              tradable: { bits: Number(tradableBits) },
            },
          ],
        ],
      },
      Tokens: {
        Accounts: [[[poolAddr, assetId], { ...bal, free: bump(bal.free) }]],
      },
    });

    const inject = await step('ADD-LIQ');

    const rows = [inject];
    for (let i = 0; i < 25; i++) rows.push(await step(`+${i + 1}`));

    // baseline ratio should be ~preserved (price-neutral add-liq). Report the
    // worst distortion and how long it persisted.
    const worst = rows.reduce(
      (m, r) => (Math.abs(r.r - base.r) > Math.abs(m.r - base.r) ? r : m),
      inject
    );
    const distortPct = ((worst.r - base.r) / base.r) * 100;
    const distorted = rows.filter(
      (r) => Math.abs((r.r - base.r) / base.r) > 0.001
    );
    c.log(
      `\nbaseline ratio=${base.r.toFixed(10)} ` +
        `worst=${worst.r.toFixed(10)} (${distortPct.toFixed(3)}%) ` +
        `distorted blocks=${distorted.length}` +
        (distorted.length
          ? ` [#${distorted[0].n}..#${distorted[distorted.length - 1].n}]`
          : '')
    );

    // The invariant we want after the fix: no lasting distortion.
    expect(distorted.length).toBe(0);
  });
});
