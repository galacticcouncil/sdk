import { EvmClient, H160, SubstrateTransaction } from '@galacticcouncil/sdk';

const DISPATCH_ADDRESS = '0x0000000000000000000000000000000000000401';
const GAS_TO_WEIGHT = 25_000n;

export async function signAndSend(
  address: string,
  evm: EvmClient,
  tx: SubstrateTransaction,
  onTransactionSend: (hash: string | null) => void,
  onTransactionReceipt: (receipt: any) => void,
  onError: (error: unknown) => void
) {
  const account = H160.fromAny(address);
  const evmClient = evm.getProvider();
  const signer = evm.getSigner(account);

  await signer.switchChain({ id: evm.chain.id });
  await signer.request({ method: 'eth_requestAccounts' });

  const extrinsic = tx.get();
  const { weight } = await extrinsic.paymentInfo(address);
  const calldata = extrinsic.inner.toHex();
  const refTime = weight.refTime.toString();

  const [gas, gasPrice] = await Promise.all([
    evmClient.estimateGas({
      account: account as `0x${string}`,
      data: calldata as `0x${string}`,
      to: DISPATCH_ADDRESS as `0x${string}`,
    }),
    evmClient.getGasPrice(),
  ]);

  const onePct = gasPrice / 100n;
  const gasPriceExtra = gasPrice + onePct * 5n;

  let gasLimit: bigint;
  if (tx.extraGas) {
    const weight2Gas = BigInt(refTime) / GAS_TO_WEIGHT;
    gasLimit = (weight2Gas * 11n) / 10n; // add 10%
  } else {
    gasLimit = (gas * 13n) / 10n; // add 30%
  }

  const txHash = await signer.sendTransaction({
    account: account as `0x${string}`,
    chain: evm.chain,
    data: calldata,
    maxPriorityFeePerGas: gasPriceExtra,
    maxFeePerGas: gasPriceExtra,
    gas: gasLimit,
    to: DISPATCH_ADDRESS as `0x${string}`,
  });

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
