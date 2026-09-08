import type { evm } from '@galacticcouncil/sdk-next';

import {
  EMITTER_CONFIG_ABI,
  NTT_MANAGER_ABI,
  WORMHOLE_ABI,
} from './abi';
import {
  ETHEREUM_WORMHOLE_ID,
  NO_TRANSCEIVER_INSTRUCTIONS,
} from '../registry/consts';

type Provider = ReturnType<evm.EvmClient['getProvider']>;

/** Contracts the emitter settles through, read from its own config. */
export interface RailConfig {
  nttManager: `0x${string}`;
  wormhole: `0x${string}`;
}

/** Live state of the NTT settlement rail. */
export interface RailState {
  /**
   * What settling costs, charged against the swap output.
   *
   * - NTT delivery price plus the core bridge's message fee
   * - `placeOrder` is not payable, so it comes out of the bridged WETH
   */
  cost: bigint;
  /** Rail paused — `transfer` reverts rather than settling. */
  paused: boolean;
  /**
   * Outbound capacity left in the rate-limit window.
   *
   * - The emitter's `transfer` overload pins `shouldQueue = false`
   * - So an oversized settlement reverts rather than queueing
   */
  capacity: bigint;
}

/**
 * Read the emitter's settlement contracts.
 *
 * - Owner-set, so they are read rather than hardcoded
 * - Survives a re-point via `setNttManager` / `setIntentReceiver`
 *
 * @param provider - Hydration EVM provider
 * @param emitter - `IntentEmitter` proxy address
 */
export async function fetchRailConfig(
  provider: Provider,
  emitter: string
): Promise<RailConfig> {
  const address = emitter as `0x${string}`;
  const [nttManager, wormhole] = await Promise.all([
    provider.readContract({
      abi: EMITTER_CONFIG_ABI,
      address,
      functionName: 'nttManager',
    }),
    provider.readContract({
      abi: EMITTER_CONFIG_ABI,
      address,
      functionName: 'wormhole',
    }),
  ]);
  return { nttManager, wormhole };
}

/**
 * Read the rail's current cost and viability.
 *
 * - Delivery price and message fee are governance parameters
 * - Pause state and capacity move with rail activity
 *
 * @param provider - Hydration EVM provider
 * @param config - contracts resolved by {@link fetchRailConfig}
 */
export async function fetchRailState(
  provider: Provider,
  config: RailConfig
): Promise<RailState> {
  const [delivery, messageFee, paused, capacity] = await Promise.all([
    provider.readContract({
      abi: NTT_MANAGER_ABI,
      address: config.nttManager,
      functionName: 'quoteDeliveryPrice',
      args: [ETHEREUM_WORMHOLE_ID, NO_TRANSCEIVER_INSTRUCTIONS],
    }),
    provider.readContract({
      abi: WORMHOLE_ABI,
      address: config.wormhole,
      functionName: 'messageFee',
    }),
    provider.readContract({
      abi: NTT_MANAGER_ABI,
      address: config.nttManager,
      functionName: 'isPaused',
    }),
    provider.readContract({
      abi: NTT_MANAGER_ABI,
      address: config.nttManager,
      functionName: 'getCurrentOutboundCapacity',
    }),
  ]);

  const [, deliveryPrice] = delivery as readonly [readonly bigint[], bigint];

  return {
    cost: deliveryPrice + (messageFee as bigint),
    paused: paused as boolean,
    capacity: capacity as bigint,
  };
}
