import { Wormhole } from './wormhole';

import { Asset } from '../asset';
import { AnyChain } from '../chain';

/**
 * NTT (Native Token Transfers) per-token deployment on a chain.
 *
 * Each NTT token has its own manager & transceiver contracts. Tokens
 * are declared per chain via the wormhole `ntt` definition, keyed by
 * asset key.
 */
export type NttTokenDef = {
  /** Token address: erc20 contract, spl mint or sui coin type */
  token: string;
  /** NttManager: contract address, program id or sui state object id */
  manager: string;
  /** Transceiver addresses, keyed by transceiver kind */
  transceiver: {
    /** Contract address, program id or sui state object id */
    wormhole: string;
  };
  /** VAA emitter, when different from the transceiver address (Solana pda) */
  emitter?: string;
  /**
   * Sui `0x2::coin::CoinMetadata<T>` object id, taken by every ntt move
   * call. Not discoverable over v1 json-rpc: `getCoinMetadata` returns the
   * newer `0x2::coin_registry::Currency<T>` object, which the manager
   * rejects with a TypeMismatch.
   */
  coinMetadata?: string;
};

export type NttDef = Record<string, NttTokenDef>;

/** Hex addresses match case-insensitive, base58 (Solana) is exact. */
function isSameAddress(a: string, b: string): boolean {
  if (a.startsWith('0x') && b.startsWith('0x')) {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

export class Ntt {
  /** Token deployment on a chain, or undefined when not registered. */
  static find(chain: AnyChain, assetKey: string): NttTokenDef | undefined {
    if (Wormhole.isKnown(chain)) {
      return Wormhole.fromChain(chain).ntt[assetKey];
    }
    return undefined;
  }

  /** Token deployment matching a VAA emitter address, with its asset key. */
  static findByEmitter(
    chain: AnyChain,
    emitter: string
  ): { assetKey: string; def: NttTokenDef } | undefined {
    if (!Wormhole.isKnown(chain)) {
      return undefined;
    }
    const registry = Wormhole.fromChain(chain).ntt;
    const entry = Object.entries(registry).find(([_, def]) =>
      isSameAddress(def.emitter ?? def.transceiver.wormhole, emitter)
    );
    if (entry) {
      const [assetKey, def] = entry;
      return { assetKey, def };
    }
    return undefined;
  }

  static fromChain(chain: AnyChain, asset: Asset): NttTokenDef {
    const def = Ntt.find(chain, asset.key);
    if (def) {
      return def;
    }
    throw new Error(
      asset.key + ' is not supported in NTT on ' + chain.name + '.'
    );
  }

  static isKnown(chain: AnyChain, asset: Asset): boolean {
    return !!Ntt.find(chain, asset.key);
  }
}
