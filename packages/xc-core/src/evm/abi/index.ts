import type { Abi as TAbi } from 'viem';

import { BATCH } from './Batch';
import { ERC20 } from './Erc20';
import { EXECUTOR } from './Executor';
import { BASEJUMP } from './Basejump';
import { META } from './Meta';
import { NTT_MANAGER } from './NttManager';
import { NTT_MANAGER_WITH_EXECUTOR } from './NttManagerWithExecutor';
import { POLKADOT_XCM } from './PolkadotXcm';
import { SNOWBRIDGE } from './Snowbridge';
import { WETH } from './Weth';
import { WORMHOLE_TRANSCEIVER } from './WormholeTransceiver';

export const Abi: Record<string, TAbi> = {
  Batch: BATCH,
  Erc20: ERC20,
  Executor: EXECUTOR,
  Basejump: BASEJUMP,
  Meta: META,
  NttManager: NTT_MANAGER,
  NttManagerWithExecutor: NTT_MANAGER_WITH_EXECUTOR,
  PolkadotXcm: POLKADOT_XCM,
  Snowbridge: SNOWBRIDGE,
  Weth: WETH,
  WormholeTransceiver: WORMHOLE_TRANSCEIVER,
};
