import type { Abi as TAbi } from 'viem';

import { BATCH } from './Batch';
import { ERC20 } from './Erc20';
import { EXECUTOR } from './Executor';
import { BASEJUMP } from './Basejump';
import { HOLLAR_BASE_FACILITATOR } from './HollarBaseFacilitator';
import { HOLLAR_BASE_VAULT } from './HollarBaseVault';
import { META } from './Meta';
import { NTT_MANAGER } from './NttManager';
import { NTT_MANAGER_WITH_EXECUTOR } from './NttManagerWithExecutor';
import { POLKADOT_XCM } from './PolkadotXcm';
import { SNOWBRIDGE } from './Snowbridge';
import { UTXO_EMITTER } from './UtxoEmitter';
import { WETH } from './Weth';
import { WORMHOLE_TRANSCEIVER } from './WormholeTransceiver';

export const Abi: Record<string, TAbi> = {
  Batch: BATCH,
  Erc20: ERC20,
  Executor: EXECUTOR,
  Basejump: BASEJUMP,
  HollarBaseFacilitator: HOLLAR_BASE_FACILITATOR,
  HollarBaseVault: HOLLAR_BASE_VAULT,
  Meta: META,
  NttManager: NTT_MANAGER,
  NttManagerWithExecutor: NTT_MANAGER_WITH_EXECUTOR,
  PolkadotXcm: POLKADOT_XCM,
  Snowbridge: SNOWBRIDGE,
  UtxoEmitter: UTXO_EMITTER,
  Weth: WETH,
  WormholeTransceiver: WORMHOLE_TRANSCEIVER,
};
