import type { Abi as TAbi } from 'viem';

import { BATCH } from './Batch';
import { ERC20 } from './Erc20';
import { BASEJUMP } from './Basejump';
import { META } from './Meta';
import { NTT_MANAGER } from './NttManager';
import { POLKADOT_XCM } from './PolkadotXcm';
import { SNOWBRIDGE } from './Snowbridge';
import { WORMHOLE_TRANSCEIVER } from './WormholeTransceiver';

export const Abi: Record<string, TAbi> = {
  Batch: BATCH,
  Erc20: ERC20,
  Basejump: BASEJUMP,
  Meta: META,
  NttManager: NTT_MANAGER,
  PolkadotXcm: POLKADOT_XCM,
  Snowbridge: SNOWBRIDGE,
  WormholeTransceiver: WORMHOLE_TRANSCEIVER,
};
