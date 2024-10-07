import { Asset } from '../asset';
import { AnyChain, ChainEcosystem } from '../chain';

import { TransferConfig } from './types';

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
                  const origin = config.getAssetRoute(
                    asset,
                    source,
                    destination
                  );
                  const reverse = config.getAssetRoute(
                    origin.destination.asset,
                    destination,
                    source
                  );

                  return {
                    build: (): TransferConfig => ({
                      origin,
                      reverse,
                    }),
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
