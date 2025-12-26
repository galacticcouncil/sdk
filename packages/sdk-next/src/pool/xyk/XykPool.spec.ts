import { XykPool } from './XykPool';

import { xykPoolWud } from '../../../test/data';

describe('Xyk Pool', () => {
  it('Should return valid reverse spot pairs for assets 1000085 & 0', async () => {
    const pool = XykPool.fromPool(xykPoolWud);

    const wudToHdx = pool.parsePair(1000085, 0);
    const wudToHdxSell = pool.spotPriceOutGivenIn(wudToHdx);
    const wudToHdxBuy = pool.spotPriceInGivenOut(wudToHdx);

    const hdxToWud = pool.parsePair(0, 1000085);
    const hdxToWudSell = pool.spotPriceOutGivenIn(hdxToWud);
    const hdxToWudBuy = pool.spotPriceInGivenOut(hdxToWud);

    expect(wudToHdxSell).toStrictEqual(hdxToWudBuy);
    expect(wudToHdxBuy).toStrictEqual(hdxToWudSell);
  });
});
