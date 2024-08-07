import {
  big,
  AnyChain,
  AssetAmount,
  AssetConfig,
  ChainTransferConfig,
  ContractConfig,
  EvmParachain,
  ExtrinsicConfig,
  FeeAssetConfig,
  TransactInfo,
} from '@galacticcouncil/xcm-core';

import Big from 'big.js';

/**
 * Calculate maximum allowed amount of asset to send from source to
 * destination chain.
 *
 * @param balance - source chain asset balance
 * @param fee - source chain transfer fee
 * @param min - source chain minimum
 * @param ed - source chain existential deposit (opt)
 * @returns - maximum allowed amount of tokens to send or zero in
 * case of not enough funds
 */
export function calculateMax(
  balance: AssetAmount,
  fee: AssetAmount,
  min: AssetAmount,
  ed?: AssetAmount
): AssetAmount {
  let result = balance
    .toBig()
    .minus(min.toBig())
    .minus(balance.isSame(fee) ? fee.toBig() : new Big(0));

  if (ed) {
    result = result.minus(balance.isSame(ed) ? ed.toBig() : new Big(0));
  }

  return balance.copyWith({
    amount: result.lt(0) ? 0n : BigInt(result.toFixed()),
  });
}

/**
 * Calculate minimum required amount of asset to send from source to
 * destination chain.
 *
 * @param balance - destination chain asset balance
 * @param fee - destination chain transfer fee
 * @param min - destination chain minimum
 * @param ed - destination chain existential deposit (opt)
 * @returns - minimum required amount of tokens to send or zero in
 * case of no available funds
 */
export function calculateMin(
  balance: AssetAmount,
  fee: AssetAmount,
  min: AssetAmount,
  ed?: AssetAmount
): AssetAmount {
  const zero = balance.copyWith({
    amount: 0n,
  });

  let result = zero
    .toBig()
    .plus(balance.isSame(fee) ? fee.toBig() : new Big(0))
    .plus(balance.toBig().lt(min.toBig()) ? min.toBig() : new Big(0));

  if (ed) {
    result = result.plus(
      balance.isSame(ed) && balance.toBig().lt(ed.toBig())
        ? ed.toBig()
        : new Big(0)
    );
  }

  return balance.copyWith({
    amount: BigInt(result.toFixed()),
  });
}

/**
 * Return h160 derivated address in case of Evm parachain
 *
 * @param address - h160 or ss58 address format
 * @param chain - transfer chain ctx
 * @returns - derivated address if evm resolver defined, fallback to default
 */
export async function getH16Address(
  address: string,
  chain: AnyChain
): Promise<string> {
  if (chain.isEvmParachain()) {
    const evmPara = chain as EvmParachain;
    return evmPara.getDerivatedAddress(address);
  }
  return address;
}

export function getXcmDeliveryFee(
  decimals: number,
  feeConfig?: FeeAssetConfig
): bigint {
  return feeConfig?.xcmDeliveryFeeAmount
    ? big.toBigInt(feeConfig.xcmDeliveryFeeAmount, decimals)
    : 0n;
}

export function buildTransact(
  address: string,
  amount: bigint,
  destAddress: string,
  destChain: AnyChain,
  destFee: AssetAmount,
  transferConfig: ChainTransferConfig
): ExtrinsicConfig {
  const chain = transferConfig.chain;
  const config = transferConfig.config as AssetConfig;

  if (!config.transact) {
    throw new Error('Ethereum transact must be provided');
  }

  return config.transact.build({
    address: destAddress,
    amount: amount,
    asset: config.asset,
    destination: destChain,
    fee: destFee,
    sender: address,
    source: chain,
    via: config.via,
  });
}

export function buildTransfer(
  address: string,
  amount: bigint,
  destAddress: string,
  destChain: AnyChain,
  destFee: AssetAmount,
  transferConfig: ChainTransferConfig,
  transactInfo?: TransactInfo
): ExtrinsicConfig | ContractConfig {
  const config = transferConfig.config;
  if (config.extrinsic) {
    return buildExtrinsic(
      address,
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig,
      transactInfo
    )!;
  }

  if (config.contract) {
    return buildContract(
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig
    )!;
  }
  throw new Error('Either contract or extrinsic must be provided');
}

function buildExtrinsic(
  address: string,
  amount: bigint,
  destAddress: string,
  destChain: AnyChain,
  destFee: AssetAmount,
  transferConfig: ChainTransferConfig,
  transactInfo?: TransactInfo
): ExtrinsicConfig | undefined {
  const chain = transferConfig.chain;
  const config = transferConfig.config as AssetConfig;
  return config.extrinsic?.build({
    sender: address,
    address: destAddress,
    amount: amount,
    asset: config.asset,
    destination: destChain,
    fee: destFee,
    source: chain,
    transact: transactInfo,
    via: config.via,
  });
}

function buildContract(
  amount: bigint,
  destAddress: string,
  destChain: AnyChain,
  destFee: AssetAmount,
  transferConfig: ChainTransferConfig
): ContractConfig | undefined {
  const { chain, config } = transferConfig;
  return config.contract?.build({
    address: destAddress,
    amount: amount,
    asset: config.asset,
    destination: destChain,
    fee: destFee,
    source: chain,
    via: config.via,
  });
}
