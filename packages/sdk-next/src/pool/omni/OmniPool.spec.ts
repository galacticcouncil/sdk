import { OmniPool } from './OmniPool';

import { omniPool } from '../../../test/data';

describe('Omnipool', () => {
  it('Should return valid reverse spot pairs for ksm (12 decimals) & hollar (18 decimals)', async () => {
    const pool = OmniPool.fromPool(omniPool);

    const ksmToHollar = pool.parsePair(1000771, 222);
    const ksmToHollarSell = pool.spotPriceOutGivenIn(ksmToHollar);
    const ksmToHollarBuy = pool.spotPriceInGivenOut(ksmToHollar);

    const hollarToKsm = pool.parsePair(222, 1000771);
    const hollarToKsmSell = pool.spotPriceOutGivenIn(hollarToKsm);
    const hollarToKsmBuy = pool.spotPriceInGivenOut(hollarToKsm);

    expect(ksmToHollarSell).toStrictEqual(hollarToKsmBuy);
    expect(ksmToHollarBuy).toStrictEqual(hollarToKsmSell);
  });

  it('Should return valid reverse spot pairs for geth & hollar (both 18 decimals)', async () => {
    const pool = OmniPool.fromPool(omniPool);

    const gethToHollar = pool.parsePair(420, 222);
    const gethToHollarSell = pool.spotPriceOutGivenIn(gethToHollar);
    const gethToHollarBuy = pool.spotPriceInGivenOut(gethToHollar);

    const hollarToGeth = pool.parsePair(222, 420);
    const hollarToGethSell = pool.spotPriceOutGivenIn(hollarToGeth);
    const hollarToGethBuy = pool.spotPriceInGivenOut(hollarToGeth);

    expect(gethToHollarSell).toStrictEqual(hollarToGethBuy);
    expect(gethToHollarBuy).toStrictEqual(hollarToGethSell);
  });

  it('Should return valid reverse spot pairs for ksm & hdx (both 12 decimals)', async () => {
    const pool = OmniPool.fromPool(omniPool);

    const ksmToHdx = pool.parsePair(1000771, 0);
    const ksmToHdxSell = pool.spotPriceOutGivenIn(ksmToHdx);
    const ksmToHdxBuy = pool.spotPriceInGivenOut(ksmToHdx);

    const hdxToKsm = pool.parsePair(0, 1000771);
    const hdxToKsmSell = pool.spotPriceOutGivenIn(hdxToKsm);
    const hdxToKsmBuy = pool.spotPriceInGivenOut(hdxToKsm);

    expect(ksmToHdxSell).toStrictEqual(hdxToKsmBuy);
    expect(ksmToHdxBuy).toStrictEqual(hdxToKsmSell);
  });
});
