import {
  deserializeLayout,
  encoding,
  serializeLayout,
} from '@wormhole-foundation/sdk-base';
import {
  relayInstructionsLayout,
  signedQuoteLayout,
} from '@wormhole-foundation/sdk-definitions';

import { EXECUTOR_API } from '../../bridges/wormhole';

/**
 * What the Executor is asked to reserve to deliver on a destination.
 *
 * `gasLimit` budgets execution, `msgValue` budgets what the executor must
 * hold. Both are destination units - evm gas, svm compute units, sui MIST -
 * so neither has a value that is meaningful across chains.
 */
export interface ExecutorBudget {
  gasLimit: bigint;
  msgValue: bigint;
}

export type ExecutorQuote = {
  /** Quoter-signed cost attestation, passed through to the shim. */
  signedQuote: `0x${string}`;
  /** What the Executor charges for delivery, in source chain native. */
  estimatedCost: bigint;
  /** Serialized delivery request the quote was priced for. */
  relayInstructions: `0x${string}`;
};

/** Reuse a quote only while this much of its life is left. */
const QUOTE_SAFETY_MS = 5 * 60 * 1000;

/**
 * Unix ms a signed quote stops being accepted, or 0 when it cannot be read -
 * an unparseable quote is treated as expired, so it is refetched rather than
 * reused on a guess.
 */
const expiryOf = (signedQuote: string): number => {
  try {
    const { quote } = deserializeLayout(
      signedQuoteLayout,
      encoding.hex.decode(signedQuote)
    );
    return quote.expiryTime.getTime();
  } catch {
    return 0;
  }
};

/**
 * Off-chain Executor quoting service.
 *
 * A signed quote carries its own expiry (an hour, currently) and the executor
 * rejects a stale one, so quotes are reused only while comfortably live.
 */
export class ExecutorClient {
  /** Live quotes, keyed by what they were priced for. */
  private readonly quotes = new Map<string, ExecutorQuote>();

  /**
   * Price the delivery of one NTT transfer.
   *
   * @param srcWormholeId - source chain wormhole id
   * @param dstWormholeId - destination chain wormhole id
   * @param budget - what the executor must reserve on the destination, from
   * {@link ExecutorBudget}. Both halves are keyed here: a quote is only
   * honoured for the instructions it priced.
   */
  async quote(
    srcWormholeId: number,
    dstWormholeId: number,
    budget: ExecutorBudget
  ): Promise<ExecutorQuote> {
    const { gasLimit, msgValue } = budget;

    const key = [srcWormholeId, dstWormholeId, gasLimit, msgValue].join(':');
    const live = this.quotes.get(key);
    if (live && expiryOf(live.signedQuote) - Date.now() > QUOTE_SAFETY_MS) {
      return live;
    }

    const relayInstructions = encoding.hex.encode(
      serializeLayout(relayInstructionsLayout, {
        requests: [
          {
            request: {
              type: 'GasInstruction',
              gasLimit: gasLimit,
              msgValue: msgValue,
            },
          },
        ],
      }),
      true
    ) as `0x${string}`;

    const response = await fetch(EXECUTOR_API + '/v0/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        srcChain: srcWormholeId,
        dstChain: dstWormholeId,
        relayInstructions,
      }),
    });

    if (!response.ok) {
      throw new Error(
        'Executor quote failed [' + srcWormholeId + '->' + dstWormholeId + ']'
      );
    }

    const { signedQuote, estimatedCost } = await response.json();

    if (!signedQuote || !estimatedCost) {
      throw new Error('Executor quote incomplete');
    }

    const quote: ExecutorQuote = {
      signedQuote,
      estimatedCost: BigInt(estimatedCost),
      relayInstructions,
    };

    this.quotes.set(key, quote);
    return quote;
  }
}

/**
 * Shared instance - always quote through this, never a fresh client.
 *
 * The route's fee builder quotes to size the funding and the contract builder
 * quotes to spend it, and those two numbers have to be the same one. Quoting
 * twice lets the destination gas price move in between - observed drift was
 * 807e9 wei against a 9e9 margin - and the transfer then reverts underfunded.
 * Separate instances would each hold their own cache and reintroduce exactly
 * that.
 */
export const executorClient = new ExecutorClient();
