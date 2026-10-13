import {
  ConfigService,
  PaymentConfigBuilderParams,
} from '@galacticcouncil/xc-core';

import { assetsMap, zec } from '../../assets';
import { chainsMap, hydration, zcash } from '../../chains';
import { routesMap } from '../index';
import { Tag } from '../../tags';

describe('zcash mainnet routes', () => {
  const config = new ConfigService({
    assets: assetsMap,
    chains: chainsMap,
    routes: routesMap,
  });

  it('should route zec to hydration through omni, self-redeem only', () => {
    const routes = config.getAssetRoutes(zec, zcash, hydration);
    expect(routes).toHaveLength(1);

    const [route] = routes;
    expect(route.destination.asset).toBe(zec);
    expect(route.source.fee?.asset).toBe(zec);
    expect(route.payment).toBeDefined();
    expect(route.tags).toEqual([Tag.Omni, Tag.Wormhole, Tag.Ntt]);
  });

  it('should fail closed until the integrator registers an omni client', async () => {
    expect(zcash.omniClient).toBeUndefined();

    const [route] = config.getAssetRoutes(zec, zcash, hydration);
    const ctx = {
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      amount: 100_000n,
      asset: zec,
      sender: 't1NyxCchMSJD5bUhKhKFzFnFnqEtvLbxMEG',
      source: { chain: zcash },
      destination: { chain: hydration },
    } as PaymentConfigBuilderParams;

    await expect(route.payment!.build(ctx)).rejects.toThrow(
      'No Omni client registered on Zcash'
    );
  });
});
