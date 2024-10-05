import {
  addr,
  big,
  AnyChain,
  Asset,
  AssetAmount,
  ChainTransferConfig,
  FeeAmountConfigBuilder,
  FeeAssetConfigBuilder,
  Parachain,
  RoutedViaConfig,
  TransactInfo,
  TransferData,
} from '@galacticcouncil/xcm-core';

import { BalanceAdapter, TransferAdapter } from '../adapters';
import { SubstrateService } from '../substrate';
import { XCall } from '../types';
import { Dex } from '../Dex';

import { formatAmount, formatEvmAddress } from './TransferUtils';
import { MetadataUtils } from './MetadataUtils';

export class TransferService {
  readonly balance: BalanceAdapter;
  readonly transfer: TransferAdapter;
  readonly metadata: MetadataUtils;

  constructor(chain: AnyChain, dex: Dex) {
    this.balance = new BalanceAdapter(chain);
    this.transfer = new TransferAdapter(chain, dex);
    this.metadata = new MetadataUtils(chain);
  }

  async getBalance(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;
    const assetId = chain.getBalanceAssetId(asset);
    const account = addr.isH160(assetId.toString())
      ? await formatEvmAddress(address, chain)
      : address;
    const balanceConfig = config.balance.build({
      address: account,
      asset: assetId,
    });

    return this.balance.read(asset, balanceConfig);
  }

  async getDestinationFee(
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const { asset, amount } = config.destinationFee;
    const decimals = await this.metadata.getDecimals(asset);

    if (Number.isFinite(amount)) {
      return AssetAmount.fromAsset(asset, {
        amount: big.toBigInt(amount as number, decimals),
        decimals,
      });
    }

    const feeConfigBuilder = amount as FeeAmountConfigBuilder;
    const fee = await feeConfigBuilder.build({
      asset: asset,
      destination: this.metadata.chain,
      source: chain,
      via: config.via?.chain,
    });
    return AssetAmount.fromAsset(asset, {
      amount: fee,
      decimals,
    });
  }

  async getDestinationFeeBalance(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;

    if (config.asset.isEqual(config.destinationFee.asset)) {
      return this.getBalance(address, transferConfig);
    }

    const feeAsset = config.destinationFee.asset;
    const feeAssetId = chain.getBalanceAssetId(feeAsset);
    const account = addr.isH160(feeAssetId.toString())
      ? await formatEvmAddress(address, chain)
      : address;
    const feeBalanceConfig = config.destinationFee.balance.build({
      address: account,
      asset: feeAssetId,
    });
    return this.balance.read(feeAsset, feeBalanceConfig);
  }

  async getNetworkFee(
    transferData: TransferData,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { amount, sender, source } = transferData;
    const { chain, config } = transferConfig;
    const transfer = await this.getTransfer(transferData, transferConfig);

    const address = config.contract
      ? await formatEvmAddress(sender, chain)
      : sender;
    return this.transfer.estimateFee(
      address,
      amount,
      source.fee ?? source.feeBalance,
      transfer
    );
  }

  async getFee(
    transferData: TransferData,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { config } = transferConfig;
    const fee = await this.getNetworkFee(transferData, transferConfig);

    const extraFee = config.fee
      ? formatAmount(fee.decimals, config.fee.extra)
      : 0n;

    const totalFee = fee.amount + extraFee;
    return fee.copyWith({ amount: totalFee });
  }

  async getFeeBalance(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;

    if (!config.fee) {
      return this.getBalance(address, transferConfig);
    }

    const feeAsset = await this.getFeeAsset(address, transferConfig);
    const feeAssetId = chain.getBalanceAssetId(feeAsset);
    const account = addr.isH160(feeAssetId.toString())
      ? await formatEvmAddress(address, chain)
      : address;
    const feeBalanceConfig = config.fee.balance.build({
      address: account,
      asset: feeAssetId,
    });

    return this.balance.read(feeAsset, feeBalanceConfig);
  }

  async getCall(
    transferData: TransferData,
    transferConfig: ChainTransferConfig
  ): Promise<XCall> {
    const { amount, sender } = transferData;
    const transfer = await this.getTransfer(transferData, transferConfig);
    return this.transfer.calldata(sender, amount, transfer);
  }

  async getMin(transferConfig: ChainTransferConfig): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;

    if (chain instanceof Parachain && config.min) {
      const minAssetId = chain.getMinAssetId(asset);
      const minBalanceConfig = config.min.build({
        asset: minAssetId,
      });
      return this.balance.read(asset, minBalanceConfig);
    }

    return this.getAssetMin(transferConfig);
  }

  private async getFeeAsset(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<Asset> {
    const { chain, config } = transferConfig;

    if (!config.fee) {
      return config.asset;
    }

    const feeAssetConfig = config.fee.asset;
    if (chain instanceof Parachain && 'build' in feeAssetConfig) {
      const feeAssetBuilder = feeAssetConfig as FeeAssetConfigBuilder;
      const feeAssetCall = feeAssetBuilder.build({
        chain,
        address,
      });
      return await feeAssetCall.call();
    }
    return feeAssetConfig as Asset;
  }

  private async getAssetMin(
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;
    const assetMin = chain.getAssetMin(asset);
    const decimals = await this.metadata.getDecimals(asset);

    let balance: bigint = 0n;
    if (assetMin) {
      balance = big.toBigInt(assetMin, decimals);
    }

    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  private async getTransfer(
    transferData: TransferData,
    transferConfig: ChainTransferConfig
  ) {
    const { config } = transferConfig;
    if (config.extrinsic) {
      return config.extrinsic.build({
        ...transferData,
      });
    }

    if (config.contract) {
      return config.contract.build({
        ...transferData,
      });
    }
    throw new Error('Either contract or extrinsic must be provided');
  }

  async getTransactInfo(
    transferData: TransferData,
    routedVia: RoutedViaConfig
  ): Promise<TransactInfo> {
    const { address } = transferData;
    const { chain, transact } = routedVia;

    if (!transact) {
      throw new Error('Route via [transact] config is missing.');
    }

    const substrate = await SubstrateService.create(chain);
    const transactConfig = transact.build({
      ...transferData,
      via: {
        chain,
      },
    });

    const extrinsic = substrate.getExtrinsic(transactConfig);
    const { weight } = await extrinsic.paymentInfo(address);
    return {
      call: extrinsic.method.toHex(),
      weight: {
        refTime: weight.refTime.toNumber(),
        proofSize: weight.proofSize.toString(),
      },
    } as TransactInfo;
  }

  async getRouteFee(routedVia: RoutedViaConfig): Promise<AssetAmount> {
    const { fee } = routedVia;

    if (!fee) {
      throw new Error('Route via [fee] config is missing.');
    }

    const decimals = await this.metadata.getDecimals(fee.asset);
    return AssetAmount.fromAsset(fee.asset, {
      amount: big.toBigInt(fee.amount, decimals),
      decimals,
    });
  }

  async getRouteFeeBalance(
    transferData: TransferData,
    routedVia: RoutedViaConfig
  ): Promise<AssetAmount> {
    const { sender, source } = transferData;
    const { fee } = routedVia;

    if (!fee) {
      throw new Error('Route via [fee] config is missing.');
    }

    const feeAssetId = source.chain.getBalanceAssetId(fee.asset);
    const feeBalanceConfig = fee.balance.build({
      address: sender,
      asset: feeAssetId,
    });
    return this.balance.read(fee.asset, feeBalanceConfig);
  }
}
