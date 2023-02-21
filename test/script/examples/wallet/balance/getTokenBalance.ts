import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../../executor';
import { TokenBalanceAdapter } from '../../../../../src/wallet';
import { ChainAsset, Registry } from '../../../../../src/registry';
import { HYDRADX_PARACHAIN_ID } from '../../../../../src/consts';
import { firstValueFrom } from 'rxjs';

class TokenBalanceAdapterExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const registry = new Registry('polkadot');
    const adapter = new TokenBalanceAdapter(api);

    const hydraDxAssets = registry.getAssets(HYDRADX_PARACHAIN_ID);
    const dai = hydraDxAssets.find((asset: ChainAsset) => asset.symbol == 'DAI');
    const ob = adapter.getObserver(dai!, '7MHE9BUBEWU88cEto6P1XNNb66foSwAZPKhfL8GHW9exnuH1');

    return firstValueFrom(ob);
  }
}

new TokenBalanceAdapterExample(ApiUrl.HydraDx, 'Get balance', true).run();
