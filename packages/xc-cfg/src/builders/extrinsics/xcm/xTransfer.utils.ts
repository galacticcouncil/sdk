import { Parachain } from '@galacticcouncil/xc-core';

export const toDest = (destination: Parachain, account: any) => {
  return {
    parents: 1,
    interior: {
      X2: [
        {
          Parachain: destination.parachainId,
        },
        account,
      ],
    },
  };
};

export const toAsset = (assetLocation: object, amount: any) => {
  return {
    id: assetLocation,
    fun: {
      Fungible: amount,
    },
  };
};
