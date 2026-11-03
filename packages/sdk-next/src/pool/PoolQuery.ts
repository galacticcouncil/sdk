import { PolkadotClient } from 'polkadot-api';

import { HydrationQueries } from '@galacticcouncil/descriptors';

import { Papi } from '../api';
import { BalanceClient } from '../client';
import { SYSTEM_ASSET_ID } from '../consts';
import { EvmClient } from '../evm';
import { Balance } from '../types';
import { QueryCache, QueryTally } from '../utils';
import { batchValues } from '../utils/async';

export type TAssetDetails = HydrationQueries['AssetRegistry']['Assets']['Value'];
export type TAssetLocation =
  HydrationQueries['AssetRegistry']['AssetLocations']['Value'];

/**
 * One pool type's chain read surface.
 *
 * - Every read goes through {@link QueryCache}: coalesced, deadline-guarded and
 *   invalidated by its own policy
 * - Nothing is pinned by the instance; each read names the block it reads at
 * - Reads shared by all pool types live here; each type declares its own
 */
export abstract class PoolQuery extends Papi {
  protected readonly cache = new QueryCache();

  protected readonly balance: BalanceClient;
  protected readonly evm: EvmClient;

  constructor(client: PolkadotClient, evm: EvmClient) {
    super(client);
    this.evm = evm;
    this.balance = new BalanceClient(client);
  }

  /** Reads served per tier; what the chain was actually asked for */
  get tally(): Readonly<QueryTally> {
    return this.cache.tally;
  }

  /** Drop every cached and live value; the next read re-derives */
  clear(): void {
    this.cache.clear();
  }

  /** One asset's registry entry (decimals, existential deposit, type) */
  readonly asset = this.cache.scope<[number], TAssetDetails | undefined>(
    'AssetRegistry.Assets',
    (at, id) => this.api.query.AssetRegistry.Assets.getValue(id, { at }),
    (id) => String(id),
    'persistent'
  );

  /**
   * Every asset's entry, keyed by id.
   *
   * - One storage operation instead of one per asset; for a loader that wants a
   *   whole set this replaces the fan-out a seed used to do
   */
  readonly assets = this.cache.scope<[], Map<number, TAssetDetails>>(
    'AssetRegistry.Assets.entries',
    async (at) =>
      new Map(
        (await this.api.query.AssetRegistry.Assets.getEntries({ at })).map(
          ({ keyArgs, value }) => [keyArgs[0], value]
        )
      ),
    () => 'entries',
    'persistent'
  );

  /** One asset's location (erc20 assets carry their H160 here) */
  readonly assetLocation = this.cache.scope<
    [number],
    TAssetLocation | undefined
  >(
    'AssetRegistry.AssetLocations',
    (at, id) =>
      this.api.query.AssetRegistry.AssetLocations.getValue(id, { at }),
    (id) => String(id),
    'persistent'
  );

  /** Every asset's location, keyed by id; same reasoning as {@link assets} */
  readonly assetLocations = this.cache.scope<[], Map<number, TAssetLocation>>(
    'AssetRegistry.AssetLocations.entries',
    async (at) =>
      new Map(
        (
          await this.api.query.AssetRegistry.AssetLocations.getEntries({ at })
        ).map(({ keyArgs, value }) => [keyArgs[0], value])
      ),
    () => 'entries',
    'persistent'
  );

  private systemAccounts = batchValues((keys: [string][], options) =>
    this.api.query.System.Account.getValues(keys, options)
  );

  private tokenAccounts = batchValues((keys: [string, number][], options) =>
    this.api.query.Tokens.Accounts.getValues(keys, options)
  );

  /** An account's balance of one asset, storage reads batched per block */
  readonly assetBalance = this.cache.scope<[string, number], Balance>(
    'CurrenciesApi.account',
    (at, address, assetId) => this.readBalance(at, address, assetId),
    (address, assetId) => `${address}:${assetId}`,
    'block'
  );

  /**
   * One balance, equal to `getBalanceAt`.
   *
   * - Native: `System.Account`, coalesced with the tick's other reads
   * - Registered non-erc20 asset: `Tokens.Accounts`, coalesced the same way
   * - Erc20 or unregistered asset: one `CurrenciesApi.account` runtime call
   *
   * @param at - block to read at
   * @param address - account holding the balance
   * @param assetId - asset to read
   */
  private async readBalance(
    at: string,
    address: string,
    assetId: number
  ): Promise<Balance> {
    if (assetId === SYSTEM_ASSET_ID) {
      const { data } = await this.systemAccounts(at, address);
      return this.balance.getBreakdown(data);
    }

    const assets = await this.assets.get(at);
    const type = assets.get(assetId)?.asset_type.type;
    if (type === undefined || type === 'Erc20') {
      return this.balance.getBalanceAt(address, assetId, at);
    }

    const data = await this.tokenAccounts(at, address, assetId);
    return this.balance.getBreakdown(data);
  }
}
