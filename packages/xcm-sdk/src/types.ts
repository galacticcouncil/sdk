import {
  AssetAmount,
  SwapInfo,
  TransferData,
  TransferValidationReport,
} from '@galacticcouncil/xcm-core';

/**
 * Transfer (X) data
 *
 * @interface XTransfer
 * @member {AssetAmount} balance Asset balance
 * @member {AssetAmount} dstFee Destination chain fee
 * @member {AssetAmount} dstFeeBalance Destination chain fee asset balance
 * @member {AssetAmount} max Maximum allowed amount of asset to send
 * @member {AssetAmount} min Minimum required amount of asset to send
 * @member {AssetAmount} srcFee Source chain fee
 * @member {AssetAmount} srcFeeBalance Source chain fee asset balance
 * @member {SwapInfo} srcFeeSwap Source chain fee swap details
 */
export interface XTransfer {
  balance: AssetAmount;
  dstFee: AssetAmount;
  dstFeeBalance: AssetAmount;
  max: AssetAmount;
  min: AssetAmount;
  srcFee: AssetAmount;
  srcFeeBalance: AssetAmount;
  srcFeeSwap: SwapInfo;
  buildCall(amount: bigint | number | string): Promise<XCall>;
  estimateFee(amount: bigint | number | string): Promise<AssetAmount>;
  validate(delta?: TransferData): Promise<TransferValidationReport[]>;
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
