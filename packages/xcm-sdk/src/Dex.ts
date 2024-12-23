import {
  buildRoute,
  PoolService,
  PoolType,
  TradeRouter,
} from '@galacticcouncil/sdk';
import {
  AssetAmount,
  ConfigService,
  Parachain,
  SwapCtx,
  TransferCtx,
} from '@galacticcouncil/xcm-core';

import { IS_DEX, IS_HUB, findChain } from './Dex.utils';

export class Dex {
  readonly chain: Parachain;
  readonly hub: Parachain;
  readonly router: TradeRouter;

  constructor(configService: ConfigService, poolService: PoolService) {
    this.chain = findChain(configService.chains, IS_DEX, 'DEX');
    this.hub = findChain(configService.chains, IS_HUB, 'HUB');
    this.router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni, PoolType.Stable],
    });
  }

  isSwapSupported(fee: AssetAmount, ctx: TransferCtx): boolean {
    const { asset, source } = ctx;
    const effectiveFee = this.getEffectiveFee(ctx);
    const isSupported = IS_HUB(source.chain) || IS_DEX(source.chain);
    const isSufficientAssetTransfer = asset.isEqual(effectiveFee);
    return (
      isSupported && !isSufficientAssetTransfer && !fee.isSame(effectiveFee)
    );
  }

  async calculateFeeSwap(fee: AssetAmount, ctx: TransferCtx): Promise<SwapCtx> {
    const { source } = ctx;
    const effectiveFee = this.getEffectiveFee(ctx);
    const effectiveFeeBalance = this.getEffectiveFeeBalance(ctx);
    const assetIn = this.chain.getMetadataAssetId(fee);
    const assetOut = this.chain.getMetadataAssetId(effectiveFee);
    const amountOut = effectiveFee.toDecimal(effectiveFee.decimals);

    const trade = await this.router.getBestBuy(
      assetIn.toString(),
      assetOut.toString(),
      amountOut
    );

    const amountIn = BigInt(trade.amountIn.toNumber());
    // Allow max slippage up to 100% in builder config
    const maxAmountIn = amountIn * 2n;

    const hasNotEnoughDestFee =
      effectiveFeeBalance.amount < effectiveFee.amount;
    const hasEnoughReservesToSwap =
      source.feeBalance.amount - fee.amount > maxAmountIn;

    return {
      aIn: fee.copyWith({ amount: amountIn }),
      aOut: effectiveFee,
      enabled: hasNotEnoughDestFee && hasEnoughReservesToSwap,
      route: buildRoute(trade.swaps),
    } as SwapCtx;
  }

  private getEffectiveFee(ctx: TransferCtx) {
    const { source, transact } = ctx;
    return transact ? transact.fee : source.destinationFee;
  }

  private getEffectiveFeeBalance(ctx: TransferCtx) {
    const { source, transact } = ctx;
    return transact ? transact.feeBalance : source.destinationFeeBalance;
  }
}
