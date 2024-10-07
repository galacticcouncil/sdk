import {
  AnyChain,
  AssetAmount,
  Parachain,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xcm-core';

import { HubClient } from '../clients';

export class FeeValidation extends TransferValidation {
  async validate(ctx: TransferCtx) {
    const { source } = ctx;
    const { fee, feeBalance } = source;
    if (fee && feeBalance.amount < fee.amount) {
      throw new TransferValidationError('Insufficient_Fee_Balance', {
        amount: fee.toDecimal(fee.decimals),
        asset: fee.symbol,
        chain: source.chain.name,
        error: 'fee.insufficientBalance',
      });
    }
  }
}

export class DestFeeValidation extends TransferValidation {
  protected async skipFor(ctx: TransferCtx): Promise<boolean> {
    const { asset, source, destination } = ctx;
    const { enabled } = source.feeSwap || {};
    const isSufficientFeeAsset = asset.isEqual(destination.fee);
    const isFeeSwap = !!enabled;
    return isSufficientFeeAsset || isFeeSwap;
  }

  async validate(ctx: TransferCtx) {
    const shouldSkip = await this.skipFor(ctx);
    if (shouldSkip) {
      return;
    }

    const { source, destination } = ctx;
    const min = await this.getMin(source.chain, destination.fee);
    const minBalance = destination.fee.copyWith({
      amount: destination.fee.amount + min,
    });

    if (destination.feeBalance.amount < minBalance.amount) {
      throw new TransferValidationError('Insufficient_Fee_Balance', {
        amount: minBalance.toDecimal(minBalance.decimals),
        asset: minBalance.symbol,
        chain: source.chain.name,
        error: 'destFee.insufficientBalance',
      });
    }
  }

  async getMin(chain: AnyChain, destFee: AssetAmount): Promise<bigint> {
    if (chain.key === 'assethub') {
      const client = new HubClient(chain as Parachain);
      return client.getAssetMin(destFee);
    }
    const min = chain.getAssetMin(destFee);
    const minDecimals = min * 10 ** destFee.decimals;
    return BigInt(minDecimals);
  }
}
