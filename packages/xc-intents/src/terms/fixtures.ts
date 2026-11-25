import type { Hex } from 'viem';

import { RecipientKind, type Terms } from './types';

/** Router's `terms.rs` `sample()`, as in whm `IntentCodecTest.sol`. */
export const GOLDEN_TERMS: Terms = {
  owner: `0x${'33'.repeat(20)}`,
  quoteId: `0x${'11'.repeat(32)}`,
  maxSlippageBps: 100,
  maxFillMultiplier: 2,
  minOutPerIn: 150_000_000n,
  minDelivery: 1_000_000n,
  deadline: 1_800_000_000n,
  recipientKind: RecipientKind.Withdraw,
  refundTo: `0x${'22'.repeat(20)}`,
  destinationAsset: 'nep141:zec.omft.near',
  recipient: 't1KPVSRgnFHPBWMJLC7taJioN6m5Q6jVBma',
};

export const GOLDEN_ENCODED: Hex =
  '0x013333333333333333333333333333333333333333111111111111111111111111111111111111111111111111111111111111111100640200000000000000000000000008f0d180000000000000000000000000000f4240000000006b49d200002222222222222222222222222222222222222222146e65703134313a7a65632e6f6d66742e6e6561722374314b50565352676e46485042574d4a4c433774614a696f4e366d3551366a56426d61';

export const GOLDEN_PATH: Hex =
  '0x64b69a6b6f4b4524764724f9c8621e8be960a08dc31ea121037f634bc06208be';
