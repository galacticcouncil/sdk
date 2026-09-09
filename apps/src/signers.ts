import {
  Call,
  EvmCall,
  EvmSigner,
  SolanaSigner,
  SubstrateCall,
  SubstrateSigner,
  SuiSigner,
} from '@galacticcouncil/xc-sdk';
import {
  AnyChain,
  AnyEvmChain,
  AnyParachain,
  SolanaChain,
  SuiChain,
} from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

import { AccountId } from 'polkadot-api';
import {
  connectInjectedExtension,
  getInjectedExtensions,
} from 'polkadot-api/pjs-signer';

const { H160 } = h160;

export type SignEvents = {
  onSubmit?: (id: string) => void;
  onConfirmed?: (info: string) => void;
  onError?: (error: unknown) => void;
};

/** Same account across ss58 prefixes - compare public keys, not strings. */
const isSameAccount = (a: string, b: string) => {
  try {
    const enc = AccountId();
    return (
      Buffer.from(enc.enc(a)).toString('hex') ===
      Buffer.from(enc.enc(b)).toString('hex')
    );
  } catch {
    return false;
  }
};

/**
 * Resolve `address` to a signer across every injected extension.
 *
 * Deliberately not keyed to one wallet - whichever extension holds the
 * account signs.
 */
async function signerFor(address: string) {
  const extensions = getInjectedExtensions();
  if (!extensions.length) {
    throw new Error('No polkadot extension found - install one and reload.');
  }

  for (const name of extensions) {
    const extension = await connectInjectedExtension(name);
    const account = extension
      .getAccounts()
      .find((a) => isSameAccount(a.address, address));
    if (account) {
      return account.polkadotSigner;
    }
  }

  throw new Error(address + ' is not in any connected extension.');
}

export async function signSubstrate(
  call: Call,
  chain: AnyParachain,
  events: SignEvents = {}
) {
  const signer = await signerFor(call.from);

  return new Promise<void>((resolve, reject) => {
    new SubstrateSigner(chain, signer).signAndSend(call as SubstrateCall, {
      onTransactionSend: (hash) => events.onSubmit?.(hash),
      onFinalized: (event) => {
        events.onConfirmed?.('Block: ' + (event as any).block?.number);
        resolve();
      },
      onError: (error) => {
        events.onError?.(error);
        reject(error);
      },
    });
  });
}

/**
 * Sign an evm call with the injected wallet, as the call's `from`.
 *
 * - Adds the chain to the wallet when a switch is rejected
 * - Resolves once the receipt is in, so callers can chain calls
 */
export async function signEvm(
  call: Call,
  chain: AnyEvmChain,
  events: SignEvents = {}
) {
  const wallet = await evmWallet(chain, H160.fromAny(call.from));

  return new Promise<void>((resolve, reject) => {
    new EvmSigner(chain, wallet)
      .signAndSend(call, {
        onTransactionSend: (hash) => events.onSubmit?.(hash),
        onTransactionReceipt: (receipt) => {
          events.onConfirmed?.('Block: ' + receipt.blockNumber);
          resolve();
        },
        onError: (error) => {
          events.onError?.(error);
          reject(error);
        },
      })
      .catch(reject);
  });
}

/** Wallet on `chain`, switched to it (added first when unknown). */
async function evmWallet(chain: AnyEvmChain, account: string) {
  const client = chain.evmClient;
  const wallet = client.getSigner(account);
  try {
    await wallet.switchChain({ id: client.chain.id });
  } catch {
    await wallet.addChain({ chain: client.chain });
  }
  await wallet.request({ method: 'eth_requestAccounts' });
  return wallet;
}

/** Ask the injected wallet for its account, on `chain`. */
export async function connectEvm(chain: AnyEvmChain): Promise<string> {
  const provider = (window as any).ethereum;
  if (!provider) {
    throw new Error('No evm wallet found - install one and reload.');
  }
  const [address] = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[];
  if (!address) {
    throw new Error('No account selected in the wallet.');
  }
  await evmWallet(chain, address);
  return address;
}

export type EvmTx = {
  from: string;
  to: string;
  data: string;
  /** Fixed limit - set when the node cannot be asked for one */
  gas: bigint;
};

/**
 * Send a raw evm transaction at a fixed gas limit.
 *
 * For calls the node will not estimate: one it refuses to simulate, or a
 * dispatch precompile call whose weight it cannot see.
 */
export async function sendEvm(
  chain: AnyEvmChain,
  tx: EvmTx,
  events: SignEvents = {}
) {
  const client = chain.evmClient;
  const provider = client.getProvider();
  const account = tx.from as `0x${string}`;
  const wallet = await evmWallet(chain, account);

  // The base fee drifts up every block - a tx priced at the bare quote is
  // signed, handed back as a hash, then dropped from the pool.
  const gasPrice = await provider.getGasPrice();
  const gasPriceSurplus = gasPrice + (gasPrice * 5n) / 100n;

  const txHash = await wallet.sendTransaction({
    account: account,
    chain: client.chain,
    data: tx.data as `0x${string}`,
    to: tx.to as `0x${string}`,
    gas: tx.gas,
    maxFeePerGas: gasPriceSurplus,
    maxPriorityFeePerGas: gasPriceSurplus,
  });
  events.onSubmit?.(txHash);

  const receipt = await provider.waitForTransactionReceipt({ hash: txHash });
  events.onConfirmed?.(
    receipt.status +
      ' in block ' +
      receipt.blockNumber +
      ', gas used ' +
      receipt.gasUsed
  );
}

/**
 * Send an evm call the node already refused to simulate.
 *
 * Lands on chain as a reverted transaction: gas is spent, nothing is
 * minted, and the vaa stays unconsumed - so the claim is still replayable
 * afterwards. Only worth it as proof that the revert is real.
 */
export async function sendForced(
  call: EvmCall,
  chain: AnyEvmChain,
  events: SignEvents = {},
  gas = 2_000_000n
) {
  return sendEvm(
    chain,
    { from: call.from, to: call.to, data: call.data, gas },
    events
  );
}

/** Sign & send a jito bundle with the injected phantom wallet. */
export async function signSolanaAll(
  calls: Call[],
  chain: AnyChain,
  events: SignEvents = {}
) {
  const wallet = (window as any).phantom?.solana;
  if (!wallet) {
    throw new Error('No solana wallet found - install phantom and reload.');
  }
  return new SolanaSigner(chain as SolanaChain, wallet).signAndSendAll(calls, {
    onTransactionSend: (signature) => events.onSubmit?.(signature),
    onStatus: (status) => events.onConfirmed?.(String(status)),
    onError: (error) => events.onError?.(error),
  });
}

/** Sign & send a programmable transaction with the injected phantom wallet. */
export async function signSui(
  call: Call,
  chain: AnyChain,
  events: SignEvents = {}
) {
  const wallet = (window as any).phantom?.sui;
  if (!wallet) {
    throw new Error('No sui wallet found - install phantom and reload.');
  }
  return new SuiSigner(chain as SuiChain, wallet).signAndSend(call, {
    onTransactionSend: (digest) => events.onSubmit?.(digest),
    // SuiSigner swallows failures into the observer - rethrow, or a rejected
    // signature still reports the claim as sent.
    onError: (error) => {
      events.onError?.(error);
      throw error;
    },
  });
}
