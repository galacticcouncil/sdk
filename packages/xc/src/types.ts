import type { ConfigService } from '@galacticcouncil/xc-core';
import type {
  Wallet,
  WormholeGovernor,
  WormholeScan,
  WormholeTransfer,
} from '@galacticcouncil/xc-sdk';

import type { pool } from '@galacticcouncil/sdk-next';

export type XcCtx = {
  config: ConfigService;
  wallet: Wallet;
  wormhole: {
    scan: WormholeScan;
    governor: WormholeGovernor;
    transfer: WormholeTransfer;
  };
};

export type XcOpts = {
  poolCtx?: pool.PoolContextProvider;
};
