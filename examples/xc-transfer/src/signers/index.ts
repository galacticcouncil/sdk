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

const { isEvmAccount, H160 } = h160;

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

export async function signEvm(
  call: Call,
  chain: AnyChain,
  callback?: (hash: string) => void
) {
  const ctx = chain as AnyEvmChain;
  const client = ctx.evmClient;

  const account = H160.fromAny(call.from);

  const wallet = client.getSigner(account);
  await wallet.switchChain({ id: client.chain.id });
  await wallet.request({ method: 'eth_requestAccounts' });

  // Resolve once the tx is CONFIRMED so callers can `await` and chain txs
  // (approve → swapAndBridge). Reject on send/estimate/receipt errors so a
  // failure surfaces instead of the loop hanging silently.
  await new Promise<void>((resolve, reject) => {
    new EvmSigner(ctx, wallet)
      .signAndSend(call, {
        onTransactionSend: (hash) => {
          console.log('TxHash: ' + hash);
          callback?.(hash);
        },
        onTransactionReceipt: (receipt) => {
          console.log('Confirmed in block:', receipt.blockNumber);
          resolve();
        },
        onError: (error) => {
          console.error(error);
          reject(error);
        },
      })
      .catch(reject);
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
