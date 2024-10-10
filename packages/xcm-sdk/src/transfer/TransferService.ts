import {
  addr,
  big,
  Asset,
  AssetAmount,
  FeeAmountConfigBuilder,
  FeeAssetConfigBuilder,
  Parachain,
  RoutedViaConfig,
  TransactInfo,
  TransferCtx,
  TransferConfig,
} from '@galacticcouncil/xcm-core';

import { BalanceAdapter, TransferAdapter } from '../adapters';
import { SubstrateService } from '../substrate';
import { XCall } from '../types';
import { Dex } from '../Dex';

import { formatAmount, formatEvmAddress } from './TransferUtils';
import { Metadata } from './Metadata';

export class TransferService {
  readonly balance: BalanceAdapter;
  readonly transfer: TransferAdapter;

  readonly config: TransferConfig;

  constructor(config: TransferConfig, dex: Dex) {
    this.config = config;
    this.balance = new BalanceAdapter(config.chain);
    this.transfer = new TransferAdapter(config.chain, dex);
  }

  async getEd(): Promise<AssetAmount | undefined> {
    const { chain } = this.config;
    const metadata = new Metadata(chain);
    return metadata.getEd();
  }

  async getBalance(address: string): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source } = route;

    const asset = source.asset;

    const assetId = chain.getBalanceAssetId(asset);
    const account = addr.isH160(assetId.toString())
      ? await formatEvmAddress(address, chain)
      : address;
    const balanceConfig = route.source.balance.build({
      address: account,
      asset: assetId,
    });

    return this.balance.read(asset, balanceConfig);
  }

  async getDestinationFee(): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source, destination, via } = route;

    const metadata = new Metadata(destination.chain);

    const feeAmount = destination.fee.amount;
    const feeAsset = destination.fee.asset;
    const feeDecimals = await metadata.getDecimals(feeAsset);

    if (Number.isFinite(feeAmount)) {
      return AssetAmount.fromAsset(feeAsset, {
        amount: big.toBigInt(feeAmount as number, feeDecimals),
        decimals: feeDecimals,
      });
    }

    const feeConfigBuilder = feeAmount as FeeAmountConfigBuilder;
    const fee = await feeConfigBuilder.build({
      asset: source.destinationFee.asset || feeAsset,
      source: via ? via.chain : chain,
      destination: destination.chain,
    });
    return AssetAmount.fromAsset(feeAsset, {
      amount: fee,
      decimals: feeDecimals,
    });
  }

  async getDestinationFeeBalance(address: string): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source, destination } = route;

    const asset = source.asset;
    const feeAsset = source.destinationFee.asset || destination.fee.asset;

    if (asset.isEqual(feeAsset)) {
      return this.getBalance(address);
    }

    const feeAssetId = chain.getBalanceAssetId(feeAsset);
    const account = addr.isH160(feeAssetId.toString())
      ? await formatEvmAddress(address, chain)
      : address;
    const feeBalanceConfig = source.destinationFee.balance.build({
      address: account,
      asset: feeAssetId,
    });
    return this.balance.read(feeAsset, feeBalanceConfig);
  }

  private async getNetworkFee(ctx: TransferCtx): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { amount, sender, source } = ctx;

    const transfer = await this.getTransfer(ctx);
    const address = route.contract
      ? await formatEvmAddress(sender, chain)
      : sender;
    return this.transfer.estimateFee(
      address,
      amount,
      source.fee ?? source.feeBalance,
      transfer
    );
  }

  async getFee(ctx: TransferCtx): Promise<AssetAmount> {
    const { route } = this.config;
    const { source } = route;

    const fee = source.fee;

    const networkFee = await this.getNetworkFee(ctx);
    const extraFee = fee ? formatAmount(networkFee.decimals, fee.extra) : 0n;
    const totalFee = networkFee.amount + extraFee;
    return networkFee.copyWith({ amount: totalFee });
  }

  async getFeeBalance(address: string): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source } = route;

    if (!source.fee) {
      return this.getBalance(address);
    }

    const feeAsset = await this.getFeeAsset(address);
    const feeAssetId = chain.getBalanceAssetId(feeAsset);
    const account = addr.isH160(feeAssetId.toString())
      ? await formatEvmAddress(address, chain)
      : address;
    const feeBalanceConfig = source.fee.balance.build({
      address: account,
      asset: feeAssetId,
    });

    return this.balance.read(feeAsset, feeBalanceConfig);
  }

  async getCall(ctx: TransferCtx): Promise<XCall> {
    const { amount, sender } = ctx;
    const transfer = await this.getTransfer(ctx);
    return this.transfer.calldata(sender, amount, transfer);
  }

  async getMin(): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source } = route;

    const asset = source.asset;
    const min = source.min;

    if (chain instanceof Parachain && min) {
      const minAssetId = chain.getMinAssetId(asset);
      const minBalanceConfig = min.build({
        asset: minAssetId,
      });
      return this.balance.read(asset, minBalanceConfig);
    }

    return this.getAssetMin();
  }

  private async getFeeAsset(address: string): Promise<Asset> {
    const { chain, route } = this.config;
    const { source } = route;

    const fee = source.fee;
    const asset = source.asset;

    if (!fee) {
      return asset;
    }

    const feeAssetConfig = fee.asset;
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

  private async getAssetMin(): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source } = route;

    const metadata = new Metadata(chain);
    const asset = source.asset;

    const min = chain.getAssetMin(asset);
    const decimals = await metadata.getDecimals(asset);

    let balance: bigint = 0n;
    if (min) {
      balance = big.toBigInt(min, decimals);
    }

    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }

  private async getTransfer(ctx: TransferCtx) {
    const { route } = this.config;
    const { extrinsic, contract } = route;

    if (extrinsic) {
      return extrinsic.build({
        ...ctx,
      });
    }

    if (contract) {
      return contract.build({
        ...ctx,
      });
    }
    throw new Error('Either contract or extrinsic must be provided');
  }

  async getTransactInfo(
    ctx: TransferCtx,
    via: RoutedViaConfig
  ): Promise<TransactInfo> {
    const { address } = ctx;
    const { chain, transact } = via;

    if (!transact) {
      throw new Error('Route via [transact] config is missing.');
    }

    const substrate = await SubstrateService.create(chain);
    const transactConfig = transact.build({
      ...ctx,
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

  async getRouteFee(via: RoutedViaConfig): Promise<AssetAmount> {
    const { chain } = this.config;
    const { fee } = via;

    if (!fee) {
      throw new Error('Route via [fee] config is missing.');
    }

    const metadata = new Metadata(chain);
    const decimals = await metadata.getDecimals(fee.asset);
    return AssetAmount.fromAsset(fee.asset, {
      amount: big.toBigInt(fee.amount, decimals),
      decimals,
    });
  }

  async getRouteFeeBalance(
    ctx: TransferCtx,
    via: RoutedViaConfig
  ): Promise<AssetAmount> {
    const { sender, source } = ctx;
    const { fee } = via;

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
