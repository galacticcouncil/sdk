import { jest } from '@jest/globals';

import { Parachain } from '@galacticcouncil/xc-core';

import { dot, hdx } from '../assets';
import { hydration } from '../chains';

import { FeeAssetBuilder } from './FeeAssetBuilder';

const H160 = '0xae42AA923cC7fD1b3B4A410C169D683ED0E8fd2c';

const mockCurrencyMap = (assetId?: number) => {
  const getValue = jest.fn(async (_account: string) => assetId);
  jest.spyOn(Parachain.prototype, 'client', 'get').mockReturnValue({
    getTypedApi: () => ({
      query: { MultiTransactionPayment: { AccountCurrencyMap: { getValue } } },
    }),
  } as any);
  return getValue;
};

describe('FeeAssetBuilder.accountCurrencyMap', () => {
  afterEach(() => jest.restoreAllMocks());

  // The map is keyed by the substrate account - an h160 signer's is the
  // account its address maps to, not the address itself.
  it('should read an h160 signer under its substrate account', async () => {
    const getValue = mockCurrencyMap(5);

    const asset = await FeeAssetBuilder()
      .multiTransactionPayment()
      .accountCurrencyMap()
      .build({ address: H160, chain: hydration });

    expect(getValue).toHaveBeenCalledWith(hydration.getNormalizedAddress(H160));
    expect(asset).toBe(dot);
  });

  it('should fall back to hdx for an account without a fee currency', async () => {
    mockCurrencyMap(undefined);

    const asset = await FeeAssetBuilder()
      .multiTransactionPayment()
      .accountCurrencyMap()
      .build({ address: H160, chain: hydration });

    expect(asset).toBe(hdx);
  });
});
