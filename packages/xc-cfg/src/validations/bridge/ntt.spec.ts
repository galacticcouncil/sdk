import { jest } from '@jest/globals';

import { AssetAmount, TransferCtx } from '@galacticcouncil/xc-core';

import { eth, weth_wh } from '../../assets';
import { ethereum, hydration } from '../../chains';
import { NttEvmClient } from '../../clients/ntt';

import { NttCustodyValidation } from './ntt';

const WETH = 10n ** 18n;

/** hydration weth_wh -> ethereum eth, both ends ntt-registered. */
const ctxFor = (amount: bigint): TransferCtx => {
  const source = AssetAmount.fromAsset(weth_wh, {
    amount: 10n * WETH,
    decimals: 18,
  });
  const destination = AssetAmount.fromAsset(eth, {
    amount: 0n,
    decimals: 18,
  });
  return {
    address: '0x11036d934be0a8DB5bF21379e35346b884117f87',
    amount: amount,
    asset: weth_wh,
    sender: '0x8aeE4e164d5d70ac67308F303C7e063E9156903E',
    source: {
      balance: source,
      chain: hydration,
      destinationFee: source.copyWith({ amount: 0n }),
      destinationFeeBalance: source,
      fee: source.copyWith({ amount: 0n }),
      feeBalance: source,
    },
    destination: {
      balance: destination,
      chain: ethereum,
      fee: destination,
      feeBreakdown: {},
    },
  };
};

const mockCustody = (custody: bigint | undefined) =>
  jest.spyOn(NttEvmClient.prototype, 'getCustody').mockResolvedValue(custody);

describe('NttCustodyValidation', () => {
  const validation = new NttCustodyValidation(
    () => true,
    () => true
  );

  afterEach(() => jest.restoreAllMocks());

  it('should pass a burning destination', async () => {
    mockCustody(undefined);
    await expect(validation.validate(ctxFor(WETH))).resolves.toBeUndefined();
  });

  it('should pass an amount within custody', async () => {
    mockCustody(2n * WETH);
    await expect(validation.validate(ctxFor(WETH))).resolves.toBeUndefined();
  });

  // Robinhood weth, 2026-09-21: 0.0062467 sent against 0.005635 locked.
  it('should reject an amount above custody with the headroom', async () => {
    const custody = 5_635_000_000_000_000n;
    mockCustody(custody);
    await expect(
      validation.validate(ctxFor(6_246_700_000_000_000n))
    ).rejects.toMatchObject({
      message: 'Ntt_Custody_Exceeded',
      report: {
        asset: 'ETH',
        chain: 'Ethereum',
        decimals: 18,
        headroom: custody,
        error: 'ntt.custodyExceeded',
      },
    });
  });

  it('should fail closed when custody cannot be read', async () => {
    jest
      .spyOn(NttEvmClient.prototype, 'getCustody')
      .mockRejectedValue(new Error('rpc down'));
    await expect(validation.validate(ctxFor(WETH))).rejects.toMatchObject({
      message: 'Ntt_Custody_Unreachable',
    });
  });
});
