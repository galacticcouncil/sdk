import { ConfigService, Ntt, Wormhole } from '@galacticcouncil/xc-core';

import { assetsMap, near, wnear } from '../assets';
import { chainsMap, hydration, near_testnet } from '../chains';
import { routesMap } from '../configs';
import { Tag } from '../tags';

import { registerNear } from './near';

/** sha256 of `ntt-near.whm-ntt-0bugdc.testnet`, as wormholescan reports it. */
const EMITTER =
  '0x34831e4dba0ea821cb7f0af0ce96f5efe4beb0db1fded12219e4329ff95a7213';

describe('near testnet profile', () => {
  // Its hydration leg takes the asset id mainnet hands to its next
  // registration, so none of it ships by default.
  it('should stay out of the default config', () => {
    expect(routesMap.has(near_testnet.key)).toBe(false);
    expect(routesMap.get(hydration.key)!.getAssetRoutes(wnear)).toHaveLength(0);
    expect(Wormhole.fromChain(hydration).ntt[wnear.key]).toBeUndefined();
  });

  describe('registered', () => {
    const config = new ConfigService({
      assets: assetsMap,
      chains: chainsMap,
      routes: routesMap,
    });

    beforeAll(() => registerNear(config));

    it('should route wnear & native near to hydration wnear', () => {
      for (const asset of [wnear, near]) {
        const [route] = config.getAssetRoutes(asset, near_testnet, hydration);
        expect(route.destination.asset).toBe(wnear);
        expect(route.functionCall).toBeDefined();
        expect(route.tags).toEqual([Tag.Wormhole, Tag.Ntt]);
      }
    });

    it('should route hydration wnear back to near testnet', () => {
      const [route] = config.getAssetRoutes(wnear, hydration, near_testnet);
      expect(route.destination.asset).toBe(wnear);
      expect(route.contract).toBeDefined();
      expect(route.extrinsic).toBeDefined();
    });

    it('should register the fork leg on hydration', () => {
      expect(hydration.getAssetId(wnear)).toBe(1355);
      expect(Ntt.fromChain(hydration, wnear)).toMatchObject({
        manager: '0x5b1334885320cFd7158760256c7bD0Af58006b09',
        transceiver: {
          wormhole: '0x5e875F689EA8dd25e11a69cfb6C9f844C4b3B207',
        },
      });
    });

    it('should resolve the near testnet emitter to wnear', () => {
      expect(Ntt.findByEmitter(near_testnet, EMITTER)?.assetKey).toBe(
        wnear.key
      );
    });

    it('should leave the default routes untouched', () => {
      expect(routesMap.has(near_testnet.key)).toBe(false);
    });
  });
});
