import type { Hex } from 'viem';

import { ETHEREUM_WORMHOLE_ID } from '../consts';
import { authPathOf, encodeTerms } from '../terms/codec';
import type { Terms } from '../terms/types';

import { DISPATCHER_ABI, ORDER_COST_ABI } from './abi';
import type { EncodedTerms, EvmReader, OrderBase } from './types';

/** Reads of the intents v2 dispatcher on Hydration EVM. */
export class IntentDispatcher {
  constructor(
    readonly client: EvmReader,
    readonly address: Hex
  ) {}

  private read<T>(functionName: string, args?: readonly unknown[]) {
    return this.client.readContract({
      address: this.address,
      abi: DISPATCHER_ABI,
      functionName,
      args,
    } as any) as Promise<T>;
  }

  /**
   * Encodes terms locally and on the dispatcher, and checks they agree.
   *
   * - `computeTerms` must equal the local packing
   * - `computeAuthPath` must equal `keccak256` of it
   *
   * @param terms - terms to encode
   * @throws when any of the three disagree
   */
  async encode(terms: Terms): Promise<EncodedTerms> {
    const encoded = encodeTerms(terms);
    const authPath = authPathOf(encoded);
    const [remote, remotePath] = await Promise.all([
      this.read<Hex>('computeTerms', [terms]),
      this.read<Hex>('computeAuthPath', [terms]),
    ]);
    if (remote.toLowerCase() !== encoded) {
      throw new Error('Dispatcher computeTerms disagrees with the SDK');
    }
    if (remotePath.toLowerCase() !== authPath) {
      throw new Error('Dispatcher computeAuthPath disagrees with the SDK');
    }
    return { encoded, authPath };
  }

  /**
   * Live rate for a destination, or undefined when unpriced.
   *
   * - Reverts on a missing route or a stale feed, read here as unpriced
   *
   * @param destinationAsset - intents ledger id
   */
  async outPerIn(destinationAsset: string): Promise<bigint | undefined> {
    try {
      const rate = await this.read<bigint>('outPerIn', [destinationAsset]);
      return rate > 0n ? rate : undefined;
    } catch {
      return undefined;
    }
  }

  /** Order cost (rail delivery + Wormhole fee) and least order, live. */
  async orderBase(): Promise<OrderBase> {
    const [minOrderAmount, manager, wormhole] = await Promise.all([
      this.read<bigint>('minOrderAmount'),
      this.read<Hex>('nttManager'),
      this.read<Hex>('wormhole'),
    ]);
    const [[, deliveryPrice], fee] = await Promise.all([
      this.client.readContract({
        address: manager,
        abi: ORDER_COST_ABI,
        functionName: 'quoteDeliveryPrice',
        args: [ETHEREUM_WORMHOLE_ID, '0x00'],
      }) as Promise<readonly [readonly bigint[], bigint]>,
      this.messageFee(wormhole),
    ]);
    return { cost: deliveryPrice + fee, minOrderAmount };
  }

  /**
   * Wormhole core message fee — the `close` call's value.
   *
   * @param wormhole - core contract; read from the dispatcher when omitted
   */
  async messageFee(wormhole?: Hex): Promise<bigint> {
    const core = wormhole ?? (await this.read<Hex>('wormhole'));
    return this.client.readContract({
      address: core,
      abi: ORDER_COST_ABI,
      functionName: 'messageFee',
    }) as Promise<bigint>;
  }

  /**
   * Whether terms are closed.
   *
   * @param authPath - terms' path
   */
  closed(authPath: Hex): Promise<boolean> {
    return this.read<boolean>('closed', [authPath]);
  }
}
