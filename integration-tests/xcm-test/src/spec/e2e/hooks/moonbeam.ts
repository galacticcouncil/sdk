import { EvmCall } from '@galacticcouncil/xcm-sdk';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { decodeFunctionData } from 'viem';
import * as c from 'console';

import { jsonFormatter } from '../../../utils/json';

const NATIVE = '0x0000000000000000000000000000000000000802';
const FOREIGN_PREFIX = '0xffffffff';

const getCurrencyId = (asset: string) => {
  const assetFmt = asset.toLowerCase();

  if (assetFmt.startsWith(FOREIGN_PREFIX)) {
    const assetHex = '0x' + assetFmt.replace(FOREIGN_PREFIX, '');
    return {
      ForeignAsset: BigInt(assetHex).toString(),
    };
  } else if (assetFmt === NATIVE) {
    return 'SelfReserve';
  } else {
    return {
      Erc20: { contractAddress: assetFmt },
    };
  }
};

const getAccountId32 = (account: string) => {
  return '0x' + account.replace('0x01', '').replace('0x03', '').slice(0, -2);
};

const getContractArgs = (calldata: EvmCall) => {
  const { abi, data } = calldata;
  return decodeFunctionData({
    abi: JSON.parse(abi!!),
    data: data as `0x${string}`,
  });
};

export const toTransferExtrinsic = (
  api: ApiPromise,
  calldata: EvmCall
): SubmittableExtrinsic => {
  const { args, functionName } = getContractArgs(calldata);

  const [asset, amount, destination, weight] = args;
  const { parents, interior } = destination;
  const [parachain, account] = interior;

  const fn = api.tx['xTokens'][functionName];
  const fnArgs = [
    getCurrencyId(asset),
    amount,
    {
      ['V4']: {
        parents: parents,
        interior: {
          X2: [
            {
              Parachain: Number(parachain),
            },
            {
              AccountId32: {
                id: getAccountId32(account),
                network: null,
              },
            },
          ],
        },
      },
    },
    'Unlimited',
  ];

  const extrinsic = fn(...fnArgs);
  c.log('🥢 Executing XTokens contract as extrinsic ...');
  c.log('🥢 Contract: ' + calldata.data);
  c.log('🥢 Extrinsic hex: ', extrinsic.toHex());
  c.log('🥢 Extrinsic args: ', JSON.stringify(fnArgs, jsonFormatter, 2));

  return extrinsic;
};
