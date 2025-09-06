import { H160 } from '@galacticcouncil/sdk';
import { AnyChain, AnyEvmChain, EvmParachain } from '@galacticcouncil/xcm-core';
import { Call, EvmCall } from '@galacticcouncil/xcm-sdk';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

export const DISPATCH_ADDRESS = '0x0000000000000000000000000000000000000401';

export async function signAndSend(
  address: string,
  call: Call,
  chain: AnyChain,
  onTransactionSend: (hash: string | null) => void,
  onTransactionReceipt: (receipt: any) => void,
  onError: (error: unknown) => void
) {
  const { client } = chain as AnyEvmChain;

  const provider = client.getProvider();
  const signer = client.getSigner(address);

  await signer.switchChain({ id: client.chain.id });
  await signer.request({ method: 'eth_requestAccounts' });

  let extrinsic: SubmittableExtrinsic | null = null;
  let txHash: `0x${string}` | null = null;

  if (chain instanceof EvmParachain) {
    try {
      const api = await chain.api;
      extrinsic = api.tx(call.data);
      console.log(extrinsic.toHuman());
    } catch (error) {}
  }

  if (extrinsic) {
    const data = extrinsic.inner.toHex();
    const account = H160.toAccount(address);

    const [gas, gasPrice] = await Promise.all([
      provider.estimateGas({
        account: account as `0x${string}`,
        data: data as `0x${string}`,
        to: DISPATCH_ADDRESS as `0x${string}`,
      }),
      provider.getGasPrice(),
    ]);

    const gasPriceExtra = gasPrice + (gasPrice / 100n) * 10n;

    txHash = await signer.sendTransaction({
      account: address as `0x${string}`,
      chain: client.chain,
      data: data,
      maxPriorityFeePerGas: gasPriceExtra,
      maxFeePerGas: gasPriceExtra,
      gas: (gas * 11n) / 10n,
      to: DISPATCH_ADDRESS as `0x${string}`,
    });
  } else {
    const { data, to, value } = call as EvmCall;
    const estGas = await provider.estimateGas({
      account: address as `0x${string}`,
      data: data as `0x${string}`,
      to: to as `0x${string}`,
      value: value,
    });
    console.log('Est gas: ' + estGas);

    txHash = await signer.sendTransaction({
      account: address as `0x${string}`,
      chain: client.chain,
      data: data as `0x${string}`,
      to: to as `0x${string}`,
      value: value,
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
