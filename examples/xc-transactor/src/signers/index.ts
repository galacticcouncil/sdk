import { AnyChain } from '@galacticcouncil/xc-core';
import { Call } from '@galacticcouncil/xc-sdk';

import * as evm from './evm';

export async function sign(call: Call, chain: AnyChain) {
  evm.signAndSend(
    call,
    chain,
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
