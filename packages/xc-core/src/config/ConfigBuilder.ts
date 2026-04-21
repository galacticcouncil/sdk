import { Asset } from '../asset';
import { AnyChain, ChainEcosystem } from '../chain';

import { TransferConfigs } from './types';

import { ConfigService } from './ConfigService';

export function ConfigBuilder(service: ConfigService) {
  const config = service;
  return {
    assets: (ecosystem?: ChainEcosystem) => {
      const assets = config.getEcosystemAssets(ecosystem);

      return {
        assets,
        asset: (keyOrAsset: string | Asset) => {
          const asset = config.getAsset(keyOrAsset);
          const sourceChains = config.getSourceChains(asset, ecosystem);

          return {
            sourceChains,
            source: (keyOrChain: string | AnyChain) => {
              const source = config.getChain(keyOrChain);
              const destinationChains = config.getDestinationChains(
                asset,
                source
              );

              return {
                destinationChains,
                destination: (keyOrChain: string | AnyChain) => {
                  const destination = config.getChain(keyOrChain);
                  const routes = config.getAssetRoutes(
                    asset,
                    source,
                    destination
                  );

                  const destinationAssets = [
                    ...new Map(
                      routes.map((r) => [
                        r.destination.asset.key,
                        r.destination.asset,
                      ])
                    ).values(),
                  ];

                  const isAssetSelect = destinationAssets.length > 1;
                  const isTagSelect =
                    destinationAssets.length === 1 && routes.length > 1;

                  return {
                    routes,
                    destinationAssets,
                    isAssetSelect,
                    isTagSelect,
                    build: (
                      assetOnDest?: string | Asset,
                      tag?: string
                    ): TransferConfigs => {
                      // Narrow routes by tag (bridge selection)
                      const candidates = tag
                        ? routes.filter((r) => r.tags?.includes(tag))
                        : routes;

                      // Prefer route where dest asset matches source asset (e.g. eth→eth over eth→weth_mwh)
                      const sameAssetRoute = candidates.find(
                        (r) =>
                          r.destination.asset.originSymbol ===
                          r.source.asset.originSymbol
                      );

                      const defaultRoute = sameAssetRoute || candidates[0];

                      // Use explicit dest asset if provided, otherwise use default route dest asset
                      const assetToReceive = assetOnDest
                        ? config.getAsset(assetOnDest)
                        : defaultRoute.destination.asset;

                      // Find reverse route (dest→source) for the received asset
                      const reverseRoutes = config.getAssetRoutes(
                        assetToReceive,
                        destination,
                        source
                      );

                      // Prefer reverse route with same tag, fallback to first available
                      const taggedReverse = tag
                        ? reverseRoutes.filter((r) => r.tags?.includes(tag))
                        : [];

                      const reverse = taggedReverse[0] ?? reverseRoutes[0];

                      // Find forward route matching the dest asset
                      const origin = candidates.find(
                        (r) => r.destination.asset === assetToReceive
                      );

                      return {
                        origin: {
                          chain: source,
                          route: origin!,
                        },
                        reverse: {
                          chain: destination,
                          route: reverse,
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}
