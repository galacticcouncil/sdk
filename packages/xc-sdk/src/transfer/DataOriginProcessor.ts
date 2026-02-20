import {
  acc,
  Asset,
  AssetAmount,
  CallType,
  FeeAmountConfigBuilder,
  FeeAssetConfigBuilder,
  Parachain,
  TransferCtx,
  TransferConfig,
  TransactCtx,
  TransactConfig,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

import { buildBalanceConfig, formatAmount, resolveAddress } from './utils';
import { Call, PlatformAdapter, SubstrateService } from '../platforms';

import { DataProcessor } from './DataProcessor';

export class DataOriginProcessor extends DataProcessor {
  constructor(adapter: PlatformAdapter, config: TransferConfig) {
    super(adapter, config);
  }

  async getCall(ctx: TransferCtx): Promise<Call> {
    const { amount, source } = ctx;
    const { transfer, account } = await this.getTransfer(ctx);
    return this.adapter.buildCall(account, amount, source.feeBalance, transfer);
  }

  async getDestinationFee(): Promise<{
    fee: AssetAmount;
    feeBreakdown: { [key: string]: bigint };
  }> {
    const { chain, route } = this.config;
    const { source, destination, transact } = route;

    const feeAmount = destination.fee.amount;
    const feeAsset = source.destinationFee.asset || destination.fee.asset;
    const feeDecimals = await this.getDecimals(feeAsset);

    if (Number.isFinite(feeAmount)) {
      const destinationFee = AssetAmount.fromAsset(feeAsset, {
        amount: big.toBigInt(feeAmount as number, feeDecimals),
        decimals: feeDecimals,
      });
      return {
        fee: destinationFee,
        feeBreakdown: {},
      };
    }

    const feeConfigBuilder = feeAmount as FeeAmountConfigBuilder;
    const { amount, breakdown } = await feeConfigBuilder.build({
      feeAsset: feeAsset,
      transferAsset: source.asset,
      source: transact ? transact.chain : chain,
      destination: destination.chain,
    });

    const fee = AssetAmount.fromAsset(feeAsset, {
      amount: amount,
      decimals: feeDecimals,
    });

    return {
      fee: fee,
      feeBreakdown: breakdown,
    };
  }

  async getDestinationFeeBalance(address: string): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { source, destination } = route;

    const asset = source.asset;
    const feeAsset = source.destinationFee.asset || destination.fee.asset;

    if (asset.isEqual(feeAsset)) {
      return this.getBalance(address);
    }

    const feeBalanceConfig = await buildBalanceConfig(
      source.destinationFee.balance,
      address,
      feeAsset,
      chain
    );
    return this.adapter.getBalance(feeAsset, feeBalanceConfig);
  }

  async getFee(ctx: TransferCtx): Promise<AssetAmount> {
    const { amount, source } = ctx;

    const { transfer, account } = await this.getTransfer(ctx);

    const networkFee = await this.adapter.estimateFee(
      account,
      amount,
      source.feeBalance,
      transfer
    );

    const { fee } = this.config.route.source;
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

    const substrateAddr = await resolveAddress(
      address,
      chain,
      CallType.Substrate
    );
    const feeAsset = await this.getFeeAsset(substrateAddr);
    const feeBalanceConfig = await buildBalanceConfig(
      source.fee.balance,
      address,
      feeAsset,
      chain
    );
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
    const { chain, route } = this.config;
    const { contract, extrinsic, program, move } = route;

    if (extrinsic) {
      const { address, amount, asset, sender } = ctx;
      const substrate = await SubstrateService.create(chain as Parachain);
      const account = await resolveAddress(sender, chain, CallType.Substrate);
      const messageId = await substrate.buildMessageId(
        account,
        amount,
        asset.originSymbol,
        address
      );
      const transfer = await extrinsic.build({
        ...ctx,
        messageId: messageId,
      });
      return { transfer, account };
    }

    const callable = contract || program || move;
    if (callable) {
      const transfer = await callable.build({ ...ctx });
      const account = await resolveAddress(ctx.sender, chain, transfer.type);
      return { transfer, account };
    }

    throw new Error(
      'AssetRoute transfer config is invalid! Specify contract, extrinsic, move or program instructions.'
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

      const data = await this.getTransactData(transact, context);
      return {
        ...data,
        chain: transact.chain,
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
  ): Promise<TransactCtx> {
    const { chain, extrinsic } = cfg;
    const config = await extrinsic.build(ctx);
    const substrate = await SubstrateService.create(chain);
    const submittable = config.getTx(substrate.client);

    const fromChain = ctx.source.chain as Parachain;
    const fromAddr = await resolveAddress(
      ctx.sender,
      fromChain,
      CallType.Substrate
    );

    const mda = acc.getMultilocationDerivatedAccount(
      fromChain.parachainId,
      fromAddr,
      chain.parachainId === 0 ? 0 : 1,
      chain.usesH160Acc
    );

    const paymentInfo = await submittable.getPaymentInfo(mda);
    const encodedTx = await submittable.getEncodedData();

    const [transactFee, transactFeeBalance] = await Promise.all([
      this.getTransactFee(cfg),
      this.getTransactFeeBalance(cfg, ctx),
    ]);

    return {
      call: encodedTx,
      chain: chain,
      fee: transactFee,
      feeBalance: transactFeeBalance,
      weight: {
        refTime: paymentInfo.weight.ref_time,
        proofSize: paymentInfo.weight.proof_size,
      },
    } as TransactCtx;
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
    const amount = big.toBigInt(fee.amount, decimals);
    return AssetAmount.fromAsset(fee.asset, {
      amount: amount,
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
    const feeBalanceConfig = await buildBalanceConfig(
      fee.balance,
      ctx.sender,
      fee.asset,
      chain
    );
    return this.adapter.getBalance(fee.asset, feeBalanceConfig);
  }
}
