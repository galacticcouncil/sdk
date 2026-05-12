import type { Abi as TAbi } from 'viem';

import { BATCH } from './Batch';
import { ERC20 } from './Erc20';
import { GMP } from './Gmp';
import { BASEJUMP } from './Basejump';
import { META } from './Meta';
import { POLKADOT_XCM } from './PolkadotXcm';
import { SNOWBRIDGE } from './Snowbridge';
import { SNOWBRIDGE_L1_ADAPTOR } from './SnowbridgeL1Adaptor';
import { SNOWBRIDGE_L2_ADAPTOR } from './SnowbridgeL2Adaptor';
import { TOKEN_BRIDGE } from './TokenBridge';
import { TOKEN_RELAYER } from './TokenRelayer';

export const Abi: Record<string, TAbi> = {
  Batch: BATCH,
  Erc20: ERC20,
  Gmp: GMP,
  Basejump: BASEJUMP,
  Meta: META,
  PolkadotXcm: POLKADOT_XCM,
  Snowbridge: SNOWBRIDGE,
  SnowbridgeL1Adaptor: SNOWBRIDGE_L1_ADAPTOR,
  SnowbridgeL2Adaptor: SNOWBRIDGE_L2_ADAPTOR,
  TokenBridge: TOKEN_BRIDGE,
  TokenRelayer: TOKEN_RELAYER,
};
