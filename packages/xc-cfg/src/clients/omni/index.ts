import { AnyChain, NearChain } from '@galacticcouncil/xc-core';

import { OmniClient } from './OmniClient';

export * from './OmniClient';

const clients = new Map<string, OmniClient>();

/**
 * Omni connector of a UTXO chain.
 *
 * - One client per chain, so an order's address is registered once
 *
 * @param source - UTXO chain deposits are paid on
 * @param hub - NEAR chain the connector is read from
 */
export function omniClient(source: AnyChain, hub: NearChain): OmniClient {
  const key = `${source.key}-${hub.key}`;
  let client = clients.get(key);
  if (!client) {
    client = new OmniClient(source, hub);
    clients.set(key, client);
  }
  return client;
}
