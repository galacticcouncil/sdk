import { AnyParachain, AssetAmount } from '@galacticcouncil/xc-core';

export function buildBeneficiary(dstAccount: string) {
  return dstAccount.startsWith('0x')
    ? {
        parents: 0,
        interior: {
          X1: [
            {
              AccountKey20: {
                key: dstAccount,
              },
            },
          ],
        },
      }
    : {
        parents: 0,
        interior: {
          X1: [
            {
              AccountId32: {
                id: dstAccount,
              },
            },
          ],
        },
      };
}

export function buildXcmDest(dstChain: AnyParachain) {
  return {
    V4: {
      parents: 1,
      interior: {
        X1: [
          {
            Parachain: dstChain.parachainId,
          },
        ],
      },
    },
  };
}

export function buildXcmMessage(
  dstAccount: string,
  dstFeeLocation: any,
  dstFee: AssetAmount,
  dstRefTime: number,
  dstProofSize: string,
  dstCallEncoded: string
) {
  const dstBeneficiary = buildBeneficiary(dstAccount);
  return {
    V4: [
      {
        WithdrawAsset: [
          {
            id: dstFeeLocation,
            fun: {
              Fungible: dstFee.amount,
            },
          },
        ],
      },
      {
        BuyExecution: {
          fees: {
            id: dstFeeLocation,
            fun: {
              Fungible: dstFee.amount,
            },
          },
          weightLimit: 'Unlimited',
        },
      },
      {
        Transact: {
          originKind: 'SovereignAccount',
          requireWeightAtMost: {
            refTime: dstRefTime,
            proofSize: dstProofSize,
          },
          call: {
            encoded: dstCallEncoded,
          },
        },
      },
      {
        RefundSurplus: {},
      },
      {
        DepositAsset: {
          assets: { Wild: { AllCounted: 1 } },
          beneficiary: dstBeneficiary,
        },
      },
    ],
  };
}
