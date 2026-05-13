import {
  Call,
  EvmSigner,
  SolanaSigner,
  SuiSigner,
} from '@galacticcouncil/xc-sdk';
import {
  AnyEvmChain,
  SolanaChain,
  SuiChain,
} from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

const { H160 } = h160;

export type SignEvents = {
  onSubmit?: (id: string) => void;
  onConfirmed?: (info: string) => void;
  onStatus?: (info: string) => void;
  onError?: (error: unknown) => void;
};

export async function signEvm(
  call: Call,
  chain: AnyEvmChain,
  events: SignEvents = {}
) {
  const client = chain.evmClient;
  const account = H160.fromAny(call.from);
  const wallet = client.getSigner(account);

  await wallet.switchChain({ id: client.chain.id });
  await wallet.request({ method: 'eth_requestAccounts' });

  return new Promise<void>((resolve, reject) => {
    new EvmSigner(chain, wallet).signAndSend(call, {
      onTransactionSend: (hash) => events.onSubmit?.(hash),
      onTransactionReceipt: (receipt) => {
        events.onConfirmed?.('Block: ' + receipt.blockNumber);
        resolve();
      },
      onError: (error) => {
        events.onError?.(error);
        reject(error);
      },
    });
  });
}

export async function signSolanaBundle(
  calls: Call[],
  chain: SolanaChain,
  events: SignEvents = {}
) {
  const wallet = (window as any).phantom?.solana;
  if (!wallet) throw new Error('Phantom (Solana) wallet not detected.');

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    new SolanaSigner(chain, wallet).signAndSendAll(calls, {
      onTransactionSend: (bundleId) => events.onSubmit?.(bundleId),
      onBundleStatus: (status) => {
        events.onStatus?.(JSON.stringify(status));
        if (!settled && (status as any)?.confirmed) {
          settled = true;
          resolve();
        }
      },
      onError: (error) => {
        events.onError?.(error);
        reject(error);
      },
    });
  });
}

export async function signSui(
  call: Call,
  chain: SuiChain,
  events: SignEvents = {}
) {
  const wallet = (window as any).phantom?.sui;
  if (!wallet) throw new Error('Phantom (Sui) wallet not detected.');

  return new Promise<void>((resolve, reject) => {
    new SuiSigner(chain, wallet).signAndSend(call, {
      onTransactionSend: (hash) => {
        events.onConfirmed?.('TxHash: ' + hash);
        resolve();
      },
      onError: (error) => {
        events.onError?.(error);
        reject(error);
      },
    });
  });
}
