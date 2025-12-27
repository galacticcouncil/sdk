import { ApiPromise } from '@polkadot/api';
import { createSdkContext, toDecimals } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class TestContext extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const ctxP = createSdkContext(api);

    api.rpc.chain.subscribeNewHeads(async (header) => {
      try {
        const ctxN = createSdkContext(api);

        const [poolsP, spotP, poolsN, spotN] = await Promise.all([
          ctxP.ctx.pool.getPools(),
          ctxP.api.router.getBestSpotPrice('10', '0'),
          ctxN.ctx.pool.getPools(),
          ctxN.api.router.getBestSpotPrice('10', '0'),
        ]);

        if (spotP && spotN) {
          const pricePersistent = toDecimals(spotP.amount, spotP.decimals);
          const priceNew = toDecimals(spotN.amount, spotN.decimals);
          const diff = Math.abs(
            ((Number(priceNew) - Number(pricePersistent)) /
              Number(pricePersistent)) *
              100
          );

          if (diff > 0) {
            const stableP = poolsP.find(
              (p) =>
                p.address === '7LVGEVLFXpsCCtnsvhzkSMQARU7gRVCtwMckG7u7d3V6FVvG'
            );
            const omniP = poolsP.find(
              (p) =>
                p.address === '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1'
            );
            const omniPShare = omniP?.tokens.find((t) => t.id === '102');

            const stableN = poolsN.find(
              (p) =>
                p.address === '7LVGEVLFXpsCCtnsvhzkSMQARU7gRVCtwMckG7u7d3V6FVvG'
            );
            const omniN = poolsN.find(
              (p) =>
                p.address === '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1'
            );
            const omniNShare = omniN?.tokens.find((t) => t.id === '102');

            console.log(omniPShare?.balance, omniNShare?.balance);
          }

          console.log(
            `#${header.number.toNumber()} | P: ${pricePersistent} | N: ${priceNew} | Diff: ${diff}%`
          );
        }
      } catch (e) {}
    });
  }
}

new TestContext(ApiUrl.Hydration, 'Test context').run();
