import {
  AssetAmount,
  SwapCtx,
  TransferValidationReport,
} from '@galacticcouncil/xcm2-core';

import { Call } from './platforms';

/**
 * Transfer source data
 *
 * @interface TransferSourceData
 * @member {AssetAmount} balance Transfer asset balance
 * @member {AssetAmount} destinationFee Transfer destination fee
 * @member {AssetAmount} destinationFeeBalance Transfer destination fee asset balance
 * @member {AssetAmount} fee Transfer fee
 * @member {AssetAmount} feeBalance Transfer fee asset balance
 * @member {SwapCtx} feeSwap Transfer fee swap context details
 * @member {AssetAmount} max Maximum allowed amount of transfer asset to send
 * @member {AssetAmount} min Minimum required amount of transfer asset to send
 */
export interface TransferSourceData {
  balance: AssetAmount;
  destinationFee: AssetAmount;
  destinationFeeBalance: AssetAmount;
  destinationFeeSwap: SwapCtx;
  fee: AssetAmount;
  feeBalance: AssetAmount;
  feeSwap: SwapCtx;
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
 * Transfer input
 *
 * @interface Transfer
 * @member {TransferSourceData} source Source chain data
 * @member {TransferDestinationData} destination Destination chain data
 */
export interface Transfer {
  source: TransferSourceData;
  destination: TransferDestinationData;
  buildCall(amount: bigint | number | string): Promise<Call>;
  estimateFee(amount: bigint | number | string): Promise<AssetAmount>;
  validate(fee?: bigint): Promise<TransferValidationReport[]>;
}
