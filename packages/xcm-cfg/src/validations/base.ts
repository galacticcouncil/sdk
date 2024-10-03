import {
  AnyChain,
  AssetAmount,
  Parachain,
  TransferData,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xcm-core';

import { HubClient } from '../clients';

export class FeeValidation extends TransferValidation {
  async validate(data: TransferData) {
    const { source } = data;
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
  protected async skipFor(data: TransferData): Promise<boolean> {
    const { asset, source, destination } = data;
    const { enabled } = source.feeSwap || {};
    const isSufficientFeeAsset = asset.isEqual(destination.fee);
    const isFeeSwap = !!enabled;
    return isSufficientFeeAsset || isFeeSwap;
  }

  async validate(data: TransferData) {
    const shouldSkip = await this.skipFor(data);
    if (shouldSkip) {
      return;
    }

    const { source, destination } = data;
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
