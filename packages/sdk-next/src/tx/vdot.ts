import { Enum, SizedHex } from 'polkadot-api';

import { xcm } from '@galacticcouncil/common';
import {
  XcmV2OriginKind,
  XcmV3MultiassetFungibility,
  XcmV5AssetFilter,
  XcmV5Instruction,
  XcmV5Junction,
  XcmV5Junctions,
  XcmV5WildAsset,
} from '@galacticcouncil/descriptors';

import {
  ASSET_HUB_PARACHAIN_ID,
  BIFROST_PARACHAIN_ID,
  HYDRATION_PARACHAIN_ID,
} from '../consts';

import { VdotMintBudgets } from './types';

export const VDOT_ASSET_ID = 15;

/** DOT, reserve-backed by Asset Hub on Hydration and Bifrost alike */
export const DOT_LOCATION = { parents: 1, interior: XcmV5Junctions.Here() };

/** vDOT (Bifrost `VToken2(0)`) as Hydration addresses it */
export const VDOT_LOCATION = {
  parents: 1,
  interior: XcmV5Junctions.X2([
    XcmV5Junction.Parachain(BIFROST_PARACHAIN_ID),
    XcmV5Junction.GeneralKey({
      length: 2,
      data: '0x0900000000000000000000000000000000000000000000000000000000000000' as SizedHex<32>,
    }),
  ]),
};

type AssetLocation = typeof DOT_LOCATION | typeof VDOT_LOCATION;
type Location = { parents: number; interior: XcmV5Junctions };

/** Sibling parachain location */
export const sibling = (paraId: number): Location => ({
  parents: 1,
  interior: XcmV5Junctions.X1(XcmV5Junction.Parachain(paraId)),
});

/** Account local to the chain executing the message */
const local = (address: string): Location => ({
  parents: 0,
  interior: XcmV5Junctions.X1(
    XcmV5Junction.AccountId32(xcm.toAccountId32(address).value)
  ),
});

/** Hydration account as Bifrost addresses it */
const fromHydration = (address: string): Location => ({
  parents: 1,
  interior: XcmV5Junctions.X2([
    XcmV5Junction.Parachain(HYDRATION_PARACHAIN_ID),
    XcmV5Junction.AccountId32(xcm.toAccountId32(address).value),
  ]),
});

const fungible = (id: AssetLocation, amount: bigint) => ({
  id,
  fun: XcmV3MultiassetFungibility.Fungible(amount),
});

const allCounted = XcmV5AssetFilter.Wild(XcmV5WildAsset.AllCounted(1));

const transact = (call: Uint8Array) =>
  XcmV5Instruction.Transact({
    origin_kind: XcmV2OriginKind.SovereignAccount(),
    fallback_max_weight: undefined,
    call,
  });

/**
 * Returns the fee asset the hop leaves over to `beneficiary`.
 *
 * - Runs after the hop, failed or not: unused fees are refunded, not trapped
 * - Counted to one asset; `All` is weighed as a full holding and fails `PayFees`
 */
const refundTo = (beneficiary: Location) =>
  XcmV5Instruction.SetAppendix([
    XcmV5Instruction.RefundSurplus(),
    XcmV5Instruction.DepositAsset({ assets: allCounted, beneficiary }),
  ]);

export interface VdotMintXcmParams {
  /** Signer on Hydration; its origin is kept through every hop */
  account: string;
  /** DOT withdrawn on Hydration */
  amount: bigint;
  budgets: VdotMintBudgets;
  /** Bifrost call the signer's Bifrost account dispatches */
  bifrostCall: Uint8Array;
}

/**
 * Hydration program that mints vDOT on Bifrost for the signer.
 *
 * - DOT travels Hydration → Asset Hub → Bifrost, origin preserved
 * - On Bifrost it lands on the signer's derived account, which runs `bifrostCall`
 * - Each hop refunds what it leaves over to the signer
 *
 * @param params - see {@link VdotMintXcmParams}
 */
export function buildVdotMintXcm(
  params: VdotMintXcmParams
): XcmV5Instruction[] {
  const { account, amount, budgets, bifrostCall } = params;

  const onBifrost = [
    refundTo(fromHydration(account)),
    XcmV5Instruction.DepositAsset({
      assets: allCounted,
      beneficiary: fromHydration(account),
    }),
    transact(bifrostCall),
  ];

  const onAssetHub = [
    refundTo(local(account)),
    XcmV5Instruction.InitiateTransfer({
      destination: sibling(BIFROST_PARACHAIN_ID),
      remote_fees: Enum(
        'ReserveDeposit',
        XcmV5AssetFilter.Definite([fungible(DOT_LOCATION, budgets.bifrost)])
      ),
      preserve_origin: true,
      assets: [Enum('ReserveDeposit', allCounted)],
      remote_xcm: onBifrost,
    }),
  ];

  return [
    XcmV5Instruction.WithdrawAsset([fungible(DOT_LOCATION, amount)]),
    XcmV5Instruction.PayFees({
      asset: fungible(DOT_LOCATION, budgets.hydration),
    }),
    refundTo(local(account)),
    XcmV5Instruction.InitiateTransfer({
      destination: sibling(ASSET_HUB_PARACHAIN_ID),
      remote_fees: Enum(
        'ReserveWithdraw',
        XcmV5AssetFilter.Definite([fungible(DOT_LOCATION, budgets.assetHub)])
      ),
      preserve_origin: true,
      assets: [Enum('ReserveWithdraw', allCounted)],
      remote_xcm: onAssetHub,
    }),
  ];
}

export interface VdotSupplyXcmParams {
  /** Hydration account holding the minted vDOT */
  helper: string;
  /** vDOT the helper pays for execution */
  fee: bigint;
  /** Hydration call the helper dispatches */
  helperCall: Uint8Array;
}

/**
 * Message the signer's Bifrost account sends to Hydration after the mint.
 *
 * - Arrives behind the mint's own vDOT transfer on the same channel
 * - The helper pays `fee` in vDOT and runs `helperCall`; unused fees return to it
 *
 * @param params - see {@link VdotSupplyXcmParams}
 */
export function buildVdotSupplyXcm(
  params: VdotSupplyXcmParams
): XcmV5Instruction[] {
  const { helper, fee, helperCall } = params;
  return [
    XcmV5Instruction.WithdrawAsset([fungible(VDOT_LOCATION, fee)]),
    XcmV5Instruction.PayFees({ asset: fungible(VDOT_LOCATION, fee) }),
    refundTo(local(helper)),
    transact(helperCall),
  ];
}

export interface VdotSupplyRehearsalXcmParams extends VdotSupplyXcmParams {
  /** vDOT the mint credits to the helper */
  credited: bigint;
  /** Signer's account on Bifrost, the supply message's origin */
  bifrostAccount: string;
}

/**
 * Bifrost-origin message that replays the supply on a helper already holding the minted vDOT.
 *
 * - A dry run carries no state between the two messages Bifrost sends
 * - So this funds the helper, takes the Bifrost account's origin and runs
 *   {@link buildVdotSupplyXcm} unchanged
 *
 * @param params - see {@link VdotSupplyRehearsalXcmParams}
 */
export function buildVdotSupplyRehearsalXcm(
  params: VdotSupplyRehearsalXcmParams
): XcmV5Instruction[] {
  const { credited, fee, helper, bifrostAccount } = params;
  return [
    XcmV5Instruction.ReserveAssetDeposited([
      fungible(VDOT_LOCATION, credited + fee),
    ]),
    XcmV5Instruction.PayFees({ asset: fungible(VDOT_LOCATION, fee) }),
    XcmV5Instruction.DepositAsset({
      assets: allCounted,
      beneficiary: local(helper),
    }),
    XcmV5Instruction.DescendOrigin(
      XcmV5Junctions.X1(
        XcmV5Junction.AccountId32(xcm.toAccountId32(bifrostAccount).value)
      )
    ),
    ...buildVdotSupplyXcm(params),
  ];
}
