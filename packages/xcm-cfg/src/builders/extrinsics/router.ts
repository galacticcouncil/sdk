import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilder,
  Parachain,
} from '@galacticcouncil/xcm-core';

const pallet = 'router';

const buy = (): ExtrinsicConfigBuilder => {
  const func = 'buy';
  return {
    build: ({ fee, source }) =>
      new ExtrinsicConfig({
        module: pallet,
        func,
        getArgs: () => {
          const ctx = source as Parachain;
          return [
            ctx.getAssetId(fee),
            // payment asset
            fee.amount,
            // max amount in
            // route
          ];
        },
      }),
  };
};

// asset_in: T::AssetId,
// asset_out: T::AssetId,
// amount_out: T::Balance,
// max_amount_in: T::Balance,
// route: Vec<Trade<T::AssetId>>

export const router = () => {
  return {
    buy,
  };
};
