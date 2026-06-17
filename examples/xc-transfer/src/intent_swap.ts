import { createSdkContext } from '@galacticcouncil/sdk-next';
import { createXcSwap } from '@galacticcouncil/xc-swap';

import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';

// xc-swap smoke test — estimate a Hydration -> NEAR (wrap.near) swap and build
// the executable calls. Dry by default (no signing).
//
// Flow: sell asset A on Hydration -> WETH, bridge WETH -> ETH on Ethereum at a
// 1Click deposit address, 1Click swaps ETH -> wrap.near for the recipient.

// IntentEmitter proxy on Hydration EVM. TODO: replace with the deployed address.
const EMITTER = '0x0000000000000000000000000000000000000000';

const HYDRATION_RPC = 'wss://rpc.hydradx.cloud';

// Origin asset A (Hydration runtime asset id) and amount in smallest units.
const ASSET_IN = 5; // DOT
const AMOUNT_IN = 10_000_000_000n; // 1 DOT (10 decimals)

// Destination: a NEAR account that receives wrap.near.
const RECIPIENT = 'alice.near';
// Refund / sender address on Hydration EVM.
const REFUND = '0x6d116C3E43Bc1bFd4EEBe5c7BF043a342Ea6bBB2';

const client = createClient(getWsProvider(HYDRATION_RPC));
const sdk = await createSdkContext(client);

const assets = await sdk.client.asset.getSupported();

const xcSwap = createXcSwap({
  router: sdk.api.router,
  assets,
  emitter: EMITTER,
});

console.log('Origin assets:', xcSwap.getOriginAssets().length);
console.log('Destination assets:', xcSwap.getDestinationAssets());
console.log('Routes:', xcSwap.getRoutes());

const trade = await xcSwap.estimateTrade({
  assetIn: ASSET_IN,
  amountIn: AMOUNT_IN,
  recipient: RECIPIENT,
  refundTo: REFUND,
});

console.log('Amount in:', trade.amountIn.toDecimal(), trade.amountIn.symbol);
console.log('WETH bridged:', trade.wethOut.toDecimal(), trade.wethOut.symbol);
console.log('Min ETH out:', trade.minEthOut.toDecimal());
console.log('Max relay fee:', trade.maxRelayFee.toString());
console.log('Deposit address:', trade.depositAddress);
console.log('Amount out:', trade.amountOut.toDecimal(), trade.amountOut.symbol);
console.log('Intent id:', trade.intentId);
console.log('Time estimate (s):', trade.timeEstimate);

const [approve, swapAndBridge] = trade.buildCalls();
console.log('approve →', approve.to, approve.data);
console.log('swapAndBridge →', swapAndBridge.to, swapAndBridge.data);

sdk.destroy();

// Next steps (not run here):
//  1. Sign + send `approve` then `swapAndBridge` on Hydration EVM (chain 222222).
//  2. The bridge/relayer delivers native ETH to `trade.depositAddress`.
//  3. 1Click swaps ETH -> wrap.near and delivers to RECIPIENT.
