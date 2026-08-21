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
