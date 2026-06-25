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

                      // Probe for a reverse route (dest→source) for the
                      // received asset. Absence is allowed — one-way routes
                      // resolve with reversible=false.
                      const reverseRoutes = config.getAssetRoutesOrEmpty(
                        assetToReceive,
                        destination,
                        source
                      );

                      // Find forward route matching the dest asset
                      const origin = candidates.find(
                        (r) => r.destination.asset === assetToReceive
                      );

                      return {
                        origin: {
                          chain: source,
                          route: origin!,
                        },
                        reversible: reverseRoutes.length > 0,
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
