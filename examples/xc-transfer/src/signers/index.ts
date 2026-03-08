import {
  Call,
  SubstrateCall,
  SubstrateSigner,
  EvmSigner,
  SolanaSigner,
  SuiSigner,
} from '@galacticcouncil/xc-sdk';
import {
  AnyChain,
  AnyEvmChain,
  AnyParachain,
  CallType,
  SolanaChain,
  SuiChain,
} from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

import { pjs } from './extension';

const { isEvmAccount } = h160;

export async function signSubstrate(call: Call, chain: AnyChain) {
  const ctx = chain as AnyParachain;
  const signer = await pjs.getSignerBySource('polkadot-js', call.from);
  new SubstrateSigner(ctx, signer).signAndSend(call as SubstrateCall, {
    onTransactionSend: (hash) => {
      console.log('TxHash: ' + hash);
    },
    onFinalized: (event) => {
      console.log('Finalized:', event);
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export async function signEvm(call: Call, chain: AnyChain) {
  const ctx = chain as AnyEvmChain;
  const client = ctx.evmClient;
  const wallet = client.getSigner(call.from);
  await wallet.switchChain({ id: client.chain.id });
  await wallet.request({ method: 'eth_requestAccounts' });

  new EvmSigner(ctx, wallet).signAndSend(call, {
    onTransactionSend: (hash) => {
      console.log('TxHash: ' + hash);
    },
    onTransactionReceipt: (receipt) => {
      console.log(receipt);
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export async function signSolana(call: Call, chain: AnyChain) {
  const wallet = (window as any).phantom.solana;
  new SolanaSigner(chain as SolanaChain, wallet).signAndSend(call, {
    onTransactionSend: (hash) => {
      console.log('TxHash: ' + hash);
    },
    onStatus: (status) => {
      console.log(status);
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export async function signSolanaBundle(calls: Call[], chain: AnyChain) {
  const wallet = (window as any).phantom.solana;
  new SolanaSigner(chain as SolanaChain, wallet).signAndSendAll(calls, {
    onTransactionSend: (bundleId) => {
      console.log('BundleId: ' + bundleId);
    },
    onBundleStatus: (status) => {
      console.log(status);
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export async function signSui(call: Call, chain: AnyChain) {
  const wallet = (window as any).phantom.sui;
  new SuiSigner(chain as SuiChain, wallet).signAndSend(call, {
    onTransactionSend: (hash) => {
      console.log('TxHash: ' + hash);
    },
    onError: (error) => {
      console.error(error);
    },
  });
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
