import {
  addr,
  AnyChain,
  AssetAmount,
  ChainTransferConfig,
  FeeConfigBuilder,
  Parachain,
  TransactInfo,
} from '@galacticcouncil/xcm-core';
import { toBigInt } from '@moonbeam-network/xcm-utils';

import { BalanceAdapter, TransferAdapter } from '../adapters';
import { SubstrateService } from '../substrate';
import { XCall } from '../types';

import {
  buildTransact,
  buildTransfer,
  getH16Address,
  getXcmDeliveryFee,
} from './TransferUtils';
import { MetadataUtils } from './MetadataUtils';

export class TransferService {
  readonly balance: BalanceAdapter;
  readonly transfer: TransferAdapter;

  readonly metadata: MetadataUtils;

  constructor(chain: AnyChain) {
    this.balance = new BalanceAdapter(chain);
    this.transfer = new TransferAdapter(chain);
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
      ? await getH16Address(address, chain)
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
        amount: toBigInt(amount as number, decimals),
        decimals,
      });
    }

    const feeConfigBuilder = amount as FeeConfigBuilder;
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

  async getNetworkFee(
    address: string,
    amount: bigint,
    feeBalance: AssetAmount,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const transfer = await this.getTransfer(
      address,
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig
    );

    const sender = config.contract
      ? await getH16Address(address, chain)
      : address;
    return this.transfer.estimateFee(sender, amount, feeBalance, transfer);
  }

  async getFee(
    address: string,
    amount: bigint,
    feeBalance: AssetAmount,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { config } = transferConfig;
    const fee = await this.getNetworkFee(
      address,
      amount,
      feeBalance,
      destAddress,
      destChain,
      destFee,
      transferConfig
    );

    const xcmDeliveryFee = getXcmDeliveryFee(fee.decimals, config.fee);
    const totalFee = fee.amount + xcmDeliveryFee;
    return fee.copyWith({ amount: totalFee });
  }

  async getCall(
    address: string,
    amount: bigint,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig
  ): Promise<XCall> {
    const transfer = await this.getTransfer(
      address,
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig
    );
    return this.transfer.calldata(address, amount, transfer);
  }

  async getFeeBalance(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;

    if (!config.fee) {
      return this.getBalance(address, transferConfig);
    }

    const feeAsset = config.fee.asset;
    const feeAssetId = chain.getBalanceAssetId(feeAsset);
    const account = addr.isH160(feeAssetId.toString())
      ? await getH16Address(address, chain)
      : address;
    const feeBalanceConfig = config.fee.balance.build({
      address: account,
      asset: feeAssetId,
    });

    return this.balance.read(feeAsset, feeBalanceConfig);
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

  private async getAssetMin(
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;
    const assetMin = chain.getAssetMin(asset);
    const decimals = await this.metadata.getDecimals(asset);

    let balance: bigint = 0n;
    if (assetMin) {
      balance = toBigInt(assetMin, decimals);
    }

    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  private async getTransfer(
    address: string,
    amount: bigint,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig
  ) {
    const { config } = transferConfig;
    const transactInfo = config.transact
      ? await this.getTransactInfo(
          address,
          amount,
          destAddress,
          destChain,
          destFee,
          transferConfig
        )
      : undefined;

    return buildTransfer(
      address,
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig,
      transactInfo
    );
  }

  private async getTransactInfo(
    address: string,
    amount: bigint,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig
  ): Promise<TransactInfo | undefined> {
    const config = buildTransact(
      address,
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig
    );

    const viaChain = transferConfig.config.via;
    if (!viaChain) {
      throw new Error('Proxy chain config missing. Specify [via] parameter');
    }

    const substrate = await SubstrateService.create(viaChain);
    const extrinsic = substrate.getExtrinsic(config);
    const { weight } = await extrinsic.paymentInfo(address);
    return {
      call: extrinsic.method.toHex(),
      weight: {
        refTime: weight.refTime.toNumber(),
        proofSize: weight.proofSize.toString(),
      },
    } as TransactInfo;
  }
}
