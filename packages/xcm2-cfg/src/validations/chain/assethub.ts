import {
  Parachain,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xcm2-core';

import { AssethubClient } from '../../clients';

export class HubEdValidation extends TransferValidation {
  protected async skipFor(ctx: TransferCtx): Promise<boolean> {
    const { asset, destination } = ctx;

    const chain = destination.chain as Parachain;
    const client = new AssethubClient(chain);

    const isSufficientFeeAsset = await client.checkIfSufficient(asset);
    return isSufficientFeeAsset;
  }

  async validate(ctx: TransferCtx) {
    const shouldSkip = await this.skipFor(ctx);
    if (shouldSkip) {
      return;
    }

    const { address, destination } = ctx;

    const chain = destination.chain as Parachain;
    const client = new AssethubClient(chain);

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
    const { asset, sender, source } = ctx;

    const chain = source.chain as Parachain;
    const client = new AssethubClient(chain);

    const isFrozen = await client.checkIfFrozen(sender, asset);
    if (isFrozen) {
      throw new TransferValidationError('Asset_Frozen', {
        asset: asset.originSymbol,
        chain: source.chain.name,
        error: 'asset.frozen',
      });
    }
  }
}
