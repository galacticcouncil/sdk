import {
  AssetConfig,
  ChainTransferConfig,
  FeeAssetConfig,
  ExtrinsicConfigBuilderParamsV2,
  TransactInfo,
} from '@galacticcouncil/xcm-core';
import { ContractConfig, ExtrinsicConfig } from '@moonbeam-network/xcm-builder';
import { AnyChain, AssetAmount } from '@moonbeam-network/xcm-types';
import { toBigInt } from '@moonbeam-network/xcm-utils';

/**
 * Calculate maximum allowed amount of asset to send from source to
 * destination chain.
 *
 * @param balance - source chain asset balance
 * @param ed - source chain existential deposit
 * @param fee - source chain transfer fee
 * @param min - source chain minimum
 * @returns - maximum allowed amount of tokens to send or zero in
 * case of not enough funds
 */
export function calculateMax(
  balance: AssetAmount,
  ed: AssetAmount,
  fee: AssetAmount,
  min: AssetAmount
): AssetAmount {
  const result = balance
    .toBig()
    .minus(min.toBig())
    .minus(balance.isSame(ed) ? ed.toBig() : 0n)
    .minus(balance.isSame(fee) ? fee.toBig() : 0n);
  return balance.copyWith({
    amount: result.lt(0) ? 0n : BigInt(result.toFixed()),
  });
}

/**
 * Calculate minimum required amount of asset to send from source to
 * destination chain.
 *
 * @param balance - destination chain asset balance
 * @param ed - destination chain existential deposit
 * @param fee - destination chain transfer fee
 * @param min - destination chain minimum
 * @returns - minimum required amount of tokens to send or zero in
 * case of no available funds
 */
export function calculateMin(
  balance: AssetAmount,
  ed: AssetAmount,
  fee: AssetAmount,
  min: AssetAmount
): AssetAmount {
  const zero = balance.copyWith({
    amount: 0n,
  });

  const result = zero
    .toBig()
    .plus(balance.isSame(fee) ? fee.toBig() : 0n)
    .plus(
      balance.isSame(ed) && balance.toBig().lt(ed.toBig()) ? ed.toBig() : 0n
    )
    .plus(balance.toBig().lt(min.toBig()) ? min.toBig() : 0n);

  return balance.copyWith({
    amount: BigInt(result.toFixed()),
  });
}

export function getXcmDeliveryFee(
  decimals: number,
  feeConfig?: FeeAssetConfig
): bigint {
  return feeConfig?.xcmDeliveryFeeAmount
    ? toBigInt(feeConfig.xcmDeliveryFeeAmount, decimals)
    : 0n;
}

export function buildTransact(
  amount: bigint,
  destAddress: string,
  destChain: AnyChain,
  destFee: AssetAmount,
  transferConfig: ChainTransferConfig,
  mrlChain: AnyChain
): ExtrinsicConfig {
  const chain = transferConfig.chain;
  const config = transferConfig.config as AssetConfig;

  const assetId = mrlChain.getAssetId(config.asset);
  const feeAssetId = chain.getAssetId(destFee);
  const palletInstance = chain.getAssetPalletInstance(config.asset);

  if (!config.transact) {
    throw new Error('Ethereum transact must be provided');
  }

  return config.transact.build({
    address: destAddress,
    amount: amount,
    asset: assetId,
    destination: destChain,
    fee: destFee.amount,
    feeAsset: feeAssetId,
    palletInstance: palletInstance,
    source: chain,
  });
}

export function buildTransfer(
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
      amount,
      '0x5dac9319aaf8a18cf60ad5b94f8dab3232ac9ffc',
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
  amount: bigint,
  destAddress: string,
  destChain: AnyChain,
  destFee: AssetAmount,
  transferConfig: ChainTransferConfig,
  transactInfo?: TransactInfo
): ExtrinsicConfig | undefined {
  const chain = transferConfig.chain;
  const config = transferConfig.config as AssetConfig;

  const assetId = chain.getAssetId(config.asset);
  const palletInstance = chain.getAssetPalletInstance(config.asset);
  const feeAssetId = chain.getAssetId(destFee);
  const feePalletInstance = chain.getAssetPalletInstance(destFee);
  return config.extrinsic?.build({
    address: destAddress,
    amount: amount,
    asset: assetId,
    destination: destChain,
    fee: destFee.amount,
    feeDecimals: destFee.decimals,
    feePalletInstance: feePalletInstance,
    feeAsset: feeAssetId,
    palletInstance: palletInstance,
    source: chain,
    transact: transactInfo,
  } as ExtrinsicConfigBuilderParamsV2);
}

function buildContract(
  amount: bigint,
  destAddress: string,
  destChain: AnyChain,
  destFee: AssetAmount,
  transferConfig: ChainTransferConfig
): ContractConfig | undefined {
  const { chain, config } = transferConfig;
  const assetId = chain.getAssetId(config.asset);
  const feeAssetId = chain.getAssetId(destFee);

  return config.contract?.build({
    address: destAddress,
    amount: amount,
    asset: assetId,
    destination: destChain,
    fee: destFee.amount,
    feeAsset: feeAssetId,
  });
}
