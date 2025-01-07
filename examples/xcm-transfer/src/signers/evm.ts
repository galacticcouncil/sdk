import { AnyChain, AnyEvmChain, EvmParachain } from '@galacticcouncil/xcm-core';
import { Call, EvmCall } from '@galacticcouncil/xcm-sdk';

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

  let data: `0x${string}` | null = null;
  let txHash: `0x${string}` | null = null;
  if (chain instanceof EvmParachain) {
    try {
      const api = await chain.api;
      const extrinsic = api.tx(call.data);
      data = extrinsic.inner.toHex();
      console.log(extrinsic.inner.toHuman());
    } catch (error) {}
  }

  if (data) {
    const [gas, gasPrice] = await Promise.all([
      provider.estimateGas({
        account: address as `0x${string}`,
        data: data as `0x${string}`,
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
