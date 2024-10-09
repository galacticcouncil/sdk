import {
  Parachain,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xcm-core';

import { HubClient } from '../../clients';

export class HubEdValidation extends TransferValidation {
  protected async skipFor(data: TransferCtx): Promise<boolean> {
    const { asset, destination } = data;
    const isSufficientFeeAsset = asset.isEqual(destination.fee);
    return isSufficientFeeAsset;
  }

  async validate(ctx: TransferCtx) {
    const shouldSkip = await this.skipFor(ctx);
    if (shouldSkip) {
      return;
    }

    const { address, destination } = ctx;
    const chain = destination.chain as Parachain;
    const client = new HubClient(chain);
    const balance = await client.getSystemAccountBalance(address);
    if (balance === 0n) {
      throw new TransferValidationError('Insufficient_Ed', {
        amount: '0.1',
        asset: 'DOT',
        chain: destination.chain.name,
        error: 'account.insufficientDeposit',
      });
    }
  }
}

export class HubFrozenValidation extends TransferValidation {
  async validate(ctx: TransferCtx) {
    const { address, asset, source } = ctx;

    const chain = source.chain as Parachain;
    const client = new HubClient(chain);

    const isFrozen = await client.checkIfFrozen(address, asset);
    if (isFrozen) {
      throw new TransferValidationError('Asset_Frozen', {
        asset: asset.originSymbol,
        chain: source.chain.name,
        error: 'asset.frozen',
      });
    }
  }
}
