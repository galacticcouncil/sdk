import { Asset, AssetAmount } from '@galacticcouncil/xc-core';

import { calculateMax } from './utils';

const weth = new Asset({ key: 'weth', originSymbol: 'WETH' });
const hdx = new Asset({ key: 'hdx', originSymbol: 'HDX' });
const eth = new Asset({ key: 'eth', originSymbol: 'ETH' });

const WETH = 10n ** 18n;

const amount = (asset: Asset, value: bigint, decimals = 18) =>
  AssetAmount.fromAsset(asset, { amount: value, decimals });

describe('calculateMax', () => {
  const balance = amount(weth, 10n * WETH);
  const fee = amount(hdx, 10n ** 12n, 12);
  const min = amount(weth, 0n);

  it('should leave the balance when the fee is another asset', () => {
    const max = calculateMax(balance, fee, min);
    expect(max.amount).toBe(10n * WETH);
  });

  // Executor cost on hydration: paid in weth on top of a weth transfer.
  it('should reserve a prepaid fee sharing the balance asset', () => {
    const prepaid = amount(weth, WETH / 100n);
    const max = calculateMax(balance, fee, min, undefined, prepaid);
    expect(max.amount).toBe(10n * WETH - WETH / 100n);
  });

  it('should ignore a prepaid fee in another asset', () => {
    const prepaid = amount(eth, WETH / 100n);
    const max = calculateMax(balance, fee, min, undefined, prepaid);
    expect(max.amount).toBe(10n * WETH);
  });
});
