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
  TransactInfo,
  TransferData,
} from '@galacticcouncil/xcm-core';

import { BalanceAdapter, TransferAdapter } from '../adapters';
import { SubstrateService } from '../substrate';
import { Dex, XCall } from '../types';

import {
  buildTransact,
  buildTransfer,
  getH160Address,
  getXcmDeliveryFee,
} from './TransferUtils';
import { MetadataUtils } from './MetadataUtils';

export class TransferService {
  readonly balance: BalanceAdapter;
  readonly transfer: TransferAdapter;
  readonly metadata: MetadataUtils;

  readonly dex: Dex;

  constructor(chain: AnyChain, dex: Dex) {
    this.balance = new BalanceAdapter(chain);
    this.transfer = new TransferAdapter(chain, dex);
    this.metadata = new MetadataUtils(chain);
    this.dex = dex;
  }

  async getBalance(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;
    const assetId = chain.getBalanceAssetId(asset);
    const account = addr.isH160(assetId.toString())
      ? await getH160Address(address, chain)
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
      via: config.via,
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
      ? await getH160Address(address, chain)
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
      ? await getH160Address(sender, chain)
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

    const xcmDeliveryFee = getXcmDeliveryFee(fee.decimals, config.fee);
    const totalFee = fee.amount + xcmDeliveryFee;
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
      ? await getH160Address(address, chain)
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
    const { amount, address } = transferData;
    const transfer = await this.getTransfer(transferData, transferConfig);
    return this.transfer.calldata(address, amount, transfer);
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
    const transactInfo = config.transact
      ? await this.getTransactInfo(transferData, transferConfig)
      : undefined;

    return buildTransfer(transferData, transferConfig, transactInfo);
  }

  private async getTransactInfo(
    transferData: TransferData,
    transferConfig: ChainTransferConfig
  ): Promise<TransactInfo | undefined> {
    const { config } = transferConfig;

    if (!config.via) {
      throw new Error('Proxy chain config missing. Specify [via] parameter');
    }

    const transactConfig = buildTransact(transferData, transferConfig);

    const substrate = await SubstrateService.create(config.via);
    const extrinsic = substrate.getExtrinsic(transactConfig);
    const { weight } = await extrinsic.paymentInfo(transferData.address);
    return {
      call: extrinsic.method.toHex(),
      weight: {
        refTime: weight.refTime.toNumber(),
        proofSize: weight.proofSize.toString(),
      },
    } as TransactInfo;
  }
}
