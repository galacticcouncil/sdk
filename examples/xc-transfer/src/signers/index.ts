import {
  Call,
  SubstrateCall,
  SubstrateSigner,
  EvmSigner,
  SolanaSigner,
  SuiSigner,
  SuiWallet,
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

import { Transaction } from '@mysten/sui/transactions';

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
  return new SolanaSigner(chain as SolanaChain, wallet).signAndSend(call, {
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
  return new SolanaSigner(chain as SolanaChain, wallet).signAndSendAll(calls, {
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

type StandardWallet = {
  name: string;
  features: Record<string, any>;
};

/**
 * Wallets registered over the wallet standard (slush & co).
 *
 * The app announces itself and every wallet answers with its registration,
 * so the handshake has to be done both ways - one for the wallets that were
 * injected before this ran, one for the ones that come after.
 */
function standardWallets(): StandardWallet[] {
  const wallets: StandardWallet[] = [];
  const register = (...found: StandardWallet[]) => {
    wallets.push(...found);
    return () => {};
  };

  window.addEventListener('wallet-standard:register-wallet', ((
    e: CustomEvent
  ) => e.detail({ register })) as EventListener);
  window.dispatchEvent(
    new CustomEvent('wallet-standard:app-ready', { detail: { register } })
  );

  return wallets.filter((w) => 'sui:signTransaction' in w.features);
}

/**
 * Sui wallets speak two different dialects: phantom injects
 * `window.phantom.sui`, everything else registers over the wallet standard,
 * whose `signTransaction` takes a Transaction and answers `{bytes, signature}`.
 * Both are adapted onto the sdk's SuiWallet.
 */
async function suiWallet(address: string): Promise<SuiWallet> {
  // Phantom registers here too, so pick slush by name when both are present.
  const standard = standardWallets();
  const wallet =
    standard.find((w) => w.name.toLowerCase().includes('slush')) ?? standard[0];
  if (wallet) {
    const { accounts } = await wallet.features['standard:connect'].connect();
    const account = accounts.find((a: any) => a.address === address);
    if (!account) {
      throw new Error(`${wallet.name} holds no account ${address}`);
    }
    return {
      signTransaction: async ({ transaction }) => {
        const signed = await wallet.features[
          'sui:signTransaction'
        ].signTransaction({
          transaction: Transaction.from(transaction),
          account: account,
          chain: 'sui:mainnet',
        });
        return { transaction: signed.bytes, signature: signed.signature };
      },
    };
  }

  const phantom = (window as any).phantom?.sui;
  if (!phantom) {
    throw new Error('No sui wallet found - install slush or phantom');
  }
  // Signing an unconnected account fails with "not been authorized".
  await phantom.connect?.();
  return phantom;
}

export async function signSui(call: Call, chain: AnyChain) {
  const wallet = await suiWallet(call.from);
  return new SuiSigner(chain as SuiChain, wallet).signAndSend(call, {
    onTransactionSend: (hash) => {
      console.log('TxHash: ' + hash);
    },
    // SuiSigner swallows failures into the observer - rethrow, or a rejected
    // signature still reports the transfer as sent.
    onError: (error) => {
      throw error;
    },
  });
}

export async function sign(call: Call, chain: AnyChain) {
  switch (call.type) {
    case CallType.Evm:
      return signEvm(call, chain);
    case CallType.Solana:
      return signSolana(call, chain);
    case CallType.Sui:
      return signSui(call, chain);
    default:
      if (isEvmAccount(call.from)) {
        return signEvm(call, chain);
      }
      return signSubstrate(call, chain);
  }
}
