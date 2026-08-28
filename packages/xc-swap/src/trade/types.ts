import type { evm, sor } from '@galacticcouncil/sdk-next';

import type { RailState } from './rail';
import type { XcSwapAsset } from '../types';

/** Resolved configuration the swap orchestration needs (defaults applied). */
export interface SwapContext {
  router: sor.TradeRouter;
  /** EVM client (sdk-next) used to read the emitter allowance over A. */
  evm: evm.EvmClient;
  /** Resolve a Hydration asset id to its descriptor (symbol/decimals/address). */
  resolveAsset: (id: number) => Promise<XcSwapAsset>;
  /** Resolve a destination 1Click asset id to its descriptor (from the registry). */
  resolveDestination: (oneClickId: string) => Promise<XcSwapAsset>;
  emitter: string;
  quoterUrl: string;
  /** Relay-fee margin, percent. */
  relayMarginPct: number;
  /** Default slippage tolerance, percent (1 = 1%). */
  slippagePct: number;
  /** Live NTT rail state — cost and viability. Cached by the client. */
  rail: () => Promise<RailState>;
}

/** Inputs to {@link buildCalls}. */
export interface BuildCallsParams {
  /** `from` of both calls — the Hydration EVM account initiating the swap. */
  from: string;
  /** ERC-20 precompile address of asset A on Hydration EVM. */
  assetInAddress: `0x${string}`;
  /** `IntentEmitter` proxy address. */
  emitter: string;
  /** Hydration runtime asset id of A. */
  assetIn: number;
  /** Amount of A to swap (smallest unit). */
  amountIn: bigint;
  /** Slippage floor on the settled WETH, net of the rail's cost. */
  minEthOut: bigint;
  /** Ethereum deposit address the bridged ETH lands at. */
  depositAddress: string;
  /** Relay fee ceiling carried in the forwarding instruction. */
  maxRelayFee: bigint;
  /**
   * Whether the emitter already has sufficient allowance over A. When `true`
   * the `approve` call is omitted and only `placeOrder` is returned.
   */
  approved: boolean;
}
