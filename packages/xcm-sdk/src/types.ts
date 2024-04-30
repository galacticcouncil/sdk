import { AssetAmount } from '@galacticcouncil/xcm-core';

/**
 * Transfer (X) data
 *
 * @interface XTransfer
 * @member {AssetAmount} balance Asset balance
 * @member {AssetAmount} max Maximum allowed amount of asset to send
 * @member {AssetAmount} min Minimum required amount of asset to send
 * @member {AssetAmount} srcFee Source chain fee
 * @member {AssetAmount} srcFee Source chain fee asset balance
 * @member {AssetAmount} dstFee Destination chain fee
 */
export interface XTransfer {
  balance: AssetAmount;
  dstFee: AssetAmount;
  max: AssetAmount;
  min: AssetAmount;
  srcFee: AssetAmount;
  srcFeeBalance: AssetAmount;
  buildCall(amount: bigint | number | string): Promise<XCall>;
  syncFee(amount: bigint | number | string): Promise<AssetAmount>;
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
  /** The address the transaction is directed to. */
  to: `0x${string}`;
  /** Value sent with this transaction. */
  value?: bigint;
}
