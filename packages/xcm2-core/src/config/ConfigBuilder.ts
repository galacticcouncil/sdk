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

                  return {
                    routes,
                    build: (assetOnDest?: string | Asset): TransferConfigs => {
                      const sameAssetRoute = routes.find(
                        (r) =>
                          r.destination.asset.originSymbol ===
                          r.source.asset.originSymbol
                      );

                      const defaultRoute = sameAssetRoute || routes[0];

                      const assetToReceive = assetOnDest
                        ? config.getAsset(assetOnDest)
                        : defaultRoute.destination.asset;

                      const [reverse] = config.getAssetRoutes(
                        assetToReceive,
                        destination,
                        source
                      );

                      const origin = routes.find(
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
