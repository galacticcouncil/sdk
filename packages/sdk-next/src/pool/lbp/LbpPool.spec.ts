import { LbpPool, LbpPoolBase } from './LbpPool';

import { lbpPool } from '../../../test/data';

describe('Xyk Pool', () => {
  it('Should return valid reverse spot pairs for assets 123456 & 0', async () => {
    const pool = LbpPool.fromPool(lbpPool as LbpPoolBase);

    const inToOut = pool.parsePair(123456, 0);
    const inToOutSell = pool.spotPriceOutGivenIn(inToOut);
    const inToOutBuy = pool.spotPriceInGivenOut(inToOut);

    const outToIn = pool.parsePair(0, 123456);
    const outToInSell = pool.spotPriceOutGivenIn(outToIn);
    const outToInBuy = pool.spotPriceInGivenOut(outToIn);

    expect(inToOutSell).toStrictEqual(outToInBuy);
    expect(inToOutBuy).toStrictEqual(outToInSell);
  });
});
