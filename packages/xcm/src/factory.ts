import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';

import { ConfigService } from '@galacticcouncil/xcm-core';

import {
  Wallet,
  WormholeScan,
  WormholeTransfer,
} from '@galacticcouncil/xcm-sdk';

export type XcmCtx = {
  config: ConfigService;
  wallet: Wallet;
  wormhole: {
    scan: WormholeScan;
    transfer: WormholeTransfer;
  };
};

export function createXcmContext(parachain: number): XcmCtx {
  // Initialize config
  const config = new HydrationConfigService({
    assets: assetsMap,
    chains: chainsMap,
    routes: routesMap,
  });

  // Initialize wallet
  const wallet = new Wallet({
    configService: config,
    transferValidations: validations,
  });

  // Initialize clients
  const whScan = new WormholeScan();
  const whTransfer = new WormholeTransfer(config, parachain);

  return {
    config: config,
    wallet: wallet,
    wormhole: {
      scan: whScan,
      transfer: whTransfer,
    },
  } as XcmCtx;
}
