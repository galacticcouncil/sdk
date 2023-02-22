import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../../executor';
import { Erc20BalanceAdapter } from '../../../../../src/wallet';
import { ChainAsset, PolkadotRegistry } from '../../../../../src/registry';
import { AcalaEvmProvider } from '../../../../../src/wallet/evm/AcalaEvmProvider';
import { firstValueFrom } from 'rxjs';

const ACALA_PARACHAIN_ID = 2000;
const ACALA_EVM_PROVIDER = 'wss://eth-rpc-acala.aca-api.network/ws';

class Erc20BalanceAdapterExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const registry = new PolkadotRegistry();
    const acalaEvmProvider = new AcalaEvmProvider(api, ACALA_EVM_PROVIDER);
    const adapter = new Erc20BalanceAdapter(acalaEvmProvider);

    const acalaAssets = registry.getAssets(ACALA_PARACHAIN_ID);
    const dai = acalaAssets.find((asset: ChainAsset) => asset.symbol == 'DAI' && asset.asset['Erc20']);
    const ob = adapter.getObserver(dai!, '5FkNiM6iAQ6rrNk9muuWbSnfWufdJ5wdRa4uQmkxnCAit88n');

    return firstValueFrom(ob);
  }
}

new Erc20BalanceAdapterExample(ApiUrl.Acala, 'Get balance', true).run();
