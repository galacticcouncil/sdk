import { Asset } from '../asset';
import { AnyChain } from '../chain';

/**
 * NTT (Native Token Transfers) per-token deployment on a chain.
 *
 * Each NTT token has its own manager & transceiver contracts. Tokens
 * are declared per chain via the chain `ntt` definition, keyed by
 * asset key.
 */
export type NttTokenDef = {
  /** Token contract (or precompile) address on the chain */
  token: string;
  /** NttManager contract address */
  manager: string;
  /** Transceiver contract addresses */
  transceiver: {
    wormhole: string;
  };
};

export type NttDef = Record<string, NttTokenDef>;

export class Ntt {
  static fromChain(chain: AnyChain, asset: Asset): NttTokenDef {
    if ('ntt' in chain && !!chain['ntt']) {
      const def = (chain.ntt as NttDef)[asset.key];
      if (def) {
        return def;
      }
    }
    throw new Error(
      asset.key + ' is not supported in NTT on ' + chain.name + '.'
    );
  }

  static isKnown(chain: AnyChain, asset: Asset): boolean {
    return (
      'ntt' in chain && !!chain['ntt'] && !!(chain.ntt as NttDef)[asset.key]
    );
  }
}
