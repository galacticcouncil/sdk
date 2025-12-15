import type { Abi as TAbi } from 'viem';

import { BATCH } from './Batch';
import { ERC20 } from './Erc20';
import { GMP } from './Gmp';
import { META } from './Meta';
import { HYPERBRIDGE } from './Hyperbridge';
import { HYPERBRIDGE_ISMP_HOST } from './HyperbridgeIsmpHost';
import { SNOWBRIDGE } from './Snowbridge';
import { TOKEN_BRIDGE } from './TokenBridge';
import { TOKEN_RELAYER } from './TokenRelayer';
import { XTOKENS } from './Xtokens';
import { UNISWAP_V2_ROUTER } from './UniswapV2Router';

export const Abi: Record<string, TAbi> = {
  Batch: BATCH,
  Erc20: ERC20,
  Gmp: GMP,
  Meta: META,
  Hyperbridge: HYPERBRIDGE,
  HyperbridgeIsmpHost: HYPERBRIDGE_ISMP_HOST,
  Snowbridge: SNOWBRIDGE,
  TokenBridge: TOKEN_BRIDGE,
  TokenRelayer: TOKEN_RELAYER,
  Xtokens: XTOKENS,
  UniswapV2Router: UNISWAP_V2_ROUTER,
};
