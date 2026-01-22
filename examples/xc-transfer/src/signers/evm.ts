import { h160 } from '@galacticcouncil/common';
import { AnyChain, AnyEvmChain, EvmParachain } from '@galacticcouncil/xc-core';
import { Call, EvmCall } from '@galacticcouncil/xc-sdk';

import { Binary, UnsafeTransaction } from 'polkadot-api';

export const DISPATCH_ADDRESS = '0x0000000000000000000000000000000000000401';

const { H160 } = h160;

export async function signAndSend(
  call: Call,
  chain: AnyChain,
  onTransactionSend: (hash: string | null) => void,
  onTransactionReceipt: (receipt: any) => void,
  onError: (error: unknown) => void
) {
  const evmChain = chain as AnyEvmChain;
  const client = evmChain.evmClient;
  const account = H160.fromAny(call.from);

  const provider = client.getProvider();
  const signer = client.getSigner(account);

  await signer.switchChain({ id: client.chain.id });
  await signer.request({ method: 'eth_requestAccounts' });

  let tx: UnsafeTransaction<any, string, string, any> | null = null;
  let txHash: `0x${string}` | null = null;

  if (chain instanceof EvmParachain) {
    try {
      const dotClient = chain.client;
      const callData = Binary.fromHex(call.data);
      const api = dotClient.getUnsafeApi();

      tx = await api.txFromCallData(callData);
      console.log(tx.decodedCall);
    } catch (error) {}
  }

  if (tx) {
    const data = call.data;
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
      account: account as `0x${string}`,
      chain: client.chain,
      data: data as `0x${string}`,
      maxPriorityFeePerGas: gasPriceExtra,
      maxFeePerGas: gasPriceExtra,
      gas: (gas * 11n) / 10n,
      to: DISPATCH_ADDRESS as `0x${string}`,
    });
  } else {
    const { data, to, value } = call as EvmCall;
    const estGas = await provider.estimateGas({
      account: account as `0x${string}`,
      data: data as `0x${string}`,
      to: to as `0x${string}`,
      value: value,
    });
    console.log('Est gas: ' + estGas);

    txHash = await signer.sendTransaction({
      account: account as `0x${string}`,
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
