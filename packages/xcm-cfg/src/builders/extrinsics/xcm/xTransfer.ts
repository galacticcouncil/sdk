import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { locationOrError } from './utils';
import { toAsset, toDest } from './xTransfer.utils';

import {
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
} from '../../ExtrinsicBuilder.utils';
import { XcmVersion } from 'builders/types';

const pallet = 'xTransfer';

const transfer = (): ExtrinsicConfigBuilder => ({
  build: ({ address, amount, asset, destination, source }) => {
    return new ExtrinsicConfig({
      module: pallet,
      func: 'transfer',
      getArgs: () => {
        const version = XcmVersion.v3;
        const account = getExtrinsicAccount(address);
        const ctx = source.chain as Parachain;
        const rcv = destination.chain as Parachain;

        const transferAssetLocation = getExtrinsicAssetLocation(
          locationOrError(ctx, asset),
          version
        );
        const transferAsset = toAsset(transferAssetLocation, amount);
        const dest = toDest(rcv, account);

        return [
          transferAsset,
          dest,
          {
            refTime: 5_000_000_000,
            proofSize: 0,
          },
        ];
      },
    });
  },
});

export const xTransfer = () => {
  return {
    transfer,
  };
};
