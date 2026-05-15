import {
  AssetAmount,
  SNOWBRIDGE_BASE_DISPATCH_GAS,
  SNOWBRIDGE_BASE_VERIFICATION_GAS,
  SNOWBRIDGE_FIAT_SHAMIR_GAS,
  SNOWBRIDGE_SUBMIT_GAS,
  TransferCtx,
  calculateVolumeTipInWei,
} from '@galacticcouncil/xc-core';

import { Transfer, VolumeFeeOpts } from '../types';

const SNOWBRIDGE_STANDARD_TOTAL_GAS =
  SNOWBRIDGE_SUBMIT_GAS +
  SNOWBRIDGE_BASE_VERIFICATION_GAS +
  SNOWBRIDGE_BASE_DISPATCH_GAS;
const SNOWBRIDGE_ACCELERATION_GAS_DELTA =
  SNOWBRIDGE_FIAT_SHAMIR_GAS - SNOWBRIDGE_SUBMIT_GAS;

export type SnowbridgeDirection = 'inbound' | 'outbound';

export type VolumeFeeBase = {
  amount: bigint;
  breakdown: { [key: string]: bigint };
};

export type SnowbridgeFeeState = {
  accelerationTipWei: bigint;
  volumeTipWei: bigint;
};

/**
 * Apply the Snowbridge V2 volume-based fee tip. This is the standard relayer
 * fee in V2 — must be called after every Snowbridge transfer build. Replaces
 * any prior volume tip; composes with acceleration.
 */
export function applySnowbridgeVolumeFee(
  transfer: Transfer,
  ctx: TransferCtx,
  base: VolumeFeeBase,
  state: SnowbridgeFeeState,
  direction: SnowbridgeDirection,
  opts: VolumeFeeOpts
): void {
  state.volumeTipWei = calculateVolumeTipInWei(opts);
  recompute(transfer, ctx, base, state, direction);
}

/**
 * Toggle Snowbridge V2 acceleration. When enabled, the destination fee is
 * bumped by the gas delta needed to pay a relayer for Fiat-Shamir submission
 * instead of two-phase. Outbound only — inbound is paid as native Ethereum
 * gas on the user's wallet at submission time.
 */
export function applySnowbridgeAcceleration(
  transfer: Transfer,
  ctx: TransferCtx,
  base: VolumeFeeBase,
  state: SnowbridgeFeeState,
  direction: SnowbridgeDirection,
  enabled: boolean
): void {
  if (direction !== 'outbound') return;

  if (enabled) {
    // padFeeByPercentage is linear in x, so the standard etherFeeAmount and
    // the acceleration premium share the same gasPrice * padding scalar:
    //   premium = baseEther * GAS_DELTA / STANDARD_TOTAL_GAS  (= baseEther * 5/6)
    const baseEther = base.breakdown.etherFeeAmount;
    state.accelerationTipWei =
      (baseEther * SNOWBRIDGE_ACCELERATION_GAS_DELTA) /
      SNOWBRIDGE_STANDARD_TOTAL_GAS;
  } else {
    state.accelerationTipWei = 0n;
  }

  recompute(transfer, ctx, base, state, direction);
}

function recompute(
  transfer: Transfer,
  ctx: TransferCtx,
  base: VolumeFeeBase,
  state: SnowbridgeFeeState,
  direction: SnowbridgeDirection
): void {
  const totalTipWei = state.accelerationTipWei + state.volumeTipWei;
  const dstFee = ctx.destination.fee;

  if (direction === 'inbound') {
    const newBreakdown = {
      ...base.breakdown,
      relayerFee: base.breakdown.relayerFee + totalTipWei,
      volumeTip: state.volumeTipWei,
      accelerationTip: state.accelerationTipWei,
    };
    const newFee = dstFee.copyWith({ amount: base.amount + totalTipWei });
    commit(transfer, ctx, newFee, newBreakdown);
    return;
  }

  // Outbound: displayed fee is DOT-denominated, tip is wei. Scale to DOT
  // using the base swap ratio so the breakdown stays internally consistent.
  const baseEther = base.breakdown.etherFeeAmount;
  const baseSwapDot = base.breakdown.dotToEtherSwapAmount;
  const totalTipDot = (totalTipWei * baseSwapDot) / baseEther;

  const newBreakdown = {
    ...base.breakdown,
    etherFeeAmount: baseEther + totalTipWei,
    dotToEtherSwapAmount: baseSwapDot + totalTipDot,
    volumeTip: state.volumeTipWei,
    accelerationTip: state.accelerationTipWei,
  };
  const newFee = dstFee.copyWith({ amount: base.amount + totalTipDot });
  commit(transfer, ctx, newFee, newBreakdown);
}

function commit(
  transfer: Transfer,
  ctx: TransferCtx,
  newFee: AssetAmount,
  newBreakdown: { [key: string]: bigint }
): void {
  ctx.destination.feeBreakdown = newBreakdown;
  ctx.destination.fee = newFee;
  ctx.source.destinationFee = newFee;
  transfer.destination.fee = newFee;
  transfer.source.destinationFee = newFee;
}
