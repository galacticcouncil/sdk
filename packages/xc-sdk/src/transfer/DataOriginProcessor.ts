import {
  addr,
  Asset,
  AssetAmount,
  BaseConfig,
  CallType,
  FeeAmountConfigBuilder,
  FeeAssetConfigBuilder,
  Parachain,
  TransferCtx,
  TransferConfig,
  TransactCtx,
  TransactConfig,
} from '@galacticcouncil/xc-core';
import { acc, big } from '@galacticcouncil/common';

import { formatAmount, formatEvmAddress } from './utils';
import { Call, PlatformAdapter, SubstrateService } from '../platforms';

import { DataProcessor } from './DataProcessor';

const { EvmAddr } = addr;

/**
 * Resolves origin-side transfer data — balance, minimum and existential
 * deposit (via {@link DataProcessor}) plus the source/destination fee
 * estimates and the transfer {@link Call} — sourcing `(chain, asset)` and the
 * route from its `TransferConfig`.
 */
export class DataOriginProcessor extends DataProcessor {
  readonly config: TransferConfig;

  constructor(adapter: PlatformAdapter, config: TransferConfig) {
    super(adapter, config.chain, config.route.source.asset);
    this.config = config;
  }

  async getCall(ctx: TransferCtx): Promise<Call> {
    const [call] = await this.getCalls(ctx);
    return call;
  }

  async getCalls(ctx: TransferCtx): Promise<Call[]> {
    const { amount, sender, source } = ctx;
    const transfer = await this.getTransfer(ctx);
    return this.adapter.buildCalls(sender, amount, source.feeBalance, transfer);
  }

  /**
   * @param address - recipient on the destination. Only needed by a fee whose
   * size depends on the accounts the delivery opens there (an svm redeem
   * opening the recipient's ata), and it has to match what the transfer is
   * built with - the executor honours a quote only for what it priced.
   */
  async getDestinationFee(
    transferAmount?: bigint,
    address?: string
  ): Promise<{
    fee: AssetAmount;
    feeBreakdown: { [key: string]: bigint };
  }> {
    const { chain, route } = this.config;
    const { source, destination, transact } = route;

    const feeAmount = destination.fee.amount;
    const feeAsset = source.destinationFee ?? destination.fee.asset;
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
      destinationAsset: destination.asset,
      source: transact ? transact.chain : chain,
      destination: destination.chain,
      amount: transferAmount,
      address: address,
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
    const { source, destination } = this.config.route;

    const asset = source.asset;
    const feeAsset = source.destinationFee ?? destination.fee.asset;

    if (asset.isEqual(feeAsset)) {
      return this.getBalance(address);
    }

    return this.config.chain.getBalance(feeAsset, address);
  }

  async getFee(ctx: TransferCtx): Promise<AssetAmount> {
    const { chain, route } = this.config;
    const { amount, sender, source } = ctx;

    const transfer = await this.getTransfer(ctx);

    // Evm calls are signed by (and metered against) the h160, whatever the
    // origin the route resolved them for.
    const [config] = transfer;
    const address =
      config.type === CallType.Evm
        ? await formatEvmAddress(sender, chain)
        : sender;

    const networkFee = await this.adapter.estimateFee(
      address,
      amount,
      source.feeBalance,
      transfer
    );

    const { fee } = route.source;
    const extraFee = fee ? formatAmount(networkFee.decimals, fee.extra) : 0n;
    const totalFee = networkFee.amount + extraFee;
    return networkFee.copyWith({ amount: totalFee });
  }

  async getFeeBalance(address: string): Promise<AssetAmount> {
    const { source } = this.config.route;

    if (!source.fee) {
      return this.getBalance(address);
    }

    const feeAsset = await this.getFeeAsset(address);
    return this.config.chain.getBalance(feeAsset, address);
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

  /**
   * Calls of the transfer, in execution order.
   *
   * A route may declare a config per signer origin: an h160 signer takes the
   * `contract` and signs the evm calls itself, anyone else takes the
   * `extrinsic`, which on an evm parachain wraps the very same calls in
   * `EVM.call`. Where only one is declared, that one serves every origin the
   * chain has.
   */
  private async getTransfer(ctx: TransferCtx): Promise<BaseConfig[]> {
    const { chain, route } = this.config;
    const { contract, extrinsic, program, move } = route;

    if (extrinsic && !(contract && EvmAddr.isValid(ctx.sender))) {
      const { address, amount, asset, sender } = ctx;
      const substrate = await SubstrateService.create(chain as Parachain);
      const messageId = await substrate.buildMessageId(
        sender,
        amount,
        asset.originSymbol,
        address
      );
      return [
        await extrinsic.build({
          ...ctx,
          messageId: messageId,
        }),
      ];
    }

    const callable = contract || program || move;
    if (callable) {
      return callable.build({
        ...ctx,
      });
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
    const fromAddr = ctx.sender;

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
    return this.config.chain.getBalance(cfg.fee.asset, ctx.sender);
  }
}
