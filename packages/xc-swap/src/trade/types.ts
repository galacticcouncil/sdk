import type { evm, sor } from '@galacticcouncil/sdk-next';

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
  xcmFee: bigint;
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
  /** Slippage floor on the bridged WETH. */
  minEthOut: bigint;
  /** Upper bound of A spent buying the GLMR fee. */
  maxFeeIn: bigint;
  /** UI correlation hash carried in the bridge payload. */
  intentId: `0x${string}`;
  /** Ethereum deposit address the bridged ETH lands at. */
  intentDepositAddress: string;
  /** Relay fee ceiling carried in the payload. */
  maxRelayFee: bigint;
  /**
   * Whether the emitter already has sufficient allowance over A. When `true`
   * the `approve` call is omitted and only `swapAndBridge` is returned.
   */
  approved: boolean;
}
