import { AssetRoute } from '@galacticcouncil/xc-core';

import { eth, eurc, eurc_wh, usdc, usdc_wh, weth_wh } from '../assets';
import { base, ethereum, hydration } from '../chains';
import { Tag } from '../tags';

import { baseConfig } from './evm/base';
import { ethereumConfig } from './evm/ethereum';
import { hydrationConfig } from './polkadot/hydration';

const isExecutor = (route: AssetRoute) => route.tags?.includes(Tag.NttExecutor);

describe('ntt route configs', () => {
  describe('self-redeem & executor offered in parallel', () => {
    it.each([
      ['ethereum erc20', ethereumConfig, usdc, hydration, usdc_wh],
      ['ethereum native', ethereumConfig, eth, hydration, weth_wh],
      ['base erc20', baseConfig, eurc, hydration, eurc_wh],
      ['hydration -> ethereum', hydrationConfig, usdc_wh, ethereum, usdc],
      ['hydration -> base', hydrationConfig, eurc_wh, base, eurc],
    ])('%s exposes both delivery models', (_, config, from, to, target) => {
      // Other bridges can serve the same pair (base eurc is also Basejump),
      // so narrow to ntt before splitting on the delivery model.
      const routes = config
        .getAssetDestinationRoutes(from, to)
        .filter((r) => r.destination.asset.key === target.key)
        .filter((r) => r.tags?.includes(Tag.Ntt));

      expect(routes.filter(isExecutor)).toHaveLength(1);
      expect(routes.filter((r) => !isExecutor(r))).toHaveLength(1);
    });
  });

  describe('executor routes', () => {
    const executorRoutes = [
      ...ethereumConfig.getRoutes(),
      ...baseConfig.getRoutes(),
      ...hydrationConfig.getRoutes(),
    ].filter(isExecutor);

    it('should be tagged as ntt too, so ntt consumers still match them', () => {
      for (const route of executorRoutes) {
        expect(route.tags).toContain(Tag.Ntt);
        expect(route.tags).toContain(Tag.Wormhole);
      }
    });

    it('should charge a destination fee, except from a native gas source', () => {
      for (const route of executorRoutes) {
        const { fee } = route.destination;
        // eth on ethereum is the only native gas ntt source - its cost is
        // already folded into the source fee by EvmPlatform.estimateFee.
        const isNativeSource = route.source.asset.key === eth.key;
        expect(fee.amount === 0).toBe(isNativeSource);
      }
    });

    // quoteExecutorCost returns a raw evm value (deliveryPrice + executor
    // cost), so the fee asset has to be the source chain's evm gas token at
    // 18 decimals. Naming hdx here charged the wrong balance and resolved to
    // 12 decimals via the chain-currency fallback, inflating it 10^6x.
    it.each([
      ['ethereum', ethereumConfig, ethereum, eth],
      ['base', baseConfig, base, eth],
      ['hydration', hydrationConfig, hydration, weth_wh],
    ])(
      'should charge %s gas in its evm native asset',
      (_, config, chain, gas) => {
        const routes = config.getRoutes().filter(isExecutor);
        expect(routes.length).toBeGreaterThan(0);

        for (const route of routes) {
          const { fee } = route.destination;
          if (fee.amount === 0) continue; // native source, charged at the source
          expect(fee.asset.key).toBe(gas.key);
          expect(chain.getAssetDecimals(fee.asset)).toBe(18);
        }
      }
    );
  });
});
