import { createClient } from 'polkadot-api';
import { api, createSdkContext, type SdkCtx } from '@galacticcouncil/sdk-next';

import {
  createXcIntents,
  DESTINATION_ASSETS,
  type XcIntentsClient,
  type XcIntentsRequest,
  type XcIntentsTrade,
} from '../../src';

/**
 * Dry-runs one swap per destination and one TWAP on mainnet state.
 *
 * - Nothing is submitted
 * - Each build makes a real 1Click deposit to its `A`; it stays unused
 *
 * Run: `npx tsx test/script/dryRun.ts`
 */

const RPC = process.env.RPC ?? 'wss://hydration-rpc.n.dwellir.com';
/** Hydration treasury: a funded substrate account. */
const ACCOUNT =
  process.env.ACCOUNT ?? '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';
const REFUND = '0x000000000000000000000000000000000000dEaD';
const ASSET_IN = Number(process.env.ASSET_IN ?? 0);

const RECIPIENTS: Record<string, string> = {
  [DESTINATION_ASSETS.ZEC]: 't1KPVSRgnFHPBWMJLC7taJioN6m5Q6jVBma',
  [DESTINATION_ASSETS.BTC]: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  [DESTINATION_ASSETS.NEAR]: 'aurora',
};

/** Estimates once to learn `leastIn`, then again at 1.5× it. */
async function sized(
  estimate: (amountIn: bigint) => Promise<XcIntentsTrade>,
  per = 1n
): Promise<XcIntentsTrade> {
  const probe = await estimate(10n ** 9n);
  const trade = await estimate((probe.leastIn * 3n * per) / 2n);
  console.log(`  least    ${trade.least} wei (${trade.leastIn} in)`);
  console.log(`  ceiling  ${trade.fees.maxRelayFee} wei`);
  console.log(`  out      ${trade.amountOut} (floor ${trade.minAmountOut})`);
  console.log(`  errors   [${trade.errors.join(', ')}]`);
  return trade;
}

async function dryRun(req: XcIntentsRequest) {
  if (req.kind !== 'intent') return;
  const call = req.tx.get().decodedCall as any;
  const intent = (call.value.value.call ?? call).value.value.intent;
  console.log(
    `  forward  ${intent.on_resolved?.type} ${intent.on_resolved?.value.contract}`
  );
  const res = await req.tx.dryRun(ACCOUNT);
  console.log(
    `  dry run  ${res.success && res.value.execution_result.success}`
  );
}

async function swap(
  sdk: SdkCtx,
  intents: XcIntentsClient,
  destination: string
) {
  const trade = await sized((amountIn) =>
    intents.swap({ ...base(destination), amountIn })
  );
  const req = await trade.buildCall();
  console.log(`  A        ${req.depositAccount}`);
  console.log(`  path     ${req.authPath}`);
  await dryRun(req);

  const [close] = await intents.closeCalls(req.terms);
  const closed = await sdk.client.evm
    .getProvider()
    .call({
      account: close.from as `0x${string}`,
      to: close.to,
      data: close.data as `0x${string}`,
      value: close.value,
    })
    .then(() => true)
    .catch((e) => e.shortMessage ?? e.message);
  console.log(`  close    ${closed}`);
}

async function twap(intents: XcIntentsClient, destination: string) {
  const tranches = 4;
  const trade = await sized(
    (amountIn) => intents.twap({ ...base(destination), amountIn, tranches }),
    BigInt(tranches)
  );
  await dryRun(await trade.buildCall());
}

function base(destination: string) {
  return {
    account: ACCOUNT,
    assetIn: ASSET_IN,
    destination,
    recipient: RECIPIENTS[destination],
    refundTo: REFUND,
  };
}

async function main() {
  const client = createClient(api.getWs(RPC));
  const sdk = await createSdkContext(client);
  const intents = createXcIntents({ sdk });

  try {
    const destinations = await intents.destinations();
    console.log(
      'Priced:',
      destinations.map((d) => `${d.symbol} min ${d.routeMin}`).join(', ')
    );

    for (const d of destinations) {
      console.log(`Swap → ${d.symbol}`);
      await swap(sdk, intents, d.asset).catch((e) =>
        console.log('  failed', e?.message, e?.cause ?? '')
      );
    }

    console.log('TWAP → ZEC');
    await twap(intents, DESTINATION_ASSETS.ZEC).catch((e) =>
      console.log('  failed', e?.message, e?.cause ?? '')
    );
  } finally {
    sdk.destroy();
    client.destroy();
  }
}

main();
