import { BATCH } from './Batch';
import { GMP } from './Gmp';
import { ERC20 } from './Erc20';
import { META } from './Meta';
import { TOKEN_BRIDGE } from './TokenBridge';
import { TOKEN_RELAYER } from './TokenRelayer';
import { XTOKENS } from './Xtokens';

export const Abi: Record<string, unknown[]> = {
  Batch: BATCH,
  Erc20: ERC20,
  Gmp: GMP,
  Meta: META,
  TokenBridge: TOKEN_BRIDGE,
  TokenRelayer: TOKEN_RELAYER,
  Xtokens: XTOKENS,
};
