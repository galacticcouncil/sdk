import {
  AssetAmount,
  DexFactory,
  FeeConfig,
  SwapCtx,
  TransferCtx,
} from '@galacticcouncil/xcm-core';

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
   * @param fee - source fee
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
   * Fee swap is only allowed if explicitly enabled in
   * route fee config
   *
   * @param fee - source fee config
   * @returns true if supported, otherwise false
   */
  isSwapSupported(cfg?: FeeConfig) {
    const isSupported = !!this.dex;
    const isConfigured = cfg && cfg.swap;
    return isSupported && !!isConfigured;
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
   * @param fee - source fee
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
   * Destination fee swap is only allowed if:
   *  - transfer asset is insufficient
   *  - destination fee asset is different than fee asset
   *
   * @param fee - route source fee
   * @returns true if supported, otherwise false
   */
  isDestinationSwapSupported(fee: AssetAmount): boolean {
    const isSupported = !!this.dex;
    const isSwappable = !fee.isSame(this.destFee);
    const isSufficientAssetTransfer = this.asset.isSame(this.destFee);
    return isSupported && isSwappable && !isSufficientAssetTransfer;
  }
}
