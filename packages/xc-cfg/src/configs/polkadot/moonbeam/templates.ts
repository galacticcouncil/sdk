import { AnyChain, Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { glmr } from '../../../assets';
import { ContractBuilder } from '../../../builders';
import { hydration } from '../../../chains';

function toErc20Template(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: {
        asset: glmr,
      },
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: asset,
      },
    },
    contract: ContractBuilder().PolkadotXcm().transferAssetsToPara32(),
  });
}

function toXcTemplate(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: {
        asset: glmr,
      },
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: asset,
      },
    },
    contract: ContractBuilder().PolkadotXcm().transferAssetsToPara32(),
  });
}

export function toHydrationErc20Template(
  asset: Asset,
  destinationFee: number
): AssetRoute {
  return toErc20Template(asset, hydration, destinationFee);
}

export function toHydrationXcTemplate(
  asset: Asset,
  destinationFee: number
): AssetRoute {
  return toXcTemplate(asset, hydration, destinationFee);
}
