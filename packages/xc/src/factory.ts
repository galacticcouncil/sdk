import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xc-cfg';

import { Parachain } from '@galacticcouncil/xc-core';

import {
  Wallet,
  WormholeScan,
  WormholeTransfer,
} from '@galacticcouncil/xc-sdk';

import { registerDexes } from './dex';
import { XcCtx, XcOpts } from './types';

export async function createXcContext(opts: XcOpts = {}): Promise<XcCtx> {
  // Initialize config
  const config = new HydrationConfigService({
    assets: assetsMap,
    chains: chainsMap,
    routes: routesMap,
  });

  // Get chain ctx
  const hydration = config.getChain('hydration') as Parachain;

  // Initialize clients
  const whScan = new WormholeScan();
  const whTransfer = new WormholeTransfer(config, hydration.parachainId);

  // Initialize wallet
  const wallet = new Wallet({
    configService: config,
    transferValidations: validations,
  });

  // Register dex-es
  registerDexes(config, opts);

  return {
    config: config,
    wallet: wallet,
    wormhole: {
      scan: whScan,
      transfer: whTransfer,
    },
  } as XcCtx;
}
