import {
  AssetAmount,
  SwapCtx,
  SwapFactory,
  TransferCtx,
} from '@galacticcouncil/xcm-core';

export class SwapResolver {
  readonly ctx: TransferCtx;

  constructor(ctx: TransferCtx) {
    this.ctx = ctx;
  }

  get effectiveFee() {
    const { source, transact } = this.ctx;
    return transact ? transact.fee : source.destinationFee;
  }

  get effectiveFeeBalance() {
    const { source, transact } = this.ctx;
    return transact ? transact.feeBalance : source.destinationFeeBalance;
  }

  get swap() {
    const { source } = this.ctx;
    return SwapFactory.getInstance().get(source.chain.key);
  }

  get isSupported() {
    return !!this.swap;
  }

  isSwapSupported(fee: AssetAmount): boolean {
    const { asset } = this.ctx;
    const isSufficientAssetTransfer = asset.isEqual(this.effectiveFee);
    const isSameAsEffective = fee.isSame(this.effectiveFee);
    return this.isSupported && !isSufficientAssetTransfer && !isSameAsEffective;
  }

  async calculateFeeSwap(fee: AssetAmount): Promise<SwapCtx> {
    const { source } = this.ctx;

    const { amount, route } = await this.swap!.getQuote(
      fee,
      this.effectiveFee,
      this.effectiveFee
    );

    // Allow max slippage up to 100% in builder config
    const maxAmountIn = amount * 2n;

    const hasNotEnoughDestFee =
      this.effectiveFeeBalance.amount < this.effectiveFee.amount;
    const hasEnoughReservesToSwap =
      source.feeBalance.amount - fee.amount > maxAmountIn;

    return {
      aIn: fee.copyWith({ amount: amount }),
      aOut: this.effectiveFee,
      enabled: hasNotEnoughDestFee && hasEnoughReservesToSwap,
      route: route,
    } as SwapCtx;
  }
}
