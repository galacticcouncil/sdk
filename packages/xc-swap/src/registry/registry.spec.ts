import { toErc20, WETH_ID, GLMR_ID } from './consts';
import { CHAINS } from './chains';
import { DESTINATION_ASSETS, toOriginAsset } from './assets';
import { ROUTES } from './routes';

describe('registry', () => {
  it('maps a Hydration asset id to its ERC-20 precompile address', () => {
    // HydrationConsts.toErc20: address((uint160(1) << 32) | assetId)
    expect(toErc20(0)).toBe('0x0000000000000000000000000000000100000000');
    expect(toErc20(WETH_ID)).toBe('0x0000000000000000000000000000000100000014');
    expect(toErc20(GLMR_ID)).toBe('0x0000000000000000000000000000000100000010');
  });

  it('exposes wrapped NEAR as the only phase-1 destination asset', () => {
    expect(DESTINATION_ASSETS).toHaveLength(1);
    expect(DESTINATION_ASSETS[0].oneClickId).toBe('nep141:wrap.near');
    expect(DESTINATION_ASSETS[0].chain).toBe('near');
  });

  it('exposes hydration + near chains', () => {
    expect(CHAINS.map((c) => c.key).sort()).toEqual(['hydration', 'near']);
  });

  it('maps an sdk-next asset to an origin asset descriptor', () => {
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
      address: '0x0000000000000000000000000000000100000005',
    });
  });

  it('exposes an executable hydration -> near route', () => {
    expect(ROUTES).toHaveLength(1);
    expect(ROUTES[0]).toMatchObject({
      executable: true,
      oneClickOriginAsset: 'nep141:eth.omft.near',
    });
    expect(ROUTES[0].origin.key).toBe('hydration');
    expect(ROUTES[0].destination.key).toBe('near');
  });
});
