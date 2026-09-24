import { jest } from '@jest/globals';

import { AssetAmount, TransferCtx } from '@galacticcouncil/xc-core';

import { eth, weth_wh } from '../assets';
import { ethereum, hydration } from '../chains';

import { DestFeeValidation } from './base';

const WETH = 10n ** 18n;

/** hydration weth_wh -> ethereum, fee in weth_wh out of the same balance. */
const ctxFor = (params: {
  amount: bigint;
  balance: bigint;
  fee: bigint;
  prepaid?: boolean;
}): TransferCtx => {
  const balance = AssetAmount.fromAsset(weth_wh, {
    amount: params.balance,
    decimals: 18,
  });
  const fee = balance.copyWith({ amount: params.fee });
  const destination = AssetAmount.fromAsset(eth, {
    amount: 0n,
    decimals: 18,
  });
  return {
    address: '0x11036d934be0a8DB5bF21379e35346b884117f87',
    amount: params.amount,
    asset: weth_wh,
    sender: '0x8aeE4e164d5d70ac67308F303C7e063E9156903E',
    source: {
      balance: balance,
      chain: hydration,
      destinationFee: fee,
      destinationFeeBalance: balance,
      destinationFeePrepaid: params.prepaid,
      fee: balance.copyWith({ amount: 0n }),
      feeBalance: balance,
    },
    destination: {
      balance: destination,
      chain: ethereum,
      fee: destination,
      feeBreakdown: {},
    },
  };
};

describe('DestFeeValidation', () => {
  const validation = new DestFeeValidation(
    () => true,
    () => true
  );

  beforeEach(() => {
    jest.spyOn(DestFeeValidation.prototype, 'getMin').mockResolvedValue(0n);
  });

  afterEach(() => jest.restoreAllMocks());

  // Default: a same-asset fee comes out of what lands, nothing to check.
  it('should skip a fee taken out of the amount', async () => {
    const ctx = ctxFor({ amount: WETH, balance: WETH, fee: WETH / 100n });
    await expect(validation.validate(ctx)).resolves.toBeUndefined();
  });

  it('should pass a prepaid fee the balance covers next to the amount', async () => {
    const ctx = ctxFor({
      amount: WETH,
      balance: WETH + WETH / 100n,
      fee: WETH / 100n,
      prepaid: true,
    });
    await expect(validation.validate(ctx)).resolves.toBeUndefined();
  });

  // The whole balance bridged leaves nothing for the executor call value.
  it('should reject a prepaid fee the amount leaves no room for', async () => {
    const ctx = ctxFor({
      amount: WETH,
      balance: WETH,
      fee: WETH / 100n,
      prepaid: true,
    });
    await expect(validation.validate(ctx)).rejects.toMatchObject({
      message: 'Insufficient_Fee_Balance',
      report: { error: 'destFee.insufficientBalance' },
    });
  });
});
