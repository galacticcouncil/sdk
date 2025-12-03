import { Asset, Parachain } from '@galacticcouncil/xc-core';

import { ACCOUNT_SS_58, AMOUNT_MAX, DOT_LOCATION, TOPIC } from './const';

import { getExtrinsicAccount, getExtrinsicAssetLocation, locationOrError } from '../utils';
import { XcmVersion } from '../types';

export async function buildParaERC20Received(asset: Asset, chain: Parachain) {
  const version = XcmVersion.v4;
  const transferAssetLocation = getExtrinsicAssetLocation(
    locationOrError(chain, asset),
    version
  );

  return {
    type: version,
    value: [
      {
        type: 'ReserveAssetDeposited',
        value: [
          {
            id: DOT_LOCATION,
            fun: {
              type: 'Fungible',
              value: AMOUNT_MAX,
            },
          },
          {
            id: transferAssetLocation,
            fun: {
              type: 'Fungible',
              value: AMOUNT_MAX,
            },
          },
        ],
      },
      {
        type: 'ClearOrigin',
      },
      {
        type: 'BuyExecution',
        value: {
          fees: {
            id: DOT_LOCATION,
            fun: {
              type: 'Fungible',
              value: AMOUNT_MAX,
            },
          },
          weight_limit: {
            type: 'Unlimited',
          },
        },
      },
      {
        type: 'DepositAsset',
        value: {
          assets: {
            type: 'Wild',
            value: {
              type: 'AllCounted',
              value: 2,
            },
          },
          beneficiary: {
            parents: 0,
            interior: {
              type: 'X1',
              value: getExtrinsicAccount(ACCOUNT_SS_58),
            },
          },
        },
      },
      {
        type: 'SetTopic',
        value: TOPIC,
      },
    ],
  };
}
