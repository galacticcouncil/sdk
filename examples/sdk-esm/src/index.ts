import { createSdkContext } from '@galacticcouncil/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';

import { signAndSend } from './signers/evm';

const ws = 'wss://hydration-rpc.n.dwellir.com';
const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

const wsProvider = new WsProvider(ws, 2_500, {}, 60_000, 102400, 10 * 60_000);
const apiPromise = await ApiPromise.create({ provider: wsProvider });

const sdk = createSdkContext(apiPromise);

const { api, evm, tx } = sdk;

const trade = await api.router.getBestSell('69', '5', '1');
print(trade);

const tradeTx = await tx.trade(trade).withBeneficiary(BENEFICIARY).build();
print(tradeTx.get());

const { executionResult } = await tradeTx.dryRun(BENEFICIARY);
print(executionResult);

//signEvm(tradeTx.hex);

setTimeout(() => {
  sdk.destroy();
  apiPromise.disconnect();
  console.log('Unsubscribed');
}, 60000);

function print(object: any) {
  console.log(JSON.stringify(object.toHuman(), null, 2));
}

function signEvm(call: string) {
  signAndSend(
    BENEFICIARY,
    call,
    apiPromise,
    evm,
    (hash) => {
      console.log('TxHash: ' + hash);
    },
    (receipt) => {
      console.log(receipt);
    },
    (error) => {
      console.error(error);
    }
  );
}
