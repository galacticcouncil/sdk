import {
  createSdkContext,
  EvmClient,
  SubstrateTransaction,
} from '@galacticcouncil/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';

import { evm as evmSigner, substrate as substrateSigner } from './signers';

const WS_ENDPOINT = 'wss://hydration-rpc.n.dwellir.com';
const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

// Initialize conn & create sdk context

const wsProvider = new WsProvider(
  WS_ENDPOINT,
  2_500,
  {},
  60_000,
  102400,
  10 * 60_000
);
const apiPromise = await ApiPromise.create({ provider: wsProvider });

const sdk = createSdkContext(apiPromise);

const { api, evm, tx } = sdk;

// Trade

const trade = await api.router.getBestSell('69', '5', '1');
print(trade);

const tradeTx = await tx
  .trade(trade)
  .withSlippage(1)
  .withBeneficiary(BENEFICIARY)
  .build();
print(tradeTx.get());

const { executionResult } = await tradeTx.dryRun(BENEFICIARY);
print(executionResult);

// Cleanup

setTimeout(() => {
  sdk.destroy();
  apiPromise.disconnect();
  console.log('Unsubscribed');
}, 60000);

// Helpers

function print(object: any) {
  console.log(JSON.stringify(object.toHuman(), null, 2));
}

function signWithEvm(
  beneficiary: string,
  evm: EvmClient,
  tx: SubstrateTransaction
) {
  evmSigner.signAndSend(
    beneficiary,
    evm,
    tx,
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

function sign(beneficiary: string, api: ApiPromise, tx: SubstrateTransaction) {
  substrateSigner.signAndSend(
    beneficiary,
    api,
    tx,
    ({ status }) => {
      console.log(status.toHuman());
    },
    (error) => {
      console.error(error);
    }
  );
}
