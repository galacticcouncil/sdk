import { WRAP_NEAR_ASSET, ZEC_ASSET } from './consts';
import { CHAINS } from './chains';
import {
  DEFAULT_DESTINATION_ASSET_IDS,
  tokenToAsset,
  toOriginAsset,
} from './assets';
import { buildRoutes } from './routes';

describe('registry', () => {
  it('maps an sdk-next asset to an origin asset (ERC-20 precompile address)', () => {
    const origin = toOriginAsset({
      id: 5,
      symbol: 'DOT',
      decimals: 10,
    } as any);
    expect(origin).toMatchObject({
      key: '5',
      symbol: 'DOT',
      decimals: 10,
      chain: 'hydration',
      id: 5,
      // HydrationConsts.toErc20: address((uint160(1) << 32) | assetId)
      address: '0x0000000000000000000000000000000100000005',
    });
  });

  it('defaults the destination allowlist to wrapped NEAR + ZEC', () => {
    expect(DEFAULT_DESTINATION_ASSET_IDS).toEqual([WRAP_NEAR_ASSET, ZEC_ASSET]);
  });

  it('maps a 1Click token to a destination asset', () => {
    const asset = tokenToAsset({
      assetId: 'nep141:zec.omft.near',
      decimals: 8,
      blockchain: 'zec',
      symbol: 'ZEC',
      price: 529.98,
      priceUpdatedAt: '2026-05-28T14:36:00.533Z',
    } as any);
    expect(asset).toMatchObject({
      key: 'nep141:zec.omft.near',
      symbol: 'ZEC',
      decimals: 8,
      chain: 'zec',
      oneClickId: 'nep141:zec.omft.near',
    });
  });

  it('exposes hydration + near + zec chains', () => {
    expect(CHAINS.map((c) => c.key).sort()).toEqual([
      'hydration',
      'near',
      'zec',
    ]);
  });

  it('builds an executable route per destination asset', () => {
    const routes = buildRoutes([
      {
        key: 'nep141:wrap.near',
        symbol: 'wNEAR',
        decimals: 24,
        chain: 'near',
        oneClickId: 'nep141:wrap.near',
      },
    ]);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      executable: true,
      oneClickOriginAsset: 'nep141:eth.omft.near',
    });
    expect(routes[0].origin.key).toBe('hydration');
    expect(routes[0].destination.key).toBe('near');
  });
});
