import { AssetAmount } from '@moonbeam-network/xcm-types';

/**
 * Transfer (X) data
 *
 * @interface XData
 * @member {AssetAmount} balance Asset balance
 * @member {AssetAmount} max Maximum allowed amount of asset to send
 * @member {AssetAmount} min Minimum required amount of asset to send
 * @member {AssetAmount} srcFee Source chain transfer fee
 * @member {AssetAmount} destFee Destination chain transfer fee
 */
export interface XData {
  balance: AssetAmount;
  max: AssetAmount;
  min: AssetAmount;
  srcFee: AssetAmount;
  destFee: AssetAmount;
  transfer(amount: bigint | number | string): XCall;
}

export interface XCall {
  /** Hex-encoded call data. */
  data: `0x${string}`;
  /** Solidity JSON string ABI. */
  abi?: string;
  /** The address the transaction is directed to. */
  to?: `0x${string}`;
  /** Value sent with this transaction. */
  value?: number;
}
