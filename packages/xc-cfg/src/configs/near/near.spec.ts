import { ConfigService, Ntt, Wormhole } from '@galacticcouncil/xc-core';

import { assetsMap, near, wnear, zec } from '../../assets';
import { chainsMap, hydration, near_chain } from '../../chains';
import { routesMap } from '../index';
import { Tag } from '../../tags';

/** sha256 of the ntt accounts, as wormholescan reports them. */
const WNEAR_EMITTER =
  '0xd473056b88c2062503ea1425bdea8e87609e3d499b3b4d1809e440df2d7cb9e3';
const ZEC_EMITTER =
  '0xca4092420316d55cfbb9a479ca23fdf0f5a0864a80c755b46e071c834fbf3976';

describe('near mainnet routes', () => {
  const config = new ConfigService({
    assets: assetsMap,
    chains: chainsMap,
    routes: routesMap,
  });

  it.each([
    ['native near', near, near],
    ['wnear', wnear, near],
    ['zec', zec, zec],
  ])('should route %s to hydration, self-redeem only', (_, from, to) => {
    const routes = config.getAssetRoutes(from, near_chain, hydration);
    expect(routes).toHaveLength(1);

    const [route] = routes;
    expect(route.destination.asset).toBe(to);
    expect(route.source.fee?.asset).toBe(near);
    expect(route.functionCall).toBeDefined();
    expect(route.tags).toEqual([Tag.Wormhole, Tag.Ntt]);
  });

  it.each([
    ['near', near, wnear],
    ['zec', zec, zec],
  ])(
    'should route hydration %s back to near, self-redeem only',
    (_, from, to) => {
      const routes = config.getAssetRoutes(from, hydration, near_chain);
      expect(routes).toHaveLength(1);

      const [route] = routes;
      expect(route.destination.asset).toBe(to);
      expect(route.contract).toBeDefined();
      expect(route.extrinsic).toBeDefined();
      expect(route.tags).toEqual([Tag.Wormhole, Tag.Ntt]);
    }
  );

  it('should pair the hydration burning managers with the near lockers', () => {
    expect(hydration.getAssetId(near)).toBe(1001358);
    expect(hydration.getAssetId(zec)).toBe(1001357);
    expect(Ntt.fromChain(hydration, near).token).toBe(
      '0x00000000000000000000000000000001000f478e'
    );
    expect(Ntt.fromChain(hydration, zec).token).toBe(
      '0x00000000000000000000000000000001000f478d'
    );

    expect(Ntt.fromChain(near_chain, near)).toBe(
      Ntt.fromChain(near_chain, wnear)
    );
    expect(Ntt.fromChain(near_chain, wnear).token).toBe('wrap.near');
    expect(Ntt.fromChain(near_chain, zec).token).toBe('zec.omft.near');
  });

  it('should resolve the near emitters to their assets', () => {
    const wormhole = Wormhole.fromChain(near_chain);

    expect(Ntt.findByEmitter(near_chain, WNEAR_EMITTER)?.assetKey).toBe(
      near.key
    );
    expect(Ntt.findByEmitter(near_chain, ZEC_EMITTER)?.assetKey).toBe(zec.key);
    expect(
      wormhole.normalizeAddress('ntt-near.hydration-whm.near').toLowerCase()
    ).toBe(WNEAR_EMITTER);
    expect(
      wormhole.normalizeAddress('ntt-zec.hydration-whm.near').toLowerCase()
    ).toBe(ZEC_EMITTER);
  });
});
