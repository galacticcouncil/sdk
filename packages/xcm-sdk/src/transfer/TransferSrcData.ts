import {
  acc,
  addr,
  big,
  Asset,
  AssetAmount,
  FeeAmountConfigBuilder,
  FeeAssetConfigBuilder,
  Parachain,
  TransferCtx,
  TransferConfig,
  TransactCtx,
  TransactConfig,
} from '@galacticcouncil/xcm-core';

import { formatAmount, formatEvmAddress } from './utils';
import { PlatformAdapter, SubstrateService, XCall } from '../platforms';

import { TransferData } from './TransferData';

export class TransferSrcData extends TransferData {
  constructor(adapter: PlatformAdapter, config: TransferConfig) {
    super(adapter, config);
  }

  async getCall(ctx: TransferCtx): Promise<XCall> {
    const { amount, sender } = ctx;
    const transfer = await this.getTransfer(ctx);
    return this.adapter.calldata(sender, amount, transfer);
  }

  async getDestinationFee(): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source, destination, transact } = route;

    const feeAmount = destination.fee.amount;
    const feeAsset = destination.fee.asset;
    const feeAssetNormalized = source.destinationFee.asset || feeAsset;
    const feeDecimals = await this.getDecimals(feeAssetNormalized);

    if (Number.isFinite(feeAmount)) {
      return AssetAmount.fromAsset(feeAsset, {
        amount: big.toBigInt(feeAmount as number, feeDecimals),
        decimals: feeDecimals,
      });
    }

    const feeConfigBuilder = feeAmount as FeeAmountConfigBuilder;
    const fee = await feeConfigBuilder.build({
      asset: feeAssetNormalized,
      source: transact ? transact.chain : chain,
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

  async getNetworkFee(ctx: TransferCtx): Promise<AssetAmount> {
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

  async getFeeAsset(address: string): Promise<Asset> {
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
      return await feeAssetBuilder.build({
        chain,
        address,
      });
    }
    return feeAssetConfig as Asset;
  }

  private async getTransfer(ctx: TransferCtx) {
    const { route } = this.config;
    const { contract, extrinsic, program } = route;

    const callable = contract || extrinsic || program;
    if (callable) {
      return callable.build({
        ...ctx,
      });
    }

    throw new Error(
      'AssetRoute transfer config is invalid! Specify contract, extrinsic or program instructions.'
    );
  }

  async getTransact(ctx: TransferCtx): Promise<TransactCtx | undefined> {
    const { route } = this.config;
    const { transact } = route;

    if (transact) {
      // Augment transfer context with transact chain info
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

  /**
   * Transact remote execution context
   *
   * @param cfg - transact config
   * @param ctx - augmented transfer context
   * @returns transact remote call context
   */
  private async getTransactData(
    cfg: TransactConfig,
    ctx: TransferCtx
  ): Promise<Partial<TransactCtx>> {
    const { extrinsic, chain } = cfg;
    const config = extrinsic.build(ctx);
    const substrate = await SubstrateService.create(chain);
    const submittable = substrate.getExtrinsic(config);

    const fromChain = ctx.source.chain as Parachain;
    const fromAddr = ctx.sender;

    const mda = acc.getMultilocationDerivatedAccount(
      fromChain.parachainId,
      fromAddr,
      1
    );

    const { weight } = await submittable.paymentInfo(mda);
    return {
      call: submittable.method.toHex(),
      chain: chain,
      weight: {
        refTime: weight.refTime.toNumber(),
        proofSize: weight.proofSize.toString(),
      },
    } as Partial<TransactCtx>;
  }

  /**
   * Transact fee on source chain
   *
   * @param cfg - transact config
   * @returns transact source chain fee
   */
  private async getTransactFee(cfg: TransactConfig): Promise<AssetAmount> {
    const { fee } = cfg;
    const decimals = await this.getDecimals(fee.asset);
    return AssetAmount.fromAsset(fee.asset, {
      amount: big.toBigInt(fee.amount, decimals),
      decimals,
    });
  }

  /**
   * Transact fee balance on source chain
   *
   * @param cfg - transact config
   * @param ctx - augmented transfer context
   * @returns transact source chain fee balance
   */
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
}
