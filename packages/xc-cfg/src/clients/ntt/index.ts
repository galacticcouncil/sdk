import {
  AnyChain,
  AnyEvmChain,
  Asset,
  SolanaChain,
  SuiChain,
} from '@galacticcouncil/xc-core';

import { NttEvmClient } from './NttEvmClient';
import { NttSolanaClient } from './NttSolanaClient';
import { NttSuiClient } from './NttSuiClient';
import { NttClient } from './types';

export * from './types';
export { NttEvmClient, NttSolanaClient, NttSuiClient };

/**
 * Ntt deployment on a chain, for an asset.
 *
 * Keyed on the chain the question is about, not the direction of travel:
 * hydration -> sui asks sui for both the inbound limit and the redeem budget,
 * and it is sui's answer that binds.
 *
 * @param asset - omit only when the budget is wanted and the destination asset
 * is not resolved yet; the rate limits need it.
 */
export function nttClient(chain: AnyChain, asset?: Asset): NttClient {
  if (chain instanceof SolanaChain) {
    return new NttSolanaClient(chain, asset);
  }
  if (chain instanceof SuiChain) {
    return new NttSuiClient(chain, asset);
  }
  return new NttEvmClient(chain as AnyEvmChain, asset);
}
