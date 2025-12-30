import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { aca, dai_awh, ldot, wbtc_awh, weth_awh } from '../../assets';
import { hydration, acala } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: aca,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: aca,
      fee: {
        amount: 1,
        asset: aca,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: dai_awh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: aca,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: dai_awh,
      fee: {
        amount: 0.002926334210356268,
        asset: dai_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: wbtc_awh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: aca,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: wbtc_awh,
      fee: {
        amount: 0.00000006,
        asset: wbtc_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: weth_awh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: aca,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: weth_awh,
      fee: {
        amount: 0.000000956965470918,
        asset: weth_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  new AssetRoute({
    source: {
      asset: ldot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: aca,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: ldot,
      fee: {
        amount: 0.011,
        asset: ldot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const acalaConfig = new ChainRoutes({
  chain: acala,
  routes: [...toHydration],
});
