import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../executor';
import { AssetClient } from '../../../src/client';

class GetAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const external = [
      {
        decimals: 8,
        origin: 1000,
        id: '666',
        name: 'Danger Coin',
        symbol: 'DANGER',
      },
    ];
    const assetClient = new AssetClient(api);
    return assetClient.getOnChainAssets(external);
  }
}

new GetAssetsExample(ApiUrl.Nice, 'Get all assets').run();
