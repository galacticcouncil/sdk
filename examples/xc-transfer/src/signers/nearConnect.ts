import { NearWallet } from '@galacticcouncil/xc-sdk';

import {
  NearConnector,
  NearWalletBase,
  WalletManifest,
} from '@hot-labs/near-connect';

/**
 * Ethereum wallets on NEAR (NEP-518): MetaMask signs for the NEAR account
 * with the same 0x… id, the adapter's relayer submits.
 */
const EVM_WALLETS_MANIFEST = 'https://evm-on-near.dev/manifest.json';

/**
 * NEAR wallets over near-connect, on testnet.
 *
 * - The default manifest lists the NEAR wallets, the Ethereum wallets
 *   adapter is registered on top of it
 * - Wallets without testnet support are left out of the chooser
 */
export const nearConnector = new NearConnector({
  network: 'testnet',
  features: { testnet: true },
});

const ready = nearConnector.whenManifestLoaded.then(async () => {
  const manifest = await fetch(EVM_WALLETS_MANIFEST).then((r) => r.json());
  await Promise.all(
    manifest.wallets.map((wallet: WalletManifest) =>
      nearConnector.registerWallet(wallet)
    )
  );
});

export interface NearConnection {
  /** The sdk's wallet shape - what near-connect speaks already. */
  wallet: NearWallet;
  accountId: string;
}

const toConnection = (
  wallet: NearWalletBase,
  accountId: string
): NearConnection => ({ wallet, accountId });

/** Opens the wallet chooser, resolves with the signed-in account. */
export async function connectNear(): Promise<NearConnection> {
  await ready;
  const wallet = await nearConnector.connect();
  const [account] = await wallet.getAccounts();
  return toConnection(wallet, account.accountId);
}

/** The connection kept from an earlier visit, if any. */
export async function reconnectNear(): Promise<NearConnection | undefined> {
  await ready;
  try {
    const { wallet, accounts } = await nearConnector.getConnectedWallet();
    return toConnection(wallet, accounts[0].accountId);
  } catch {
    return undefined;
  }
}

export function disconnectNear(): Promise<void> {
  return nearConnector.disconnect();
}
