import { h160 } from '@galacticcouncil/common';
import { AnyChain, AnyEvmChain } from '@galacticcouncil/xc-core';
import { Call, EvmCall } from '@galacticcouncil/xc-sdk';

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

  const { data, to, value } = call as EvmCall;
  const estGas = await provider.estimateGas({
    account: account as `0x${string}`,
    data: data as `0x${string}`,
    to: to as `0x${string}`,
    value: value,
  });
  console.log('Est gas: ' + estGas);

  const txHash = await signer.sendTransaction({
    account: account as `0x${string}`,
    chain: client.chain,
    data: data as `0x${string}`,
    to: to as `0x${string}`,
    value: value,
  });

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
