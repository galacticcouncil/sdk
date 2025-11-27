import { Asset, Parachain } from '@galacticcouncil/xcm2-core';

import {
  ACCOUNT_KEY_20,
  ACCOUNT_SS_58,
  AMOUNT_MAX,
  DOT_LOCATION,
  TOPIC,
} from './const';

import { toBridgeXcmOnDest } from '../polkadotXcm.utils';
import {
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
  locationOrError,
} from '../utils';
import { XcmVersion } from '../types';

export async function buildERC20TransferFromPara(
  asset: Asset,
  chain: Parachain
) {
  const version = XcmVersion.v4;
  const transferAssetLocation = getExtrinsicAssetLocation(
    locationOrError(chain, asset),
    version
  );
  const bridgeXcmOnDest = toBridgeXcmOnDest(
    XcmVersion.v4,
    getExtrinsicAccount(ACCOUNT_KEY_20),
    getExtrinsicAccount(ACCOUNT_SS_58),
    transferAssetLocation,
    TOPIC
  );

  return {
    [version]: [
      {
        WithdrawAsset: [
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
      ...bridgeXcmOnDest[version],
    ],
  };
}
