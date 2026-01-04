import { StableSwap, StableSwapBase } from './StableSwap';

import { stablePool100 } from '../../../test/data';

describe('Stableswap Pool', () => {
  it('Should return valid reverse spot pairs for 2 reserves - diff decimals', async () => {
    const pool = StableSwap.fromPool(stablePool100 as StableSwapBase);

    const usdcToDai = pool.parsePair(21, 18);
    const usdcToDaiSell = pool.spotPriceOutGivenIn(usdcToDai);
    const usdcToDaiBuy = pool.spotPriceInGivenOut(usdcToDai);

    const daiToUsdc = pool.parsePair(18, 21);
    const daiToUsdcSell = pool.spotPriceOutGivenIn(daiToUsdc);
    const daiToUsdcBuy = pool.spotPriceInGivenOut(daiToUsdc);

    expect(usdcToDaiSell).toStrictEqual(daiToUsdcBuy);
    expect(usdcToDaiBuy).toStrictEqual(daiToUsdcSell);
  });

  it('Should return valid reverse spot pairs for 2 reserves - same decimals', async () => {
    const pool = StableSwap.fromPool(stablePool100 as StableSwapBase);

    const usdcToUsdt = pool.parsePair(21, 23);
    const usdcToUsdtSell = pool.spotPriceOutGivenIn(usdcToUsdt);
    const usdcToUsdtBuy = pool.spotPriceInGivenOut(usdcToUsdt);

    const usdtToUsdc = pool.parsePair(23, 21);
    const usdtToUsdcSell = pool.spotPriceOutGivenIn(usdtToUsdc);
    const usdtToUsdcBuy = pool.spotPriceInGivenOut(usdtToUsdc);

    expect(usdcToUsdtSell).toStrictEqual(usdtToUsdcBuy);
    expect(usdcToUsdtBuy).toStrictEqual(usdtToUsdcSell);
  });

  it('Should return valid reverse spot pairs for share (100) & reserve (21)', async () => {
    const pool = StableSwap.fromPool(stablePool100 as StableSwapBase);

    const shareToUsdc = pool.parsePair(100, 21);
    const shareToUsdcSell = pool.spotPriceOutGivenIn(shareToUsdc);
    const shareToUsdcBuy = pool.spotPriceInGivenOut(shareToUsdc);

    const uscToShare = pool.parsePair(21, 100);
    const uscToShareSell = pool.spotPriceOutGivenIn(uscToShare);
    const uscToShareBuy = pool.spotPriceInGivenOut(uscToShare);

    expect(shareToUsdcSell).toStrictEqual(uscToShareBuy);
    expect(shareToUsdcBuy).toStrictEqual(uscToShareSell);
  });

  it('Should return valid reverse spot pairs for share (100) & reserve (18)', async () => {
    const pool = StableSwap.fromPool(stablePool100 as StableSwapBase);

    const shareToDai = pool.parsePair(100, 18);
    const shareToDaiSell = pool.spotPriceOutGivenIn(shareToDai);
    const shareToDaiBuy = pool.spotPriceInGivenOut(shareToDai);

    const daiToShare = pool.parsePair(18, 100);
    const daiToShareSell = pool.spotPriceOutGivenIn(daiToShare);
    const daiToShareBuy = pool.spotPriceInGivenOut(daiToShare);

    expect(shareToDaiSell).toStrictEqual(daiToShareBuy);
    expect(shareToDaiBuy).toStrictEqual(daiToShareSell);
  });
});
