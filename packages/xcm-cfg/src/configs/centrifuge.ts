import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import { cfg, usdt, usdc, dot } from '../assets';
import { centrifuge, hydraDX } from '../chains';
import { BalanceBuilderV2, ExtrinsicBuilderV2 } from 'builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: cfg,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.006373834498834048,
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilderV2().substrate().ormlTokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.006373834498834048,
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilderV2().substrate().ormlTokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 1.4,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transferMultiasset(1000).X3(),
    fee: {
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilderV2().substrate().ormlTokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 1.4,
      asset: usdc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transferMultiasset(1000).X3(),
    fee: {
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

export const centrifugeConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: centrifuge,
});
