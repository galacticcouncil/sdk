import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { EvmClient } from '../../../../src/evm';
import { hsm, stable } from '../../../../src/pool';

class SubscribeHsm extends PapiExecutor {
  async script(client: PolkadotClient, evm: EvmClient) {
    const { StableSwapClient } = stable;
    const { HsmPoolClient } = hsm;

    const stableClient = new StableSwapClient(client, evm);
    const hsmClient = new HsmPoolClient(client, evm, stableClient);

    const print = (pools: hsm.HsmPoolBase[]) => {
      pools.forEach((pool) => {
        console.log(pool.address, pool.collateralBalance);
      });
      this.logTime();
    };

    const hsmConsumer = hsmClient.getSubscriber();
    const subscription = hsmConsumer.subscribe(print);
    return () => {
      subscription.unsubscribe();
      client.destroy();
    };
  }
}

new SubscribeHsm(ApiUrl.Hydration, 'Subscribe hsm').run();
