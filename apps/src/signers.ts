import { Call, SubstrateCall, SubstrateSigner } from '@galacticcouncil/xc-sdk';
import { AnyParachain } from '@galacticcouncil/xc-core';

import { AccountId } from 'polkadot-api';
import {
  connectInjectedExtension,
  getInjectedExtensions,
} from 'polkadot-api/pjs-signer';

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
