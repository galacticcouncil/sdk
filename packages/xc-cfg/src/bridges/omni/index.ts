import {
  AnyChain,
  OmniClient,
  OmniUtxoChain,
  ZecChain,
} from '@galacticcouncil/xc-core';

/** Omni's name of a source chain, by chain key. */
export const OMNI_UTXO_CHAINS: Record<string, OmniUtxoChain> = {
  zec: 'zcash',
};

/** Omni client registered on the chain; throws without one. */
export function getOmniClient(chain: AnyChain): OmniClient {
  const client = (chain as ZecChain).omniClient;
  if (client) {
    return client;
  }
  throw new Error('No Omni client registered on ' + chain.name);
}
