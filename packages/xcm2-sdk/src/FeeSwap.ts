import {
  AssetAmount,
  DexFactory,
  FeeConfig,
  SwapCtx,
  TransferCtx,
} from '@galacticcouncil/xcm2-core';

export class FeeSwap {
  readonly ctx: TransferCtx;

  constructor(ctx: TransferCtx) {
    this.ctx = ctx;
  }

  get asset() {
    const { source } = this.ctx;
    return source.balance;
  }

  get dex() {
    const { source } = this.ctx;
    return DexFactory.getInstance().get(source.chain.key);
  }

  get destFee() {
    const { source, transact } = this.ctx;
    return transact ? transact.fee : source.destinationFee;
  }

  get destFeeBalance() {
    const { source, transact } = this.ctx;
    return transact ? transact.feeBalance : source.destinationFeeBalance;
  }

  get feeBalance() {
    const { source } = this.ctx;
    return source.feeBalance;
  }

  /**
   * Fee swap context
   *
   * @param fee - source chain fee
   * @returns source fee swap context
   */
  async getSwap(fee: AssetAmount): Promise<SwapCtx | undefined> {
    const { asset, decimals } = await this.dex!.chain.getCurrency();
    const { amount } = await this.dex!.getQuote(asset, fee, fee);

    return {
      aIn: fee,
      aOut: AssetAmount.fromAsset(asset, {
        amount: amount,
        decimals: decimals,
      }),
      enabled: true,
    } as SwapCtx;
  }

  /**
   * Swap source fee only if explicitly enabled in route
   * fee config
   *
   * @param fee - source chain fee config
   * @returns true if supported, otherwise false
   */
  isSwapSupported(cfg?: FeeConfig) {
    const isDex = !!this.dex;
    const isSwapEnabled = cfg && cfg.swap;
    return isDex && !!isSwapEnabled;
  }

  /**
   * Destination fee swap context
   *
   * Swap is enabled if following applies:
   *  - account has not enough destination fee balance
   *  - account has enough source fee reserves (double the fee) to buy required asset
   *
   * Note: Slippage can be set up to 100% in builder config (see maxAmountIn)
   *
   * @param fee - source chain fee
   * @returns destination fee swap context
   */
  async getDestinationSwap(fee: AssetAmount): Promise<SwapCtx | undefined> {
    const { amount, route } = await this.dex!.getQuote(
      fee,
      this.destFee,
      this.destFee
    );

    const hasNotEnoughDestFee =
      this.destFeeBalance.amount < this.destFee.amount;
    const hasEnoughReservesToSwap =
      this.feeBalance.amount - fee.amount > amount * 2n;

    return {
      aIn: fee.copyWith({ amount: amount }),
      aOut: this.destFee,
      enabled: hasNotEnoughDestFee && hasEnoughReservesToSwap,
      route: route,
    } as SwapCtx;
  }

  /**
   * Swap destination fee only if:
   *  - transfer asset insufficient
   *  - destination fee asset is different than fee asset
   *
   * @param fee - source chain fee
   * @returns true if supported, otherwise false
   */
  isDestinationSwapSupported(fee: AssetAmount): boolean {
    const isDex = !!this.dex;
    const isSwappable = !fee.isSame(this.destFee);
    const isSufficientAssetTransfer = this.asset.isSame(this.destFee);
    return isDex && isSwappable && !isSufficientAssetTransfer;
  }
}
