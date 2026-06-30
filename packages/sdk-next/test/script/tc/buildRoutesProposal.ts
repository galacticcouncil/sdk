import { writeFileSync } from 'fs';

import { Binary, PolkadotClient } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

import { Asset, createSdkContext, pool, sor } from '../../../src';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

/* ========= CONFIG ========= */

// Asset ids every other asset should have a route INTO.
const TARGETS = [16, 20]; // 16 = GLMR, 20 = WETH

// Technical Committee threshold (how many approvals needed to start the motion).
const TC_THRESHOLD = 4;

const RPC = ApiUrl.Fish;

/* ========= MAIN LOGIC ========= */

type OnChainTrade = {
  pool: { type: string; value?: number };
  asset_in: number;
  asset_out: number;
};

// Stable, order-sensitive key for comparing a built route against the stored one.
const routeKey = (
  route: Array<{ pool: any; asset_in: number; asset_out: number }>
) =>
  JSON.stringify(
    route.map((t) => [
      t.pool.type,
      t.pool.value ?? null,
      t.asset_in,
      t.asset_out,
    ])
  );

const isSingleOmnipoolHop = (route: pool.Hop[]) =>
  route.length === 1 && route[0].pool === pool.PoolType.Omni;

class BuildRoutesProposal extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);
    const { api, client: sdkClient } = sdk;

    /**
     * Restrict the routing graph.
     *
     * The context loads Aave + Omnipool + Stableswap + Xyk by default.
     *
     * Exclude XYK so no route hops through an XYK pool.
     *
     * HSM/LBP are off by default. Add via pool ctx:
     * - ctx.pool.withHsm()
     * - ctx.pool.withLbp()
     */
    await api.router.withFilter({ exclude: [pool.PoolType.XYK] });

    const papi = client.getTypedApi(hydration);

    // --- Symbol labels for readable logs -------------------------------------
    const assets = await sdkClient.asset.getSupported();
    const byId = new Map<number, Asset>(assets.map((a) => [a.id, a]));
    const label = (id: number) => `${byId.get(id)?.symbol ?? '?'}(${id})`;

    console.log(`Targets: ${TARGETS.map(label).join(', ')}`);

    // --- Build the universe of pairs (every tradeable asset -> each target) ---
    const tradeable = await api.router.getTradeableAssets();
    const pairs = TARGETS.flatMap((assetOut) =>
      tradeable
        .filter((assetIn) => assetIn !== assetOut)
        .map((assetIn) => ({ assetIn, assetOut }))
    );
    console.log(`Computing most-liquid routes for ${pairs.length} pairs...`);

    // --- Compute most-liquid route for each pair ------------------------------
    const settled = await Promise.allSettled(
      pairs.map(async ({ assetIn, assetOut }) => ({
        assetIn,
        assetOut,
        route: await api.router.getMostLiquidRoute(assetIn, assetOut),
      }))
    );

    // --- Snapshot all existing on-chain routes in one query -------------------
    const entries = await papi.query.Router.Routes.getEntries();
    const onChain = new Map<string, OnChainTrade[]>();
    for (const { keyArgs, value } of entries) {
      const [{ asset_in, asset_out }] = keyArgs;
      onChain.set(`${asset_in}-${asset_out}`, value as OnChainTrade[]);
    }

    // --- Classify each pair and collect the calls to propose ------------------
    const calls: any[] = [];
    const created: string[] = [];
    const changed: string[] = [];
    const skipped: string[] = [];
    const empty: string[] = [];
    const failed: Array<{ pair: string; error: string }> = [];

    for (const result of settled) {
      if (result.status === 'rejected') {
        failed.push({ pair: 'unknown', error: String(result.reason) });
        continue;
      }

      const { assetIn, assetOut, route } = result.value;
      const pair = `${label(assetIn)} -> ${label(assetOut)}`;

      // Zero hops => route collection failed; never propose it.
      if (route.length === 0) {
        empty.push(pair);
        continue;
      }

      // Sanity: route must actually start at assetIn and end at assetOut.
      if (
        route[0].assetIn !== assetIn ||
        route[route.length - 1].assetOut !== assetOut
      ) {
        failed.push({
          pair,
          error: 'route endpoints do not match the requested pair',
        });
        continue;
      }

      const built = sor.TradeRouteBuilder.build(route as unknown as sor.Swap[]);
      const existing = onChain.get(`${assetIn}-${assetOut}`);

      // A single Omnipool hop is the chain's implicit default. Only worth a call
      // if a stale non-default route is currently stored (reset to default).
      if (isSingleOmnipoolHop(route)) {
        if (!existing) {
          skipped.push(pair);
          continue;
        }
        if (routeKey(existing) === routeKey(built)) {
          skipped.push(pair);
          continue;
        }
        changed.push(`${pair} (reset to Omnipool default)`);
      } else if (!existing) {
        created.push(pair);
      } else if (routeKey(existing) === routeKey(built)) {
        skipped.push(pair);
        continue; // already correct on-chain
      } else {
        changed.push(pair);
      }

      calls.push(
        papi.tx.Router.force_insert_route({
          asset_pair: { asset_in: assetIn, asset_out: assetOut },
          new_route: built as any,
        }).decodedCall
      );
    }

    // --- Summary --------------------------------------------------------------
    const print = (title: string, items: string[]) => {
      if (!items.length) return;
      console.log(`\n${title} (${items.length}):`);
      items.forEach((i) => console.log(`  ${i}`));
    };
    print('NEW routes', created);
    print('CHANGED routes', changed);
    print('EMPTY (skipped, collection error)', empty);
    if (failed.length) {
      console.log(`\nFAILED (${failed.length}):`);
      failed.forEach((f) => console.log(`  ${f.pair}: ${f.error}`));
    }
    console.log(
      `\nTotal: ${pairs.length} pairs | new ${created.length} | changed ${changed.length} | already-correct ${skipped.length} | empty ${empty.length} | failed ${failed.length}`
    );

    if (calls.length === 0) {
      console.log('\nNothing to propose — all routes already match on-chain.');
      return () => sdk.destroy();
    }

    // --- Wrap in utility.batch_all + technicalCommittee.propose ---------------
    const batch = papi.tx.Utility.batch_all({ calls });
    const lengthBound = (await batch.getEncodedData()).length;

    const proposal = papi.tx.TechnicalCommittee.propose({
      threshold: TC_THRESHOLD,
      proposal: batch.decodedCall,
      length_bound: lengthBound,
    });
    const proposalHex = Binary.toHex(await proposal.getEncodedData());

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = `tcProposal-routes-${timestamp}.txt`;
    writeFileSync(file, proposalHex, 'utf8');

    console.log(`\n${calls.length} forceInsertRoute call(s) batched.`);
    console.log(`TechnicalCommittee.propose hex written to ${file}`);
    console.log('Submit it via Polkadot.js Apps to start the TC motion.');

    return () => sdk.destroy();
  }
}

new BuildRoutesProposal(
  RPC,
  'Build TC proposal of most-liquid routes into target assets'
).run();
