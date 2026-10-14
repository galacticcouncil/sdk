import {
  AnyChain,
  Asset,
  ConfigBuilder,
  TransferConfigs,
} from '@galacticcouncil/xc-core';

import { Wallet } from './Wallet';
import { Transfer } from './types';

export function TransferBuilder(wallet: Wallet) {
  const assets = ConfigBuilder(wallet.config).assets();
  return {
    assets,
    withAsset(asset: string | Asset) {
      const sources = assets.asset(asset);
      return {
        sources,
        withSource(srcChain: string | AnyChain) {
          const destinations = sources.source(srcChain);
          return {
            destinations,
            withDestination(dstChain: string | AnyChain) {
              const {
                routes,
                destinationAssets,
                isAssetSelect,
                isTagSelect,
                build,
              } = destinations.destination(dstChain);

              return {
                routes,
                destinationAssets,
                isAssetSelect,
                isTagSelect,
                build({
                  srcAddress,
                  dstAddress,
                  dstAsset,
                  tag,
                }: {
                  srcAddress: string;
                  dstAddress: string;
                  dstAsset?: string | Asset;
                  tag?: string;
                }): Promise<Transfer> {
                  const configs = build(dstAsset, tag);
                  return wallet.getTransferData(
                    configs,
                    srcAddress,
                    dstAddress
                  );
                },
              };
            },
          };
        },
      };
    },
  };
}
