import { PolkadotClient, createClient } from 'polkadot-api';

import {
  QueryTally,
  api,
  client as sdk,
  evm,
  pool,
} from '@galacticcouncil/sdk-next';

type PoolBase = pool.PoolBase;

export type Kind = 'omni' | 'stable' | 'aave' | 'hsm' | 'xyk';

/** `log` is how the client tags itself in the log stream */
export const KINDS: { kind: Kind; label: string; log: string }[] = [
  { kind: 'omni', label: 'Omnipool', log: 'OMNI' },
  { kind: 'stable', label: 'Stableswap', log: 'STBL' },
  { kind: 'aave', label: 'Aave', log: 'AAVE' },
  { kind: 'hsm', label: 'HSM', log: 'HSM' },
  { kind: 'xyk', label: 'XYK', log: 'XYK' },
];

/**
 * One commit, as the consumer API delivers it.
 *
 * - `changed` is the changeset the subscription emits
 * - `pools` is the full committed store behind it
 */
export interface Commit {
  kind: Kind;
  block: number;
  changed: PoolBase[];
  pools: readonly PoolBase[];
}

/**
 * The block a client last committed.
 *
 * - Not on the consumer API; the probes expose it the same way
 */
interface Cursor {
  blockNo(): number;
  tally(): Readonly<QueryTally>;
  pools: readonly PoolBase[];
  getSubscriber(): { subscribe(next: (pools: any[]) => void): Sub };
}

interface Sub {
  unsubscribe(): void;
}

class Omni extends pool.omni.OmniPoolClient {
  blockNo() {
    return this.block;
  }
  tally() {
    return this.query.tally;
  }
}
class Stable extends pool.stable.StableSwapClient {
  blockNo() {
    return this.block;
  }
  tally() {
    return this.query.tally;
  }
}
class Aave extends pool.aave.AavePoolClient {
  blockNo() {
    return this.block;
  }
  tally() {
    return this.query.tally;
  }
}
class Hsm extends pool.hsm.HsmPoolClient {
  blockNo() {
    return this.block;
  }
  tally() {
    return this.query.tally;
  }
}
class Xyk extends pool.xyk.XykPoolClient {
  blockNo() {
    return this.block;
  }
  tally() {
    return this.query.tally;
  }
}
/**
 * Drives the pool clients behind the page.
 *
 * - One client per type, created on demand and kept for the session
 * - HSM shares the stableswap client it derives from, as a consumer would
 */
export class PoolsEngine {
  private client?: PolkadotClient;
  private evmClient?: evm.EvmClient;

  private clients = new Map<Kind, Cursor>();
  private subs = new Map<Kind, Sub>();

  /** Asset id → symbol, so the table reads in tickers rather than ids */
  readonly symbols = new Map<number, string>();

  /** Asset id → decimals, for amounts on fields no pool token carries */
  readonly decimals = new Map<number, number>();

  constructor(private readonly onCommit: (commit: Commit) => void) {}

  get connected(): boolean {
    return this.client !== undefined;
  }

  connect(endpoint: string) {
    this.disconnect();
    this.client = createClient(api.getWs(endpoint));
    this.evmClient = new evm.EvmClient(this.client);
    this.loadSymbols();
  }

  /** Best effort; the table falls back to ids until this resolves */
  private async loadSymbols() {
    const assets = await new sdk.AssetClient(this.client!).getSupported();
    for (const asset of assets) {
      const id = Number(asset.id);
      if (asset.symbol) this.symbols.set(id, asset.symbol);
      if (asset.decimals !== undefined) this.decimals.set(id, asset.decimals);
    }
  }

  disconnect() {
    for (const kind of [...this.subs.keys()]) this.disable(kind);
    this.clients.clear();
    this.client?.destroy();
    this.client = undefined;
    this.evmClient = undefined;
  }

  enabled(kind: Kind): boolean {
    return this.subs.has(kind);
  }

  /**
   * Reads served per tier across the subscribed clients.
   *
   * - `fetch` and `unpinned` are what the chain was asked for; the rest was
   *   served by the block cache or by an event-written value
   */
  tally(): QueryTally {
    const total: QueryTally = { live: 0, memo: 0, fetch: 0, unpinned: 0 };

    for (const [kind, client] of this.clients) {
      if (!this.subs.has(kind)) continue;

      const one = client.tally();
      total.live += one.live;
      total.memo += one.memo;
      total.fetch += one.fetch;
      total.unpinned += one.unpinned;
    }

    return total;
  }

  enable(kind: Kind) {
    if (!this.client || this.subs.has(kind)) return;

    const client = this.clientOf(kind);
    const sub = client.getSubscriber().subscribe((changed: PoolBase[]) => {
      this.onCommit({
        kind,
        block: client.blockNo(),
        changed,
        pools: client.pools,
      });
    });

    this.subs.set(kind, sub);
  }

  disable(kind: Kind) {
    this.subs.get(kind)?.unsubscribe();
    this.subs.delete(kind);
  }

  private clientOf(kind: Kind): Cursor {
    const existing = this.clients.get(kind);
    if (existing) return existing;

    const client = this.client!;
    const evmClient = this.evmClient!;

    const created =
      kind === 'omni'
        ? new Omni(client, evmClient)
        : kind === 'stable'
          ? new Stable(client, evmClient)
          : kind === 'aave'
            ? new Aave(client, evmClient)
            : kind === 'xyk'
              ? new Xyk(client, evmClient)
              : new Hsm(client, evmClient, this.stable());

    this.clients.set(kind, created as Cursor);
    return created as Cursor;
  }

  /** HSM derives from stableswap, whether or not that type is displayed */
  private stable(): Stable {
    const existing = this.clients.get('stable');
    if (existing) return existing as Stable;

    const created = new Stable(this.client!, this.evmClient!);
    this.clients.set('stable', created as Cursor);
    return created;
  }
}
