import { NttDef } from '@galacticcouncil/xc-core';

/**
 * NTT (Native Token Transfers) token registry.
 *
 * Per chain, keyed by asset key. Filled in as per-token NttManager
 * deployments land. Entry example:
 *
 * export const ethereumNtt: NttDef = {
 *   usdc: {
 *     token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *     manager: '0x...',
 *     transceiver: {
 *       wormhole: '0x...',
 *     },
 *   },
 * };
 */
export const ethereumNtt: NttDef = {};

export const hydrationNtt: NttDef = {};
