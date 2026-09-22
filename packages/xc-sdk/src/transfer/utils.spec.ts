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
    const max = calculateMax(balance, fee, min, undefined, [prepaid]);
    expect(max.amount).toBe(10n * WETH - WETH / 100n);
  });

  it('should ignore a reserve in another asset', () => {
    const prepaid = amount(eth, WETH / 100n);
    const max = calculateMax(balance, fee, min, undefined, [prepaid]);
    expect(max.amount).toBe(10n * WETH);
  });

  // Fee currency equal to the transfer asset: the destination fee swap sells
  // the asset being bridged, on top of the transaction fee in it.
  it('should reserve every cost paid out of the balance', () => {
    const sameAssetFee = amount(weth, WETH / 1000n);
    const swapIn = amount(weth, WETH / 200n);
    const max = calculateMax(balance, sameAssetFee, min, undefined, [swapIn]);
    expect(max.amount).toBe(10n * WETH - WETH / 1000n - WETH / 200n);
  });
});
