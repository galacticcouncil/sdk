import {
  Abi,
  AnyChain,
  AnyEvmChain,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

import { zeroAddress } from 'viem';

import { hollar } from '../../assets';
import { PSM_CORRIDORS } from '../../bridges/psm';

function unreachable(chain: AnyChain): never {
  throw new TransferValidationError('Psm_Unreachable', {
    chain: chain.name,
    error: 'psm.unreachable',
  });
}

/**
 * Checks PSM deposits before anything is signed.
 *
 * - Paused or over-allowance deposits revert on the vault
 * - A paused or over-headroom mint queues on hydration
 * - Both limits are in usdc units, like the amount
 * - Fails closed when either chain can't be read
 */
export class PsmDepositValidation extends TransferValidation {
  protected skipFor(ctx: TransferCtx): boolean {
    const { destination, source } = ctx;
    return (
      !PSM_CORRIDORS[source.chain.key] || destination.balance.key !== hollar.key
    );
  }

  async validate(ctx: TransferCtx) {
    if (this.skipFor(ctx)) {
      return;
    }

    const { amount, asset, destination, source } = ctx;
    const psm = PSM_CORRIDORS[source.chain.key];
    const vault = psm.vault as `0x${string}`;
    const facilitator = psm.facilitator as `0x${string}`;
    const src = (source.chain as AnyEvmChain).evmClient.getProvider();
    const dst = (destination.chain as AnyEvmChain).evmClient.getProvider();

    const [paused, allowance, mintPaused, headroom] = await Promise.all([
      src
        .readContract({
          abi: Abi.HollarBaseVault,
          address: vault,
          functionName: 'depositsPaused',
        })
        .catch(() => unreachable(source.chain)) as Promise<boolean>,
      src
        .readContract({
          abi: Abi.HollarBaseVault,
          address: vault,
          functionName: 'depositAllowance',
        })
        .catch(() => unreachable(source.chain)) as Promise<bigint>,
      dst
        .readContract({
          abi: Abi.HollarBaseFacilitator,
          address: facilitator,
          functionName: 'mintPaused',
        })
        .catch(() => unreachable(destination.chain)) as Promise<boolean>,
      dst
        .readContract({
          abi: Abi.HollarBaseFacilitator,
          address: facilitator,
          functionName: 'mintHeadroom',
        })
        .catch(() => unreachable(destination.chain)) as Promise<bigint>,
    ]);

    if (paused) {
      throw new TransferValidationError('Psm_Deposits_Paused', {
        chain: source.chain.name,
        error: 'psm.depositsPaused',
      });
    }

    if (mintPaused) {
      throw new TransferValidationError('Psm_Mint_Paused', {
        chain: destination.chain.name,
        error: 'psm.mintPaused',
      });
    }

    if (amount > allowance) {
      throw new TransferValidationError('Psm_Deposit_Limit_Exceeded', {
        asset: asset.originSymbol,
        chain: source.chain.name,
        decimals: source.balance.decimals,
        headroom: allowance,
        error: 'psm.depositLimitExceeded',
      });
    }

    if (amount > headroom) {
      throw new TransferValidationError('Psm_Mint_Headroom_Exceeded', {
        asset: destination.balance.originSymbol,
        chain: destination.chain.name,
        decimals: destination.balance.decimals,
        headroom: big.convertDecimals(
          headroom,
          source.balance.decimals,
          destination.balance.decimals
        ),
        error: 'psm.mintHeadroomExceeded',
      });
    }
  }
}

/**
 * Checks PSM redeems before anything is signed.
 *
 * - Paused or over-limit redeems revert on the facilitator
 * - Below one usdc unit the HOLLAR burn reverts
 * - Paused or over-allowance payouts wait in the vault's queue
 * - The allowance is net of queued credits, the payout net of the fee
 * - Recipients a payout would strand are refused, blacklisted ones too
 * - Both limits are in usdc units, the amount floored to them
 * - Fails closed when either chain can't be read
 */
export class PsmRedeemValidation extends TransferValidation {
  protected skipFor(ctx: TransferCtx): boolean {
    const { asset, destination } = ctx;
    return !PSM_CORRIDORS[destination.chain.key] || asset.key !== hollar.key;
  }

  async validate(ctx: TransferCtx) {
    if (this.skipFor(ctx)) {
      return;
    }

    const { address, amount, asset, destination, source } = ctx;
    const psm = PSM_CORRIDORS[destination.chain.key];
    const vault = psm.vault as `0x${string}`;
    const facilitator = psm.facilitator as `0x${string}`;
    const usdcToken = String(
      destination.chain.getAssetId(destination.balance)
    ) as `0x${string}`;
    const src = (source.chain as AnyEvmChain).evmClient.getProvider();
    const dst = (destination.chain as AnyEvmChain).evmClient.getProvider();

    const [paused, redeemable, claimsPaused, payout, owed, blacklisted] =
      await Promise.all([
        src
          .readContract({
            abi: Abi.HollarBaseFacilitator,
            address: facilitator,
            functionName: 'redeemPaused',
          })
          .catch(() => unreachable(source.chain)) as Promise<boolean>,
        src
          .readContract({
            abi: Abi.HollarBaseFacilitator,
            address: facilitator,
            functionName: 'maxRedeemable',
          })
          .catch(() => unreachable(source.chain)) as Promise<bigint>,
        dst
          .readContract({
            abi: Abi.HollarBaseVault,
            address: vault,
            functionName: 'claimsPaused',
          })
          .catch(() => unreachable(destination.chain)) as Promise<boolean>,
        dst
          .readContract({
            abi: Abi.HollarBaseVault,
            address: vault,
            functionName: 'payoutAllowance',
          })
          .catch(() => unreachable(destination.chain)) as Promise<bigint>,
        dst
          .readContract({
            abi: Abi.HollarBaseVault,
            address: vault,
            functionName: 'totalOwed',
          })
          .catch(() => unreachable(destination.chain)) as Promise<bigint>,
        dst
          .readContract({
            abi: Abi.FiatToken,
            address: usdcToken,
            functionName: 'isBlacklisted',
            args: [address],
          })
          .catch(() => unreachable(destination.chain)) as Promise<boolean>,
      ]);

    if (paused) {
      throw new TransferValidationError('Psm_Redeem_Paused', {
        chain: source.chain.name,
        error: 'psm.redeemPaused',
      });
    }

    if (claimsPaused) {
      throw new TransferValidationError('Psm_Claims_Paused', {
        chain: destination.chain.name,
        error: 'psm.claimsPaused',
      });
    }

    // a payout to a usdc-blacklisted address retires, the token's own included
    const stranded = [zeroAddress, psm.vault, psm.facilitator];
    if (
      blacklisted ||
      stranded.some((a) => a.toLowerCase() === address.toLowerCase())
    ) {
      throw new TransferValidationError('Psm_Invalid_Recipient', {
        chain: destination.chain.name,
        error: 'psm.invalidRecipient',
      });
    }

    const min = big.convertDecimals(
      1n,
      destination.balance.decimals,
      source.balance.decimals
    );

    // Without an amount the amount-bound checks see zero and pass.
    if (amount > 0n && amount < min) {
      throw new TransferValidationError('Psm_Below_Min_Redeem', {
        amount: source.balance.copyWith({ amount: min }).toDecimal(),
        asset: asset.originSymbol,
        chain: source.chain.name,
        decimals: source.balance.decimals,
        min: min,
        error: 'psm.belowMinRedeem',
      });
    }

    const usdc = big.convertDecimals(
      amount,
      source.balance.decimals,
      destination.balance.decimals
    );

    if (usdc > redeemable) {
      throw new TransferValidationError('Psm_Redeem_Limit_Exceeded', {
        asset: asset.originSymbol,
        chain: source.chain.name,
        decimals: source.balance.decimals,
        headroom: big.convertDecimals(
          redeemable,
          destination.balance.decimals,
          source.balance.decimals
        ),
        error: 'psm.redeemLimitExceeded',
      });
    }

    const bps = destination.feeBreakdown['redeemFeeBps'];
    const credit = usdc - (usdc * bps) / 10_000n;
    const free = payout > owed ? payout - owed : 0n;

    if (credit > free) {
      throw new TransferValidationError('Psm_Payout_Limit_Exceeded', {
        asset: destination.balance.originSymbol,
        chain: destination.chain.name,
        decimals: destination.balance.decimals,
        headroom: free,
        error: 'psm.payoutLimitExceeded',
      });
    }
  }
}
