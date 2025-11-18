import { Call } from '@galacticcouncil/xcm-sdk';
import { AnyChain, CallType } from '@galacticcouncil/xcm-core';
import { isEvmAccount } from '@galacticcouncil/sdk';

import * as evm from './evm';
import * as solana from './solana';
import * as solanaJit from './solanaJit';
import * as sui from './sui';
import * as substrate from './substrate';

export async function signSubstrate(call: Call, chain: AnyChain) {
  substrate.signAndSend(
    call,
    chain,
    ({ status }) => {
      console.log(status.toHuman());
    },
    (error) => {
      console.error(error);
    }
  );
}

async function signEvm(call: Call, chain: AnyChain) {
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

export async function signSolana(call: Call, chain: AnyChain) {
  solana.signAndSend(
    call,
    chain,
    (hash) => {
      console.log('TxHash: ' + hash);
    },
    (error) => {
      console.error(error);
    }
  );
}

export async function signSolanaBundle(calls: Call[], chain: AnyChain) {
  solanaJit.signAndSend(calls, chain, (error) => {
    console.error(error);
  });
}

export async function signSui(call: Call, chain: AnyChain) {
  sui.signAndSend(
    call,
    chain,
    (hash) => {
      console.log('TxHash: ' + hash);
    },
    (error) => {
      console.error(error);
    }
  );
}

export async function sign(call: Call, chain: AnyChain) {
  switch (call.type) {
    case CallType.Evm:
      signEvm(call, chain);
      break;
    case CallType.Solana:
      signSolana(call, chain);
      break;
    case CallType.Sui:
      signSui(call, chain);
      break;
    default:
      if (isEvmAccount(call.from)) {
        signEvm(call, chain);
      } else {
        signSubstrate(call, chain);
      }
  }
}
