import { NearClient } from '@galacticcouncil/xc-core';
import type { Asset, SdkCtx } from '@galacticcouncil/sdk-next';
import type { EvmCall } from '@galacticcouncil/xc-sdk';

import type { Hex } from 'viem';

import {
  DEFAULT_DISPATCHER,
  DEFAULT_MPC_SIGNER,
  DEFAULT_NEAR_RPC,
  DEFAULT_QUOTER_URL,
  DEFAULT_RELAY_MARGIN_BPS,
  DEFAULT_ROUTER,
  DEFAULT_SCAN_URL,
  DESTINATION_ASSETS,
  DESTINATION_DECIMALS,
  PAYOUT_FEES,
} from './consts';
import { IntentDispatcher } from './dispatcher';
import { configureOneClick } from './quote';
import { IntentRouter } from './router';
import { fetchTrade, type ScanTrade } from './scan';
import { RecipientKind, type Terms } from './terms/types';
import { closeCalls, swap, twap, type TradeContext } from './trade';
import type {
  Destination,
  SwapParams,
  TwapParams,
  XcIntentsOpts,
  XcIntentsTrade,
} from './types';

/**
 * Intents v2 client: swap or TWAP a Hydration asset into ZEC, BTC or NEAR.
 *
 * - `swap` / `twap` estimate against live state, reporting viability in `errors`
 * - `buildCall` on the estimate fixes the terms and builds what the owner signs
 * - Nothing is submitted here
 */
export class XcIntentsClient {
  private readonly sdk: SdkCtx;
  private readonly dispatcher: IntentDispatcher;
  private readonly router: IntentRouter;
  private readonly opts: XcIntentsOpts;

  private assets?: Promise<Map<number, Asset>>;

  constructor(opts: XcIntentsOpts) {
    this.opts = opts;
    this.sdk = opts.sdk;
    this.dispatcher = new IntentDispatcher(
      opts.sdk.client.evm.getProvider(),
      (opts.dispatcher ?? DEFAULT_DISPATCHER) as Hex
    );
    this.router = new IntentRouter(
      opts.near ?? new NearClient(opts.nearRpc ?? DEFAULT_NEAR_RPC),
      opts.router ?? DEFAULT_ROUTER,
      opts.mpcSigner ?? DEFAULT_MPC_SIGNER
    );
    configureOneClick(opts.oneClick);
  }

  /** Destinations the dispatcher prices now, with live route minimums. */
  async destinations(): Promise<Destination[]> {
    const routes = await this.router.utxoRoutes();
    const all = await Promise.all(
      Object.entries(DESTINATION_ASSETS).map(async ([symbol, asset]) => {
        const outPerIn = await this.dispatcher.outPerIn(asset);
        if (!outPerIn) return undefined;
        const route = routes[asset];
        return {
          symbol,
          asset,
          decimals: DESTINATION_DECIMALS[asset],
          outPerIn,
          routeMin: route ? BigInt(route.min_amount) : 0n,
          payoutFee: PAYOUT_FEES[asset],
        } as Destination;
      })
    );
    return all.filter((d): d is Destination => !!d);
  }

  /**
   * Checks the router will pay `recipient`.
   *
   * @param destination - intents ledger id
   * @param recipient - address or NEAR account
   * @param kind - recipient kind; withdrawal unless set
   * @throws when the router would not deliver
   */
  async validateRecipient(
    destination: string,
    recipient: string,
    kind: RecipientKind = RecipientKind.Withdraw
  ): Promise<void> {
    await this.router.checkRecipient(destination, kind, recipient);
  }

  /**
   * Estimates a swap.
   *
   * @param params - what the user asks for
   */
  swap(params: SwapParams): Promise<XcIntentsTrade> {
    return swap(this.context(), params);
  }

  /**
   * Estimates a TWAP.
   *
   * @param params - what the user asks for
   */
  twap(params: TwapParams): Promise<XcIntentsTrade> {
    return twap(this.context(), params);
  }

  /**
   * Close calldata, ending a TWAP early.
   *
   * @param terms - the action's exact terms
   * @param delay - countdown, seconds, at most a day
   */
  closeCalls(terms: Terms, delay?: number): Promise<EvmCall[]> {
    return closeCalls(this.context(), terms, delay);
  }

  /**
   * One trade from scan, or undefined when unknown.
   *
   * @param authPath - terms' path
   */
  trade(authPath: string): Promise<ScanTrade | undefined> {
    return fetchTrade(this.opts.scanUrl ?? DEFAULT_SCAN_URL, authPath);
  }

  private context(): TradeContext {
    return {
      sdk: this.sdk,
      dispatcher: this.dispatcher,
      router: this.router,
      quoterUrl: this.opts.quoterUrl ?? DEFAULT_QUOTER_URL,
      relayMarginBps: this.opts.relayMarginBps ?? DEFAULT_RELAY_MARGIN_BPS,
      getAsset: (id) => this.getAsset(id),
    };
  }

  /**
   * Hydration asset by runtime id, from a memoized registry.
   *
   * - A failed read is not cached, letting the next call retry
   */
  private async getAsset(id: number): Promise<Asset> {
    if (!this.assets) {
      const assets = this.sdk.client.asset
        .getSupported()
        .then((list) => new Map(list.map((a) => [a.id, a])));
      this.assets = assets;
      assets.catch(() => {
        if (this.assets === assets) this.assets = undefined;
      });
    }
    const asset = (await this.assets).get(id);
    if (!asset) throw new Error(`Unsupported asset id: ${id}`);
    return asset;
  }
}
