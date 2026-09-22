import { Asset, AssetAmount } from '../asset';
import { AnyChain } from '../chain';
import { AssetRoute } from './definition';

export interface SwapCtx {
  aIn: AssetAmount;
  aOut: AssetAmount;
  enabled: boolean;
  route: any;
}

export interface TransferCtx {
  address: string;
  amount: bigint;
  asset: Asset;
  sender: string;
  source: {
    balance: AssetAmount;
    chain: AnyChain;
    destinationFee: AssetAmount;
    destinationFeeBalance: AssetAmount;
    /** Destination fee charged on source on top of the amount */
    destinationFeePrepaid?: boolean;
    destinationFeeSwap?: SwapCtx;
    fee: AssetAmount;
    feeBalance: AssetAmount;
    feeSwap?: SwapCtx;
  };
  destination: {
    balance: AssetAmount;
    chain: AnyChain;
    fee: AssetAmount;
    feeBreakdown: { [key: string]: bigint };
  };
}

export interface TransferConfig {
  chain: AnyChain;
  route: AssetRoute;
}

export interface TransferConfigs {
  origin: TransferConfig;
  // True when a route in the opposite direction exists in the config service.
  reversible: boolean;
}
