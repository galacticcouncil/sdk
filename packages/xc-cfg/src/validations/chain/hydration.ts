import {
  Parachain,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xc-core';

import { HydrationClient } from '../../clients';

const SYSTEM_DECIMALS = 12;
const SYSTEM_MIN = 1;

export class HydrationEdValidation extends TransferValidation {
  protected async skipFor(ctx: TransferCtx): Promise<boolean> {
    const { destination } = ctx;

    const chain = destination.chain as Parachain;
    const client = new HydrationClient(chain);

    const isExistingAccount = destination.balance.amount > 0n;
    const isSufficientAsset = await client.checkIfSufficient(
      destination.balance
    );
    return isExistingAccount || isSufficientAsset;
  }

  async validate(ctx: TransferCtx) {
    const shouldSkip = await this.skipFor(ctx);
    if (shouldSkip) {
      return;
    }

    const { address, destination } = ctx;

    const chain = destination.chain as Parachain;
    const client = new HydrationClient(chain);

    const feeAssetId = await client.getFeeAsset(address);
    const feeAsset = chain.findAssetById(feeAssetId)!;
    const feeAssetMin = feeAsset.min || SYSTEM_MIN;
    const feeAssetDecimals = feeAsset.decimals || SYSTEM_DECIMALS;
    const feeAssetEd = feeAssetMin * Math.pow(10, feeAssetDecimals);
    const feeAssetBalance = await client.getAssetBalance(address, feeAssetId);

    if (BigInt(feeAssetEd * 1.1) > feeAssetBalance) {
      throw new TransferValidationError('Insufficient_Ed', {
        amount: feeAssetEd,
        asset: feeAsset.asset.originSymbol,
        chain: chain.name,
        error: 'account.insufficientDeposit',
      });
    }
  }
}

export class HydrationDepositLimitValidation extends TransferValidation {
  async validate(ctx: TransferCtx) {
    const { amount, asset, destination } = ctx;

    const chain = destination.chain as Parachain;
    const client = new HydrationClient(chain);
    const state = await client.getAssetDepositLimit(asset);

    if (state.locked) {
      throw new TransferValidationError('Deposit_Asset_Lockdown', {
        asset: asset.originSymbol,
        chain: chain.name,
        lockedUntilBlock: state.lockedUntilBlock,
        error: 'circuitBreaker.assetLockdown',
      });
    }

    if (state.headroom !== null && amount > state.headroom) {
      throw new TransferValidationError('Deposit_Limit_Exceeded', {
        asset: asset.originSymbol,
        chain: chain.name,
        headroom: state.headroom,
        limit: state.limit,
        error: 'circuitBreaker.depositLimitExceeded',
      });
    }
  }
}

/**
 * Fee currency must cover the prepaid delivery fee.
 *
 * - Hydration's evm runner checks an `EVM.call` value against the fee
 *   currency, though the value is paid in weth
 * - Short on it, the batch fails `EVM.BalanceLow` whatever weth it holds
 * - Requires the dex price of the fee, plus the network fee, transfer amount
 *   and swap input when paid from the fee currency
 * - Skips routes without a prepaid fee, a weth fee currency and fees the dex
 *   cannot price
 */
export class HydrationEvmValueValidation extends TransferValidation {
  protected skipFor(ctx: TransferCtx): boolean {
    const { destinationFee, destinationFeePrepaid, feeBalance } = ctx.source;
    return !destinationFeePrepaid || feeBalance.isSame(destinationFee);
  }

  async validate(ctx: TransferCtx) {
    if (this.skipFor(ctx)) {
      return;
    }

    const { amount, asset, source } = ctx;
    const { chain, destinationFee, destinationFeeSwap, fee, feeBalance } =
      source;

    // Same 5% margin the wallet adds to fees priced at execution.
    const value = destinationFee.padByPct(5n);

    let priced: bigint;
    try {
      const quote = await chain.dex.getQuote(feeBalance, destinationFee, value);
      priced = quote.amount;
    } catch {
      return;
    }

    const spent = [
      fee.isSame(feeBalance) ? fee.amount : 0n,
      asset.isEqual(feeBalance) ? amount : 0n,
      destinationFeeSwap?.enabled && destinationFeeSwap.aIn.isSame(feeBalance)
        ? destinationFeeSwap.aIn.amount
        : 0n,
    ].reduce((total, a) => total + a, 0n);

    const required = feeBalance.copyWith({ amount: priced + spent });

    if (feeBalance.amount < required.amount) {
      throw new TransferValidationError('Insufficient_Fee_Balance', {
        amount: required.toDecimal(),
        asset: required.symbol,
        chain: chain.name,
        error: 'fee.insufficientBalance',
      });
    }
  }
}

export class HydrationWithdrawLimitValidation extends TransferValidation {
  async validate(ctx: TransferCtx) {
    const { source } = ctx;

    const chain = source.chain as Parachain;
    const client = new HydrationClient(chain);
    const state = await client.getGlobalWithdrawLimit();

    if (state.lockdown) {
      throw new TransferValidationError('Withdraw_Lockdown_Active', {
        chain: chain.name,
        lockdownUntilMs: state.lockdownUntilMs,
        error: 'circuitBreaker.withdrawLockdown',
      });
    }
  }
}
