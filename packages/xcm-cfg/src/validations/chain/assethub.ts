import {
  AnyChain,
  AssetAmount,
  Parachain,
  TransferData,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xcm-core';

import { DestFeeValidation } from '../base';

import { HubClient } from '../../clients';

export class HubEdValidation extends TransferValidation {
  async validate(data: TransferData) {
    const { address, destination } = data;

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
  async validate(data: TransferData) {
    const { address, asset, source } = data;

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
