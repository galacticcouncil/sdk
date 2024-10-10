import {
  AssetAmount,
  SwapInfo,
  TransferValidationReport,
} from '@galacticcouncil/xcm-core';

/**
 * Transfer source data
 *
 * @interface TransferSourceData
 * @member {AssetAmount} balance Transfer asset balance
 * @member {AssetAmount} destinationFeeBalance Transfer destination fee asset balance
 * @member {AssetAmount} fee Transfer fee
 * @member {AssetAmount} feeBalance Transfer fee asset balance
 * @member {SwapInfo} feeSwap Transfer fee swap details
 * @member {AssetAmount} max Maximum allowed amount of transfer asset to send
 * @member {AssetAmount} min Minimum required amount of transfer asset to send
 */
export interface TransferSourceData {
  balance: AssetAmount;
  destinationFeeBalance: AssetAmount;
  fee: AssetAmount;
  feeBalance: AssetAmount;
  feeSwap: SwapInfo;
  max: AssetAmount;
  min: AssetAmount;
}

/**
 * Transfer destination data
 *
 * @interface TransferDestinationData
 * @member {AssetAmount} balance Received asset balance
 * @member {AssetAmount} fee Transfer destination fee
 */
export interface TransferDestinationData {
  balance: AssetAmount;
  fee: AssetAmount;
}

/**
 * Transfer (X) data
 *
 * @interface XTransfer
 * @member {TransferSourceData} source Source chain data
 * @member {TransferDestinationData} destination Destination chain data
 */
export interface XTransfer {
  source: TransferSourceData;
  destination: TransferDestinationData;
  buildCall(amount: bigint | number | string): Promise<XCall>;
  estimateFee(amount: bigint | number | string): Promise<AssetAmount>;
  validate(fee?: bigint): Promise<TransferValidationReport[]>;
}

export interface XCall {
  /** Owner of transation. */
  from: string;
  /** Hex-encoded call data. */
  data: `0x${string}`;
}

export interface XCallEvm extends XCall {
  /** Solidity JSON string ABI. */
  abi?: string;
  /** Spending CAP */
  allowance?: bigint;
  /** The address the transaction is directed to. */
  to: `0x${string}`;
  /** Value sent with this transaction. */
  value?: bigint;
}
