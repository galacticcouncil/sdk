import { ApiPromise } from '@polkadot/api';

import { EvmClient, H160 } from '@galacticcouncil/sdk';

const DISPATCH_ADDRESS = '0x0000000000000000000000000000000000000401';
const GAS_TO_WEIGHT = 25_000n;

export async function signAndSend(
  address: string,
  call: string,
  api: ApiPromise,
  evm: EvmClient,
  onTransactionSend: (hash: string | null) => void,
  onTransactionReceipt: (receipt: any) => void,
  onError: (error: unknown) => void
) {
  const account = H160.fromAny(address);
  const evmClient = evm.getProvider();
  const signer = evm.getSigner(account);

  console.log(account);

  await signer.switchChain({ id: evm.chain.id });
  await signer.request({ method: 'eth_requestAccounts' });

  let data: `0x${string}` | null = null;
  let txHash: `0x${string}` | null = null;
  let txWeight: string | null = null;

  try {
    const extrinsic = api.tx(call);
    const info = await extrinsic.paymentInfo(address);
    txWeight = info.weight.refTime.toString();
    data = extrinsic.inner.toHex();
    console.log(extrinsic.inner.toHuman());
  } catch (error) {}
  if (data) {
    const [gas, gasPrice] = await Promise.all([
      evmClient.estimateGas({
        account: account as `0x${string}`,
        data: data as `0x${string}`,
        to: DISPATCH_ADDRESS as `0x${string}`,
      }),
      evmClient.getGasPrice(),
    ]);

    const onePrc = gasPrice / 100n;
    const gasPricePlus = gasPrice + onePrc * 5n;

    let gasLimit: bigint;
    if (txWeight) {
      const weight2Gas = BigInt(txWeight) / GAS_TO_WEIGHT;
      gasLimit = (weight2Gas * 11n) / 10n;
    } else {
      // Fallback
      gasLimit = (gas * 13n) / 10n;
    }

    console.log('Gas limit: ' + gasLimit);

    txHash = await signer.sendTransaction({
      account: account as `0x${string}`,
      chain: evm.chain,
      data: data,
      maxPriorityFeePerGas: gasPricePlus,
      maxFeePerGas: gasPricePlus,
      gas: gasLimit,
      to: DISPATCH_ADDRESS as `0x${string}`,
    });
  } else {
    const estGas = await evmClient.estimateGas({
      account: address as `0x${string}`,
      data: call as `0x${string}`,
      to: address as `0x${string}`,
    });
    console.log('Est gas: ' + estGas);

    txHash = await signer.sendTransaction({
      account: account as `0x${string}`,
      chain: evm.chain,
      data: call as `0x${string}`,
      to: address as `0x${string}`,
    });
  }

  onTransactionSend(txHash);
  evmClient
    .waitForTransactionReceipt({
      hash: txHash,
    })
    .then((receipt) => onTransactionReceipt(receipt))
    .catch((error: any) => {
      console.log(error);
      onError(error);
    });
}
