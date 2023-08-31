import { getWalletBySource } from '@talismn/connect-wallets';

import { ethers } from 'ethers';

export async function createPolkadotSigner() {
  const wallet = getWalletBySource('polkadot-js');
  if (!wallet) {
    throw new Error('No polkadot-js wallet found!');
  }
  await wallet.enable('xcm-example');
  return { signer: wallet.signer };
}

export async function createEtherSigner() {
  const ethProxy = window['ethereum'];
  const provider = new ethers.providers.Web3Provider(ethProxy, 'any');
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
}

export async function createEtherProvider(ws: string) {
  return ethers.getDefaultProvider(ws);
}
