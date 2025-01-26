import {
  Parachain,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xcm-core';

import { glmr } from '../../assets';
import { HydrationClient } from '../../clients';

const SYSTEM_DECIMALS = 12;
const SYSTEM_MIN = 1;

const ERC20_DECIMALS = 18;

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

export class HydrationMrlFeeValidation extends TransferValidation {
  protected async skipFor(ctx: TransferCtx): Promise<boolean> {
    const { source, transact } = ctx;
    const { enabled } = source.destinationFeeSwap || {};

    const isMrl = !!transact && transact.chain.key === 'moonbeam';
    const isFeeSwap = !!enabled;
    return !isMrl || isFeeSwap;
  }

  async validate(ctx: TransferCtx) {
    const shouldSkip = await this.skipFor(ctx);
    if (shouldSkip) {
      return;
    }

    const { sender, source } = ctx;

    const chain = source.chain as Parachain;
    const client = new HydrationClient(chain);

    const feeAssetId = chain.getBalanceAssetId(glmr);
    const feeAssetDecimals = chain.getAssetDecimals(glmr) || ERC20_DECIMALS;
    const feeAssetMin = 1 * Math.pow(10, feeAssetDecimals);
    const feeAssetBalance = await client.getTokensAccountsBalance(
      sender,
      feeAssetId.toString()
    );

    if (feeAssetBalance < BigInt(feeAssetMin)) {
      throw new TransferValidationError('Insufficient_Ed', {
        amount: 1,
        asset: glmr.originSymbol,
        chain: chain.name,
        error: 'destFee.insufficientBalance',
      });
    }
  }
}
