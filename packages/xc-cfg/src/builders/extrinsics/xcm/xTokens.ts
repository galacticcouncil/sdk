import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';

import { encodeAssetId } from '@galacticcouncil/common';
import { toDest } from './xTokens.utils';

import { getDerivativeAccount, getExtrinsicAccount } from './utils';
import { XcmVersion } from './types';

const pallet = 'XTokens';

const transfer = (): ExtrinsicConfigBuilder => ({
  build: async ({ address, amount, asset, destination, sender, source }) => {
    const ctx = source.chain as Parachain;
    const rcv = destination.chain as Parachain;
    const version = XcmVersion.v3;

    const receiver = rcv.usesCexForwarding
      ? getDerivativeAccount(ctx, sender, rcv)
      : address;

    const account = getExtrinsicAccount(receiver);

    const assetId = ctx.getAssetId(asset);
    const encodedAssetId = encodeAssetId(assetId);

    const func = 'transfer';
    return new ExtrinsicConfig({
      module: pallet,
      func,
      getTx: (client) => {
        return client.getUnsafeApi().tx[pallet][func]({
          currency_id: encodedAssetId,
          amount,
          dest: toDest(version, rcv, account),
          dest_weight_limit: {
            type: 'Unlimited',
          },
        });
      },
    });
  },
});

export const xTokens = () => {
  return {
    transfer,
  };
};
