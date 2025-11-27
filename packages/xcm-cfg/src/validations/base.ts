import {
  AnyChain,
  AssetAmount,
  Parachain,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xcm-core';

import { AssethubClient } from '../clients';

export class FeeValidation extends TransferValidation {
  async validate(ctx: TransferCtx) {
    const { source } = ctx;
    const { chain, fee, feeBalance } = source;

    if (feeBalance.amount < fee.amount) {
      throw new TransferValidationError('Insufficient_Fee_Balance', {
        amount: fee.toDecimal(fee.decimals),
        asset: fee.symbol,
        chain: chain.name,
        error: 'fee.insufficientBalance',
      });
    }
  }
}

export class DestFeeValidation extends TransferValidation {
  protected async skipFor(ctx: TransferCtx): Promise<boolean> {
    const { asset, source } = ctx;
    const { enabled } = source.destinationFeeSwap || {};

    const isSufficientFeeAsset = asset.isEqual(source.destinationFee);
    const isFeeSwap = !!enabled;
    return isSufficientFeeAsset || isFeeSwap;
  }

  async validate(ctx: TransferCtx) {
    const shouldSkip = await this.skipFor(ctx);
    if (shouldSkip) {
      return;
    }

    const { source } = ctx;
    const { chain, destinationFee, destinationFeeBalance } = source;

    const min = await this.getMin(chain, destinationFee);
    const minBalance = destinationFee.copyWith({
      amount: destinationFee.amount + min,
    });

    if (destinationFeeBalance.amount < minBalance.amount) {
      throw new TransferValidationError('Insufficient_Fee_Balance', {
        amount: minBalance.toDecimal(minBalance.decimals),
        asset: minBalance.symbol,
        chain: chain.name,
        error: 'destFee.insufficientBalance',
      });
    }
  }

  async getMin(chain: AnyChain, destFee: AssetAmount): Promise<bigint> {
    if (chain.key === 'assethub') {
      const client = new AssethubClient(chain as Parachain);
      return client.getAssetMin(destFee);
    }
    const min = chain.getAssetMin(destFee);
    const minDecimals = min * 10 ** destFee.decimals;
    return BigInt(minDecimals);
  }
}
