import { Asset, AssetAmount } from '../../asset';
import { AnyChain } from '../types';

export type SwapQuote = {
  amount: bigint;
  route: {};
};

export interface Dex {
  chain: AnyChain;

  getQuote(
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount,
    fallbackPrice?: boolean
  ): Promise<SwapQuote>;

  getCalldata(
    account: string,
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount,
    slippage?: number
  ): Promise<string>;
}
