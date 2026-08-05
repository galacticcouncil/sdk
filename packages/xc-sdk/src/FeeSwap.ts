import { big } from '@galacticcouncil/common';

import {
  AssetAmount,
  FeeConfig,
  Parachain,
  SwapCtx,
  TransferCtx,
} from '@galacticcouncil/xc-core';

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
    return source.chain.dex;
  }

  get destFee() {
    const { source, transact } = this.ctx;
    return transact ? transact.fee : source.destinationFee;
  }

  /** Chain the destination fee is held & spent on, matching {@link destFee}. */
  get destFeeChain() {
    const { source, transact } = this.ctx;
    return transact ? transact.chain : source.chain;
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
    try {
      this.dex;
    } catch {
      return false;
    }

    const isSwapEnabled = cfg && cfg.swap;
    return !!isSwapEnabled;
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
    // Buying exactly the fee lands an amount the account cannot spend: the
    // last `min` of it is not withdrawable, and on hydration `EVM.call` reads
    // the weth balance net of it (`eth_getBalance` returns free - ed), so the
    // call value comes up short by that much. Buy the fee plus the min, which
    // is what DestFeeValidation already checks the balance against.
    const min = await this.getDestFeeMin();
    const target = this.destFee.copyWith({
      amount: this.destFee.amount + min,
    });

    const { amount, route } = await this.dex!.getQuote(fee, target, target);

    const hasNotEnoughDestFee = this.destFeeBalance.amount < target.amount;
    const hasEnoughReservesToSwap =
      this.feeBalance.amount - fee.amount > amount * 2n;

    return {
      aIn: fee.copyWith({ amount: amount }),
      aOut: target,
      enabled: hasNotEnoughDestFee && hasEnoughReservesToSwap,
      route: route,
    } as SwapCtx;
  }

  /**
   * Existential deposit of the destination fee asset, on the chain holding it.
   *
   * Parachains resolve their own min (dynamic read or static assetsData min);
   * other chains expose only the static value. Mirrors
   * `DestFeeValidation.getMin` - the two have to agree, or the swap buys an
   * amount the validation then rejects.
   */
  private async getDestFeeMin(): Promise<bigint> {
    const chain = this.destFeeChain;
    if (chain instanceof Parachain) {
      return (await chain.getMin(this.destFee)).amount;
    }
    return big.toBigInt(chain.getAssetMin(this.destFee), this.destFee.decimals);
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
    try {
      this.dex;
    } catch {
      return false;
    }

    const isSwappable = !fee.isSame(this.destFee);
    const isSufficientAssetTransfer = this.asset.isSame(this.destFee);
    return isSwappable && !isSufficientAssetTransfer;
  }
}
