import { Asset, AssetAmount } from '../asset';
import { AnyChain, AnyParachain } from '../chain';
import { AssetRoute } from './definition';

export interface SwapInfo {
  aIn: AssetAmount;
  aOut: AssetAmount;
  enabled: boolean;
  route: any;
}

export interface TxWeight {
  proofSize: string;
  refTime: number;
}

export interface TransactInfo {
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
    fee: AssetAmount;
    feeBalance: AssetAmount;
    feeSwap?: SwapInfo;
    destinationFeeBalance: AssetAmount;
  };
  destination: {
    balance: AssetAmount;
    chain: AnyChain;
    fee: AssetAmount;
  };
  via?: {
    chain: AnyParachain;
    fee?: AssetAmount;
    feeBalance?: AssetAmount;
    transact?: TransactInfo;
  };
}

export interface TransferConfigs {
  origin: TransferConfig;
  reverse: TransferConfig;
}

export interface TransferConfig {
  chain: AnyChain;
  route: AssetRoute;
}
