import { AnyParachain, AssetAmount } from '@galacticcouncil/xc-core';
import { xcm } from '@galacticcouncil/common';

import { Binary } from 'polkadot-api';

export function buildBeneficiary(dstAccount: string) {
  const acc = dstAccount.startsWith('0x')
    ? xcm.toAccountKey20(dstAccount)
    : xcm.toAccountId32(dstAccount);

  return {
    parents: 0,
    interior: {
      type: 'X1',
      value: acc,
    },
  };
}

export function buildXcmDest(dstChain: AnyParachain) {
  return {
    type: 'V4',
    value: {
      parents: 1,
      interior: {
        type: 'X1',
        value: {
          type: 'Parachain',
          value: dstChain.parachainId,
        },
      },
    },
  };
}

const toAsset = (assetLocation: object, amount: any) => {
  return {
    id: xcm.transform(assetLocation),
    fun: {
      type: 'Fungible',
      value: amount,
    },
  };
};

export const buildXcmMessage = (
  dstAccount: string,
  dstFeeLocation: any,
  dstFee: AssetAmount,
  dstRefTime: bigint,
  dstProofSize: bigint,
  dstCallEncoded: Binary
) => {
  console.log(dstCallEncoded);
  const beneficiary = buildBeneficiary(dstAccount);
  const feeAsset = toAsset(dstFeeLocation, dstFee.amount);

  return {
    type: 'V4',
    value: [
      {
        type: 'WithdrawAsset',
        value: [feeAsset],
      },
      {
        type: 'BuyExecution',
        value: {
          fees: feeAsset,
          weight_limit: {
            type: 'Unlimited',
          },
        },
      },
      {
        type: 'Transact',
        value: {
          origin_kind: {
            type: 'SovereignAccount',
          },
          require_weight_at_most: {
            ref_time: dstRefTime,
            proof_size: dstProofSize,
          },
          call: dstCallEncoded,
        },
      },
      {
        type: 'RefundSurplus',
        value: undefined,
      },
      {
        type: 'DepositAsset',
        value: {
          assets: {
            type: 'Wild',
            value: {
              type: 'AllCounted',
              value: 1,
            },
          },
          beneficiary: beneficiary,
        },
      },
    ],
  };
};
