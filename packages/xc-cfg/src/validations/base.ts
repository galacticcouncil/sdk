import {
  AnyChain,
  AssetAmount,
  Parachain,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xc-core';

export class FeeValidation extends TransferValidation {
  async validate(ctx: TransferCtx) {
    const { source } = ctx;
    const { chain, fee, feeBalance } = source;

    if (feeBalance.amount < fee.amount) {
      throw new TransferValidationError('Insufficient_Fee_Balance', {
        amount: fee.toDecimal(),
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

    // A fee sharing the transfer asset comes out of what lands - unless the
    // route prepays it on top of the amount, out of the same balance.
    const isSufficientFeeAsset =
      asset.isEqual(source.destinationFee) && !source.destinationFeePrepaid;
    const isFeeSwap = !!enabled;
    return isSufficientFeeAsset || isFeeSwap;
  }

  async validate(ctx: TransferCtx) {
    const shouldSkip = await this.skipFor(ctx);
    if (shouldSkip) {
      return;
    }

    const { amount, asset, source } = ctx;
    const { chain, destinationFee, destinationFeeBalance } = source;

    const reserved = asset.isEqual(destinationFee) ? amount : 0n;

    const min = await this.getMin(chain, destinationFee);
    const minBalance = destinationFee.copyWith({
      amount: destinationFee.amount + min + reserved,
    });

    if (destinationFeeBalance.amount < minBalance.amount) {
      throw new TransferValidationError('Insufficient_Fee_Balance', {
        amount: minBalance.toDecimal(),
        asset: minBalance.symbol,
        chain: chain.name,
        error: 'destFee.insufficientBalance',
      });
    }
  }

  async getMin(chain: AnyChain, destFee: AssetAmount): Promise<bigint> {
    // Parachains resolve their own min (dynamic AssetHub read or static
    // assetsData min); other chains expose only the static value.
    if (chain instanceof Parachain) {
      return (await chain.getMin(destFee)).amount;
    }
    const min = chain.getAssetMin(destFee);
    return BigInt(min * 10 ** destFee.decimals);
  }
}
