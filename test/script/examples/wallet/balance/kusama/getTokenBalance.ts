import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../../../executor';
import { TokenBalanceAdapter } from '../../../../../../src/wallet';
import { ChainAsset, KusamaRegistry } from '../../../../../../src/registry';
import { BASILISK_PARACHAIN_ID } from '../../../../../../src/consts';
import { firstValueFrom } from 'rxjs';

class TokenBalanceAdapterExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const assetSymbol = 'USDT';
    const chainId = BASILISK_PARACHAIN_ID;

    const registry = new KusamaRegistry();
    const adapter = new TokenBalanceAdapter(api);

    const chainAssets = registry.getAssets(chainId);
    const chainAsset = chainAssets.find((asset: ChainAsset) => asset.symbol == assetSymbol);
    const ob = adapter.getObserver(chainAsset!, 'Ed6e66kkcbjEPtpxk7JHTTRJx2xhm4Yka3pE2BuJRRpo9jp');

    return firstValueFrom(ob);
  }
}

new TokenBalanceAdapterExample(ApiUrl.Basilisk, 'Get balance', true).run();
