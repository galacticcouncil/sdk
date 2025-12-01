import { Asset, Parachain } from '@galacticcouncil/xc-core';

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
    type: version,
    value: [
      {
        type: 'WithdrawAsset',
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
      ...bridgeXcmOnDest.value,
    ],
  };
}
