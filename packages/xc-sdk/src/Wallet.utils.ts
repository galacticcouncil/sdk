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
              const { routes, build } = destinations.destination(dstChain);
              return {
                routes,
                build({
                  srcAddress,
                  dstAddress,
                  dstAsset,
                }: {
                  srcAddress: string;
                  dstAddress: string;
                  dstAsset?: string | Asset;
                }): Promise<Transfer> {
                  const configs = build(dstAsset);
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
