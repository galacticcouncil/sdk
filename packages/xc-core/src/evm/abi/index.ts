import type { Abi as TAbi } from 'viem';

import { BATCH } from './Batch';
import { ERC20 } from './Erc20';
import { GMP } from './Gmp';
import { META } from './Meta';
import { POLKADOT_XCM } from './PolkadotXcm';
import { SNOWBRIDGE } from './Snowbridge';
import { TOKEN_BRIDGE } from './TokenBridge';
import { TOKEN_RELAYER } from './TokenRelayer';
import { XTOKENS } from './Xtokens';

export const Abi: Record<string, TAbi> = {
  Batch: BATCH,
  Erc20: ERC20,
  Gmp: GMP,
  Meta: META,
  PolkadotXcm: POLKADOT_XCM,
  Snowbridge: SNOWBRIDGE,
  TokenBridge: TOKEN_BRIDGE,
  TokenRelayer: TOKEN_RELAYER,
  Xtokens: XTOKENS,
};
