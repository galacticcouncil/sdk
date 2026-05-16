import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

class GetBestSellDiff extends PapiExecutor {
  async script(client: PolkadotClient) {
    const blockHash =
      '0x85e13302de8c273cea776314c99d48ce2565be5b7b50e22453141041eab6aa4c';
    const EURC_BENEFICIARY = '12ZuLmUwSUr8dvMaXUppoHviVLsj45kkj9SywE2Zf7sofvvp';

    const sdk = await createSdkContext(client, { at: blockHash });

    const { api, tx } = sdk;

    const trade = await api.router.getBestSell(44, 22, 2116922408n);
    const tradeTx = await tx
      .trade(trade)
      .withBeneficiary(EURC_BENEFICIARY)
      .build();

    const routerSwaps = trade.swaps.map((s) => ({
      pool: s.pool,
      assetIn: s.assetIn,
      assetOut: s.assetOut,
      amountIn: s.amountIn,
      amountOut: s.amountOut,
      tradeFeePct: s.tradeFeePct,
    }));
    console.log(
      'Router fees per hop:',
      trade.swaps.map((s) => s.tradeFeePct)
    );

    try {
      const result = await tradeTx.dryRun(EURC_BENEFICIARY);
      if (result.success) {
        const runtimeSwaps = result.value.emitted_events
          .filter((e) => e.type === 'Broadcast')
          .filter((e) => (e.value as { type: string }).type === 'Swapped3')
          .map((e) => {
            const v = (e.value as { value: any }).value;
            return {
              filler: v.filler_type.type,
              assetIn: v.inputs[0].asset,
              assetOut: v.outputs[0].asset,
              amountIn: v.inputs[0].amount as bigint,
              amountOut: v.outputs[0].amount as bigint,
            };
          });

        const routerEvents = result.value.emitted_events.filter(
          (e) => e.type === 'Router'
        );
        const executed = routerEvents
          .map((e) => e.value as { type: string; value: any })
          .find((v) => v.type === 'Executed')?.value;

        const fmt = (v: bigint | number | undefined) =>
          v === undefined ? '-' : v.toString();

        const summaryIn = executed?.asset_in ?? trade.swaps[0]?.assetIn;
        const summaryOut =
          executed?.asset_out ?? trade.swaps[trade.swaps.length - 1]?.assetOut;
        const diffPct =
          executed?.amount_out !== undefined && trade.amountOut !== 0n
            ? (Number(executed.amount_out - trade.amountOut) /
                Number(trade.amountOut)) *
              100
            : undefined;
        console.log(`\nPair ${summaryIn} -> ${summaryOut}`);
        console.log(`Router:     ${fmt(trade.amountOut)}`);
        console.log(`Runtime:    ${fmt(executed?.amount_out)}`);
        console.log(
          `Difference: ${
            diffPct === undefined
              ? '-'
              : `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(10)}%`
          }`
        );

        const steps = Math.max(routerSwaps.length, runtimeSwaps.length);
        for (let i = 0; i < steps; i++) {
          const r = routerSwaps[i];
          const e = runtimeSwaps[i];
          const assetIn = r?.assetIn ?? e?.assetIn;
          const assetOut = r?.assetOut ?? e?.assetOut;
          const pool = r?.pool ?? e?.filler ?? '-';
          console.log(`\nSwap ${i + 1} ${assetIn} -> ${assetOut} (${pool})`);
          console.table({
            amountIn: { router: fmt(r?.amountIn), runtime: fmt(e?.amountIn) },
            amountOut: {
              router: fmt(r?.amountOut),
              runtime: fmt(e?.amountOut),
            },
          });
        }
      }
    } catch (e) {
      console.log(e);
    }

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetBestSellDiff(ApiUrl.Hydration, 'Get best sell diff (debug)').run();
