import type { PolkadotSigner } from 'polkadot-api';

import {
  getInjectedExtensions,
  connectInjectedExtension,
  InjectedExtension,
  InjectedPolkadotAccount,
} from 'polkadot-api/pjs-signer';

export const getSignerBySource = async (
  source: string,
  address: string
): Promise<PolkadotSigner> => {
  const extensions: string[] = getInjectedExtensions();
  console.log(source, extensions);
  const extension = extensions.find((e) => e === source);

  if (!extension) {
    throw new Error('No wallet extension forund for ' + source);
  }

  const selectedExtension: InjectedExtension =
    await connectInjectedExtension(extension);

  const accounts: InjectedPolkadotAccount[] = selectedExtension.getAccounts();
  const account = accounts.find((a) => a.address === address);

  if (!account) {
    throw new Error('Account is not connected: ' + address);
  }
  return account.polkadotSigner;
};
