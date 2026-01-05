import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { aca, dai_awh, ldot, wbtc_awh, weth_awh } from '../../assets';
import { hydration, acala } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
} from '../../builders';

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
        amount: FeeAmountBuilder().PolkadotXcm().calculateLimitedReserveTransferFee(),
        asset: aca,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
        amount: FeeAmountBuilder().PolkadotXcm().calculateLimitedReserveTransferFee(),
        asset: dai_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
        amount: FeeAmountBuilder().PolkadotXcm().calculateLimitedReserveTransferFee(),
        asset: wbtc_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
        amount: FeeAmountBuilder().PolkadotXcm().calculateLimitedReserveTransferFee(),
        asset: weth_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
        amount: FeeAmountBuilder().PolkadotXcm().calculateLimitedReserveTransferFee(),
        asset: ldot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const acalaConfig = new ChainRoutes({
  chain: acala,
  routes: [...toHydration],
});
