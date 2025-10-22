import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm } from '../../../../src';

class SubscribeHsm extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { StableSwapClient } = pool.stable;
    const { HsmPoolClient } = pool.hsm;

    const stableClient = new StableSwapClient(client, evm);
    const hsmClient = new HsmPoolClient(client, evm, stableClient);

    const print = (pools: pool.hsm.HsmPoolBase[]) => {
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
