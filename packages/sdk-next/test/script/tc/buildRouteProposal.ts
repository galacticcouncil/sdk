import { writeFileSync } from 'fs';

import { Binary, PolkadotClient } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

import { Asset, createSdkContext, pool, sor } from '../../../src';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

/* ========= CONFIG ========= */

// Single pair to route: from ASSET_IN into ASSET_OUT.
const ASSET_IN = 46; // e.g. 46 = apyUSD
const ASSET_OUT = 222; // e.g. 222 = Hollar

// Technical Committee threshold (how many approvals needed to start the motion).
const TC_THRESHOLD = 4;

const RPC = ApiUrl.Catfish2;

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

class BuildRouteProposal extends PapiExecutor {
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

    const pair = `${label(ASSET_IN)} -> ${label(ASSET_OUT)}`;
    console.log(`Computing most-liquid route for ${pair}...`);

    // --- Compute most-liquid route for the pair -------------------------------
    const route = await api.router.getMostLiquidRoute(ASSET_IN, ASSET_OUT);

    // Zero hops => route collection failed; never propose it.
    if (route.length === 0) {
      console.log(`\nEMPTY route for ${pair} — nothing to propose.`);
      return () => sdk.destroy();
    }

    // Sanity: route must actually start at ASSET_IN and end at ASSET_OUT.
    if (
      route[0].assetIn !== ASSET_IN ||
      route[route.length - 1].assetOut !== ASSET_OUT
    ) {
      console.log(
        `\nFAILED: route endpoints do not match the requested pair ${pair}.`
      );
      return () => sdk.destroy();
    }

    // --- Print the route in a readable form -----------------------------------
    console.log(`\nRoute (${route.length} hop(s)):`);
    route.forEach((hop, i) => {
      console.log(
        `  ${i + 1}. ${label(hop.assetIn)} -> ${label(hop.assetOut)} [${hop.pool}${
          hop.poolId != null ? ` #${hop.poolId}` : ''
        }]`
      );
    });

    const built = sor.TradeRouteBuilder.build(route as unknown as sor.Swap[]);

    // --- Compare against the existing on-chain route --------------------------
    const entry = await papi.query.Router.Routes.getValue({
      asset_in: ASSET_IN,
      asset_out: ASSET_OUT,
    });
    const existing = entry as OnChainTrade[] | undefined;

    // A single Omnipool hop is the chain's implicit default. Only worth a call
    // if a stale non-default route is currently stored (reset to default).
    if (isSingleOmnipoolHop(route)) {
      if (!existing || routeKey(existing) === routeKey(built)) {
        console.log(
          `\nSKIPPED: ${pair} is a single Omnipool hop (chain default) and no stale route is stored.`
        );
        return () => sdk.destroy();
      }
      console.log(`\nCHANGED: ${pair} (reset to Omnipool default)`);
    } else if (!existing) {
      console.log(`\nNEW route: ${pair}`);
    } else if (routeKey(existing) === routeKey(built)) {
      console.log(`\nSKIPPED: ${pair} already matches the on-chain route.`);
      return () => sdk.destroy();
    } else {
      console.log(`\nCHANGED route: ${pair}`);
    }

    // --- Wrap forceInsertRoute in utility.batch_all + TC.propose --------------
    const call = papi.tx.Router.force_insert_route({
      asset_pair: { asset_in: ASSET_IN, asset_out: ASSET_OUT },
      new_route: built as any,
    }).decodedCall;

    const batch = papi.tx.Utility.batch_all({ calls: [call] });
    const lengthBound = (await batch.getEncodedData()).length;

    const proposal = papi.tx.TechnicalCommittee.propose({
      threshold: TC_THRESHOLD,
      proposal: batch.decodedCall,
      length_bound: lengthBound,
    });
    const proposalHex = Binary.toHex(await proposal.getEncodedData());

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = `tcProposal-route-${ASSET_IN}-${ASSET_OUT}-${timestamp}.txt`;
    writeFileSync(file, proposalHex, 'utf8');

    console.log(`\nforceInsertRoute call batched for ${pair}.`);
    console.log(`TechnicalCommittee.propose hex written to ${file}`);
    console.log('Submit it via Polkadot.js Apps to start the TC motion.');

    return () => sdk.destroy();
  }
}

new BuildRouteProposal(
  RPC,
  'Build TC proposal of the most-liquid route for a single asset pair'
).run();
