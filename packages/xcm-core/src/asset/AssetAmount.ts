import Big, { RoundingMode } from 'big.js';
import { Asset, AssetParams } from './Asset';
import { big } from '../utils';

Big.NE = -18;

export interface AssetAmountParams {
  amount: bigint;
  decimals: number;
  symbol?: string;
}

export interface AssetAmountConstructorParams
  extends AssetParams,
    AssetAmountParams {}

export class AssetAmount extends Asset {
  readonly amount: bigint;

  readonly decimals: number;

  readonly symbol: string;

  constructor({
    amount,
    decimals,
    symbol,
    ...other
  }: AssetAmountConstructorParams) {
    super(other);

    this.amount = BigInt(amount);
    this.decimals = decimals;
    this.symbol = symbol || this.originSymbol;
  }

  static fromAsset(asset: Asset, params: AssetAmountParams) {
    return new AssetAmount({
      ...asset,
      ...params,
    });
  }

  isSame(asset: AssetAmount): boolean {
    return super.isEqual(asset) && this.decimals === asset.decimals;
  }

  isEqual(asset: AssetAmount): boolean {
    return this.isSame(asset) && this.amount === asset.amount;
  }

  copyWith(params: Partial<AssetAmountConstructorParams>) {
    return new AssetAmount({
      ...this,
      ...params,
    });
  }

  padByPct(pct: bigint) {
    return new AssetAmount({
      ...this,
      amount: this.amount + (this.amount * pct) / 100n,
    });
  }

  toBig(): Big {
    return Big(this.amount.toString());
  }

  toBigDecimal(maxDecimal?: number, roundType?: RoundingMode): Big {
    return Big(this.toDecimal(maxDecimal, roundType));
  }

  toDecimal(maxDecimal?: number, roundType?: RoundingMode): string {
    return big.toDecimal(this.amount, this.decimals, maxDecimal, roundType);
  }
}
