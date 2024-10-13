import { Asset, AssetAmount } from '../asset';
import { AnyChain, AnyParachain } from '../chain';
import { AssetRoute } from './definition';

export interface SwapCtx {
  aIn: AssetAmount;
  aOut: AssetAmount;
  enabled: boolean;
  route: any;
}

export interface TxWeight {
  proofSize: string;
  refTime: number;
}

export interface TransactCtx {
  chain: AnyParachain;
  fee: AssetAmount;
  feeBalance: AssetAmount;
  call: `0x${string}`;
  weight: TxWeight;
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
    fee: AssetAmount;
    feeBalance: AssetAmount;
    feeSwap?: SwapCtx;
  };
  destination: {
    balance: AssetAmount;
    chain: AnyChain;
    fee: AssetAmount;
  };
  transact?: TransactCtx;
}

export interface TransferConfigs {
  origin: TransferConfig;
  reverse: TransferConfig;
}

export interface TransferConfig {
  chain: AnyChain;
  route: AssetRoute;
}
