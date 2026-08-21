import { createXcSwap } from '@galacticcouncil/xc-swap';
import { EvmParachain } from '@galacticcouncil/xc-core';

import { signEvm } from './signers';

import { xc, sdk } from './setup';

const { config } = xc;

const EMITTER = '0x059ed5658c988976e73adb6597418970414f3dd0';

// Origin asset A (Hydration runtime asset id) and amount in smallest units.
const ASSET_IN = 5; // USDt
const AMOUNT_IN = 140_000_000_000n; // 1 USDt (6 decimals)

// Destination: wrap.near, received by a NEAR account.
const DESTINATION_ASSET = 'nep141:wrap.near';

const RECIPIENT = 'INSERT_ADDRESS';
// Refund / sender address on Hydration EVM.
const REFUND = 'INSERT_ADDRESS';

const xcSwap = createXcSwap({
  sdk,
  emitter: EMITTER,
});

console.log('Origin assets:', (await xcSwap.getOriginAssets()).length);
console.log('Destination assets:', await xcSwap.getDestinationAssets());
console.log('Routes:', await xcSwap.getRoutes());

// Estimate (dry — no deposit address yet).
console.time('xcswap');
const trade = await xcSwap.swap({
  assetIn: ASSET_IN,
  amountIn: AMOUNT_IN,
  destinationAsset: DESTINATION_ASSET,
  recipient: RECIPIENT,
  refundTo: REFUND,
});
console.timeEnd('xcswap');
console.log(trade);

// Build the executable request (firm quote — yields the deposit address).

async function sign() {
  const tx = await trade.buildCall();
  console.log('Deposit address:', tx.depositAddress);
  console.log('Intent id:', tx.intentId);

  tx.calls.forEach((c) => {
    console.log(c.to, c.data);
  });

  // Sign approve → swapAndBridge sequentially. Allowance is per-asset, so an
  // earlier approve of a different asset doesn't carry over — approve the current
  // assetIn first. signEvm resolves on the receipt, so a plain await orders them.
  const srcChain = config.getChain('hydration') as EvmParachain;
  for (const call of tx.calls) {
    console.log('Signing…');
    await signEvm(call, srcChain);
  }
}

sdk.destroy();
