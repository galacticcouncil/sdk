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
  /** Account a route paying a deposit address refunds to. */
  refundAddress?: string;
  /** Deposit address the transfer opened. */
  deposit?: TransferDeposit;
}

/** Deposit address a route pays, for the amount it was opened for. */
export interface TransferDeposit {
  /** Smallest unit of the source asset. */
  amount: bigint;
  depositAddress: string;
  correlationId: string;
  /** ISO timestamp the deposit address stops accepting. */
  deadline: string;
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
