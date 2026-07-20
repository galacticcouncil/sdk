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
  WormholeGovernor,
  WormholeRateLimitValidation,
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
  const whGovernor = new WormholeGovernor();
  const whTransfer = new WormholeTransfer(config, hydration.parachainId);

  // Initialize wallet
  const wallet = new Wallet({
    configService: config,
    transferValidations: [
      ...validations,
      new WormholeRateLimitValidation(whGovernor, config),
    ],
  });

  // Register dex-es
  registerDexes(config, opts);

  return {
    config: config,
    wallet: wallet,
    wormhole: {
      scan: whScan,
      governor: whGovernor,
      transfer: whTransfer,
    },
  } as XcCtx;
}
