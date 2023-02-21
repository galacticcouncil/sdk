import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../../executor';
import { Erc20BalanceAdapter } from '../../../../../src/wallet';
import { ChainAsset, Registry } from '../../../../../src/registry';
import { firstValueFrom } from 'rxjs';

const ACALA_PARACHAIN_ID = 2000;
const ACALA_EVM_PROVIDER = 'https://rpc.evm.acala.network';

class Erc20BalanceAdapterExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const registry = new Registry('polkadot');
    const adapter = new Erc20BalanceAdapter(api, ACALA_EVM_PROVIDER);

    const acalaAssets = registry.getAssets(ACALA_PARACHAIN_ID);
    const weth = acalaAssets.find((asset: ChainAsset) => asset.symbol == 'WETH' && asset.asset['Erc20']);
    const ob = adapter.getObserver(weth!, '0x6dBA3F038becC02f4FC81EF25b3059D55a28caBc');

    return firstValueFrom(ob);
  }
}

new Erc20BalanceAdapterExample(ApiUrl.Acala, 'Get balance', true).run();
