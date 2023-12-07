import { getWalletBySource } from '@talismn/connect-wallets';
import { createWalletClient, custom, Chain } from 'viem';

export async function createPolkadotSigner() {
  const wallet = getWalletBySource('polkadot-js');
  if (!wallet) {
    throw new Error('No polkadot-js wallet found!');
  }
  await wallet.enable('xcm-example');
  return { signer: wallet.signer };
}

export async function createEvmSigner(account: string, chain: Chain) {
  return createWalletClient({
    account: account as `0x${string}`,
    chain: chain,
    transport: custom(window['ethereum']),
  });
}
