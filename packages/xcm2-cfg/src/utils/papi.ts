import { PolkadotClient, TypedApi } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

/**
 * Helper to get TypedApi from PolkadotClient using Hydration descriptor
 *
 * This uses the Hydration descriptor which works for Hydration and compatible chains.
 * The descriptor provides full type safety for queries, transactions, and runtime APIs.
 *
 * @param client - PolkadotClient instance
 * @returns TypedApi with Hydration types
 */
export function getTypedApi(client: PolkadotClient): TypedApi<typeof hydration> {
  return client.getTypedApi(hydration);
}

/**
 * Type alias for Hydration TypedApi
 * Use this when you need to type function parameters or return values
 */
export type HydrationApi = TypedApi<typeof hydration>;
