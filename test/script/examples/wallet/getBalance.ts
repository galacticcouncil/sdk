import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { Registry } from '../../../../src/registry';
import { AcalaEvmProvider } from '../../../../src/wallet/evm/AcalaEvmProvider';
import { firstValueFrom } from 'rxjs';
import { Wallet } from '../../../../src/wallet/Wallet';

const ACALA_PARACHAIN_ID = 2000;
const ACALA_EVM_PROVIDER = 'https://rpc.evm.acala.network';

class Erc20BalanceAdapterExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const registry = new Registry('polkadot');
    const evmProvider = new AcalaEvmProvider(api, ACALA_EVM_PROVIDER);

    const assets = registry.getAssets(ACALA_PARACHAIN_ID);
    const acalaWallet = new Wallet(api, assets, { evmProvider: evmProvider });
    const ob = acalaWallet.subscribeBalance('DAI', 'Erc20', '5FkNiM6iAQ6rrNk9muuWbSnfWufdJ5wdRa4uQmkxnCAit88n');

    return firstValueFrom(ob);
  }
}

new Erc20BalanceAdapterExample(ApiUrl.Acala, 'Get balance', true).run();
