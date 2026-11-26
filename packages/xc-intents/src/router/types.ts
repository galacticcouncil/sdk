import type { NearClient } from '@galacticcouncil/xc-core';

/** NEAR reads the router needs. */
export type NearReader = Pick<NearClient, 'view' | 'viewAccount'>;

/** Router's way out to a coin's own chain: a `utxo_routes()` value. */
export interface UtxoRoute {
  /** Withdraw contract validating and paying the address */
  withdraw: string;
  path_prefix: string;
  /** Address prefixes the withdraw contract takes */
  address_prefixes: string[];
  /** Least the router pays out at once, in the token's base units */
  min_amount: string;
}
