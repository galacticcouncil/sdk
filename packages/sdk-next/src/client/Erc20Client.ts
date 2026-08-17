import { PolkadotClient } from 'polkadot-api';

import { Papi } from '../api';

/**
 * TODO - Make part of asset client
 */
export class Erc20Client extends Papi {
  /** Emitting ERC20 contract (lower-cased H160) -> asset id */
  private contracts: Map<string, number> | null = null;
  private ids: number[] | null = null;

  constructor(client: PolkadotClient) {
    super(client, undefined);
  }

  /**
   * Every `Erc20` asset id.
   *
   * - Read once and kept: the set only changes when an asset is registered
   */
  async getIds(): Promise<number[]> {
    if (this.ids) {
      return this.ids;
    }

    const assets = await this.api.query.AssetRegistry.Assets.getEntries({
      at: 'best',
    });
    this.ids = assets
      .filter(({ value }) => value.asset_type.type === 'Erc20')
      .map(({ keyArgs }) => {
        const [id] = keyArgs;
        return id as number;
      });
    return this.ids;
  }

  /**
   * Contract -> asset id for every asset that carries an H160.
   *
   * - An `Erc20` asset is a real deployment, so its address is arbitrary and
   *   only the registry's location relates it to an id
   * - Read once and kept: an asset's contract never moves
   */
  async getContracts(): Promise<Map<string, number>> {
    if (this.contracts) {
      return this.contracts;
    }

    const locations =
      await this.api.query.AssetRegistry.AssetLocations.getEntries({
        at: 'best',
      });

    const byContract = new Map<string, number>();
    for (const { keyArgs, value } of locations) {
      const [id] = keyArgs;
      const { interior } = value;
      if (interior.type === 'X1' && interior.value.type === 'AccountKey20') {
        const { key } = interior.value.value;
        byContract.set(String(key).toLowerCase(), id as number);
      }
    }

    this.contracts = byContract;
    return byContract;
  }
}
