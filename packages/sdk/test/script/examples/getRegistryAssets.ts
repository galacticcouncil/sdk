import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../executor';
import { AssetClient } from '../../../src/client';

class GetAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const external = [
      {
        decimals: 10,
        id: '30',
        name: 'DED',
        origin: 1000,
        symbol: 'DED',
      },
      {
        decimals: 10,
        id: '23',
        name: 'PINK',
        origin: 1000,
        symbol: 'PINK',
      },
    ];
    const assetClient = new AssetClient(api);
    return assetClient.getOnChainAssets(external);
  }
}

new GetAssetsExample(ApiUrl.HydraDx, 'Get all assets').run();
