import { Asset } from '../asset';
import { AnyChain, ChainEcosystem } from '../chain';

import { ConfigService } from './ConfigService';
import { AssetRoute } from './definition';

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
                  return {
                    build: (): AssetRoute =>
                      config.getAssetRoute(asset, source, destination),
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
