import type { ApiPromise } from '@polkadot/api';

import { EvmClient, XCall } from '@galacticcouncil/xcm-sdk';
import { getWalletBySource } from '@talismn/connect-wallets';
import { createWalletClient, custom, Chain } from 'viem';

export const DISPATCH_ADDRESS = '0x0000000000000000000000000000000000000401';

export async function createPolkadotSigner() {
  const wallet = getWalletBySource('polkadot-js');
  if (!wallet) {
    throw new Error('No polkadot-js wallet found!');
  }
  await wallet.enable('xcm-example');
  return { signer: wallet.signer };
}

export async function createEvmSigner(account: string, chain: Chain) {
  const signer = createWalletClient({
    account: account as `0x${string}`,
    chain: chain,
    transport: custom(window['ethereum']),
  });
  await signer.switchChain({ id: chain.id });
  return signer;
}

export async function signAndSendEvm(
  api: ApiPromise,
  address: string,
  client: EvmClient,
  call: XCall,
  onTransactionSend: (hash: string | null) => void,
  onTransactionReceipt: (receipt: any) => void,
  onError: (error: unknown) => void
) {
  const provider = client.getProvider();
  const signer = client.getSigner(address);

  await signer.switchChain({ id: client.chain.id });

  let data: `0x${string}` | null = null;
  let txHash: `0x${string}` | null = null;
  try {
    const extrinsic = api.tx(call.data);
    data = extrinsic.inner.toHex();
  } catch (error) {}

  if (data) {
    const [gas, gasPrice] = await Promise.all([
      provider.estimateGas({
        account: address as `0x${string}`,
        data: data,
        to: DISPATCH_ADDRESS as `0x${string}`,
      }),
      provider.getGasPrice(),
    ]);

    const onePrc = gasPrice / 100n;
    const gasPricePlus = gasPrice + onePrc * 10n;

    txHash = await signer.sendTransaction({
      account: address as `0x${string}`,
      chain: client.chain,
      data: data,
      maxPriorityFeePerGas: gasPricePlus,
      maxFeePerGas: gasPricePlus,
      gas: (gas * 11n) / 10n,
      to: DISPATCH_ADDRESS as `0x${string}`,
    });
  } else {
    txHash = await signer.sendTransaction({
      account: address as `0x${string}`,
      chain: client.chain,
      data: call.data,
      to: call.to as `0x${string}`,
    });
  }

  onTransactionSend(txHash);
  provider
    .waitForTransactionReceipt({
      hash: txHash,
    })
    .then((receipt) => onTransactionReceipt(receipt))
    .catch((error: any) => {
      console.log(error);
      onError(error);
    });
}
