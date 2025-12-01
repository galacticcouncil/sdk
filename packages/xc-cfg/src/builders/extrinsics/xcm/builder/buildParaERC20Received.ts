import { Asset, Parachain } from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';
import { XcmV3Junction, XcmV3Junctions } from '@galacticcouncil/descriptors';

import { ACCOUNT_ID_32, AMOUNT_MAX, DOT_LOCATION, TOPIC } from './const';

import { getExtrinsicAssetLocation, locationOrError } from '../utils';
import { XcmVersion } from '../types';

export async function buildParaERC20Received(asset: Asset, chain: Parachain) {
  const version = XcmVersion.v4;
  const transferAssetLocation = getExtrinsicAssetLocation(
    locationOrError(chain, asset),
    version
  );

  return {
    [version]: [
      {
        ReserveAssetDeposited: [
          {
            id: DOT_LOCATION,
            fun: {
              Fungible: AMOUNT_MAX,
            },
          },
          {
            id: transferAssetLocation,
            fun: {
              Fungible: AMOUNT_MAX,
            },
          },
        ],
      },
      { ClearOrigin: null },
      {
        BuyExecution: {
          fees: {
            id: DOT_LOCATION,
            fun: {
              Fungible: AMOUNT_MAX,
            },
          },
          weightLimit: 'Unlimited',
        },
      },
      {
        DepositAsset: {
          assets: {
            Wild: {
              AllCounted: 2,
            },
          },
          beneficiary: {
            parents: 0,
            interior: XcmV3Junctions.X1(
              XcmV3Junction.AccountId32({
                id: Binary.fromHex(ACCOUNT_ID_32),
                network: undefined,
              })
            ),
          },
        },
      },
      {
        SetTopic: TOPIC,
      },
    ],
  };
}
