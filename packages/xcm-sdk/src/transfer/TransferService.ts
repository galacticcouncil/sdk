import {
  addr,
  big,
  multiloc,
  Asset,
  AssetAmount,
  FeeAmountConfigBuilder,
  FeeAssetConfigBuilder,
  Parachain,
  TransactCtx,
  TransferCtx,
  TransferConfig,
  TransactConfig,
} from '@galacticcouncil/xcm-core';

import { PlatformAdapter, SubstrateService, XCall } from '../platforms';
import { Dex } from '../Dex';

import { formatAmount, formatEvmAddress } from './TransferUtils';
import { Metadata } from './Metadata';

export class TransferService {
  readonly adapter: PlatformAdapter;
  readonly dex: Dex;
  readonly config: TransferConfig;

  constructor(config: TransferConfig, dex: Dex) {
    this.adapter = new PlatformAdapter(config.chain, dex);
    this.config = config;
    this.dex = dex;
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
      asset: asset,
      chain: chain,
    });

    return this.adapter.getBalance(asset, balanceConfig);
  }

  async getDestinationFee(): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source, destination, transact } = route;

    const metadata = new Metadata(chain);

    const feeAmount = destination.fee.amount;
    const feeAsset = destination.fee.asset;
    const feeAssetNormalized = source.destinationFee.asset || feeAsset;
    const feeDecimals = await metadata.getDecimals(feeAssetNormalized);

    if (Number.isFinite(feeAmount)) {
      return AssetAmount.fromAsset(feeAsset, {
        amount: big.toBigInt(feeAmount as number, feeDecimals),
        decimals: feeDecimals,
      });
    }

    const feeConfigBuilder = feeAmount as FeeAmountConfigBuilder;
    const fee = await feeConfigBuilder.build({
      asset: feeAssetNormalized,
      source: this.isNativeBridgeTransfer()
        ? this.dex.hub
        : transact
          ? transact.chain
          : chain,
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
      asset: feeAsset,
      chain: chain,
    });
    return this.adapter.getBalance(feeAsset, feeBalanceConfig);
  }

  private async getNetworkFee(ctx: TransferCtx): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { amount, sender, source } = ctx;

    const transfer = await this.getTransfer(ctx);
    const address = route.contract
      ? await formatEvmAddress(sender, chain)
      : sender;
    return this.adapter.estimateFee(
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
      asset: feeAsset,
      chain: chain,
    });

    return this.adapter.getBalance(feeAsset, feeBalanceConfig);
  }

  async getCall(ctx: TransferCtx): Promise<XCall> {
    const { amount, sender } = ctx;
    const transfer = await this.getTransfer(ctx);
    return this.adapter.calldata(sender, amount, transfer);
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
      return this.adapter.getBalance(asset, minBalanceConfig);
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
    throw new Error('AssetRoute contract or extrinsic config must be provided');
  }

  async getTransact(ctx: TransferCtx): Promise<TransactCtx | undefined> {
    const { route } = this.config;
    const { transact } = route;

    if (transact) {
      const ctxTransactBase = Object.assign({
        transact: {
          chain: transact.chain,
        },
      });

      const context = {
        ...ctx,
        ...ctxTransactBase,
      };

      const [data, fee, feeBalance] = await Promise.all([
        this.getTransactData(transact, context),
        this.getTransactFee(transact),
        this.getTransactFeeBalance(transact, context),
      ]);
      return {
        ...data,
        chain: transact.chain,
        fee: fee,
        feeBalance: feeBalance,
      } as TransactCtx;
    }
    return undefined;
  }

  private async getTransactData(
    cfg: TransactConfig,
    ctx: TransferCtx
  ): Promise<Partial<TransactCtx>> {
    const { extrinsic, chain } = cfg;
    const config = extrinsic.build(ctx);
    const substrate = await SubstrateService.create(chain);
    const submittable = substrate.getExtrinsic(config);
    const { weight } = await submittable.paymentInfo(ctx.address);
    return {
      call: submittable.method.toHex(),
      chain: chain,
      weight: {
        refTime: weight.refTime.toNumber(),
        proofSize: weight.proofSize.toString(),
      },
    } as Partial<TransactCtx>;
  }

  private async getTransactFee(cfg: TransactConfig): Promise<AssetAmount> {
    const { chain } = this.config;
    const { fee } = cfg;
    const metadata = new Metadata(chain);
    const decimals = await metadata.getDecimals(fee.asset);
    return AssetAmount.fromAsset(fee.asset, {
      amount: big.toBigInt(fee.amount, decimals),
      decimals,
    });
  }

  private async getTransactFeeBalance(
    cfg: TransactConfig,
    ctx: TransferCtx
  ): Promise<AssetAmount> {
    const { chain } = this.config;
    const { fee } = cfg;
    const feeBalanceConfig = fee.balance.build({
      address: ctx.sender,
      asset: fee.asset,
      chain: chain,
    });
    return this.adapter.getBalance(fee.asset, feeBalanceConfig);
  }

  private isNativeBridgeTransfer() {
    const { chain, route } = this.config;
    const { source } = route;

    if (chain instanceof Parachain) {
      const assetLocation = chain.getAssetXcmLocation(source.asset);
      if (assetLocation) {
        const globalConsensus = multiloc.findNestedKey(
          assetLocation,
          'GlobalConsensus'
        );
        return !!globalConsensus;
      }
      return false;
    }
    return false;
  }
}
