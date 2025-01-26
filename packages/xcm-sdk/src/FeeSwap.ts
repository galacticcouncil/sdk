import {
  AssetAmount,
  DexFactory,
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
   * Swap is enabled if following applies:
   *  - account has enough transfer reserves (double the fee) to buy required asset
   *
   * @param fee - source fee
   * @returns source fee swap context
   */
  async getSwap(fee: AssetAmount): Promise<SwapCtx | undefined> {
    const { amount, route } = await this.dex!.getQuote(this.asset, fee, fee);

    const hasNotEnoughFee = this.feeBalance.amount < fee.amount;
    const hasEnoughReservesToSwap = this.asset.amount > amount * 2n;

    return {
      aIn: this.asset.copyWith({ amount: amount }),
      aOut: fee,
      enabled: hasNotEnoughFee && hasEnoughReservesToSwap,
      route: route,
    } as SwapCtx;
  }

  /**
   * Source fee swap is only allowed if:
   *  - transfer asset is sufficient
   *  - transfer asset is different than fee asset
   *
   * @param fee - source fee
   * @returns true if supported, otherwise false
   */
  isSwapSupported(fee: AssetAmount) {
    const isSupported = !!this.dex && this.dex.isFeeSwapSupported(this.asset);
    const isSufficientAssetTransfer = this.asset.isSame(this.destFee);
    return isSupported && isSufficientAssetTransfer && !this.asset.isEqual(fee);
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
   *  - destination fee asset is different than source fee
   *
   * @param fee - route source fee
   * @returns true if supported, otherwise false
   */
  isDestinationSwapSupported(fee: AssetAmount): boolean {
    const isSupported = !!this.dex;
    const isSufficientAssetTransfer = this.asset.isSame(this.destFee);
    return (
      isSupported && !isSufficientAssetTransfer && !fee.isSame(this.destFee)
    );
  }
}
