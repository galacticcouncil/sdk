import { pool, evm } from '@galacticcouncil/sdk-next';
import { hydration } from '@galacticcouncil/descriptors';

import { jest } from '@jest/globals';
import { Subscription } from 'rxjs';

import { Binary } from 'polkadot-api';
import { getPolkadotSigner } from 'polkadot-api/signer';
import { ed25519CreateDerive } from '@polkadot-labs/hdkd';
import { DEV_MINI_SECRET } from '@polkadot-labs/hdkd-helpers';

import * as c from 'console';

import { spawn, configs, Fork } from './lib';

const { OmniPoolClient } = pool.omni;
const { EvmClient } = evm;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Ed25519 //Alice (mock-signature-host makes the scheme irrelevant); SS58 below.
const aliceKp = ed25519CreateDerive(DEV_MINI_SECRET)('//Alice');
const ALICE = '5FA9nQDVg267DEd8m1ZypXLBnvN7SFxYwV7ndqSYGiN9TTpu';
const aliceSigner = getPolkadotSigner(aliceKp.publicKey, 'Ed25519', aliceKp.sign);

/**
 * Reproduce the omnipool "add-liquidity price distortion" incident against the
 * EVENT-DRIVEN sync.
 *
 * add_liquidity moves Omnipool.Assets (hub_reserve/shares) AND the pool reserve
 * balance in the SAME block, and emits `Omnipool.LiquidityAdded`. The event
 * handler must resolve BOTH slices pinned at that block, committing them
 * together — so the implied price (hub_reserve/reserve) never tears.
 *
 * Unlike a dev.setStorage override (which emits no event and the event-driven
 * sync would simply ignore), this drives a REAL extrinsic so LiquidityAdded
 * actually fires. We assert (a) the SDK observed the add (balance grew) and
 * (b) the ratio never distorted.
 */
describe('omnipool add-liquidity coherence (tear repro, event-driven)', () => {
  jest.setTimeout(10 * 60 * 1000);

  let fork: Fork;
  let omni: InstanceType<typeof OmniPoolClient>;
  let sub: Subscription;

  let latest: any[] = [];
  let poolAddr: string;
  let assetId: number;
  let assetSym = '?';

  const api = () => fork.client.getTypedApi(hydration);
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
        `bal=${t?.balance} hub=${t?.hubReserves} ratio=${ratio(t).toFixed(10)}`
    );
    return { n, t, r: ratio(t) };
  };

  const step = async (label: string, txs?: string[]) => {
    await fork.newBlock(txs);
    await sleep(2000);
    return logRow(label);
  };

  beforeAll(async () => {
    fork = await spawn(configs.hydration);
    omni = new OmniPoolClient(fork.client, new EvmClient(fork.client));
    sub = omni.getSubscriber().subscribe((pools) => (latest = pools));

    for (let i = 0; i < 30 && latest.length === 0; i++) await sleep(1000);
    const [pool0] = latest;
    if (!pool0) throw new Error('omnipool seed never arrived');
    poolAddr = pool0.address;

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
    await sleep(500); // let in-flight watchEntries settle before fork close
    await fork?.close();
  });

  it('holds hub_reserve/balance coherent across a real add_liquidity block', async () => {
    const base = await logRow('baseline');
    await step('empty');

    // add ~1% of the pool's current reserve of the asset (price-preserving)
    const poolBal = tokenOf(assetId).balance as bigint;
    const addAmount = poolBal / 100n;

    // fund Alice: HDX for fees + the asset to add
    const aliceSys: any = await unsafe().query.System.Account.getValue(ALICE);
    const aliceTok: any = await unsafe().query.Tokens.Accounts.getValue(
      ALICE,
      assetId
    );
    await fork.setStorage({
      System: {
        Account: [
          [
            [ALICE],
            {
              ...aliceSys,
              providers: Math.max(1, Number(aliceSys.providers)),
              data: { ...aliceSys.data, free: 10n ** 24n },
            },
          ],
        ],
      },
      Tokens: {
        Accounts: [
          [[ALICE, assetId], { ...aliceTok, free: addAmount * 3n }],
        ],
      },
    });

    // build + sign the real extrinsic, include it in the next block
    const call = api().tx.Omnipool.add_liquidity({
      asset: assetId,
      amount: addAmount,
    });
    const signed = await call.sign(aliceSigner);
    const hex = Binary.toHex(signed);

    const inject = await step('ADD-LIQ', [hex]);
    const rows = [inject];
    for (let i = 0; i < 12; i++) rows.push(await step(`+${i + 1}`));

    const worst = rows.reduce(
      (m, r) => (Math.abs(r.r - base.r) > Math.abs(m.r - base.r) ? r : m),
      inject
    );
    const distortPct = ((worst.r - base.r) / base.r) * 100;
    const distorted = rows.filter(
      (r) => Math.abs((r.r - base.r) / base.r) > 0.001
    );
    const finalBal = tokenOf(assetId).balance as bigint;
    c.log(
      `\nbaseline ratio=${base.r.toFixed(10)} worst=${worst.r.toFixed(10)} ` +
        `(${distortPct.toFixed(3)}%) distorted=${distorted.length} ` +
        `balΔ=${finalBal - poolBal}`
    );

    // (a) the event-driven sync actually OBSERVED the add (not a trivial no-op)
    expect(finalBal).toBeGreaterThan(poolBal);
    // (b) and it never tore the implied price
    expect(distorted.length).toBe(0);
  });
});
