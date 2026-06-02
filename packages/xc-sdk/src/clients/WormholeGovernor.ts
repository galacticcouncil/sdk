const DEFAULT_URL = 'https://api.wormholescan.io';

export interface GovernorChainLimit {
  chainId: number;
  availableNotional: number;
  notionalLimit: number;
  maxTransactionSize: number;
}

export interface GovernorTokenPrice {
  originChainId: number;
  originAddress: string;
  price: number;
}

export interface GovernorEnqueuedVaa {
  sequence: number;
  emitterAddress: string;
  notionalValue: number;
  txHash: string;
}

export interface WormholeRateLimit {
  configured: boolean;
  notionalLimit: number;
  availableNotional: number;
  maxTransactionSize: number;
  enqueued: boolean;
  enqueuedCount: number;
}

export class WormholeGovernor {
  private _baseUrl: string;
  private _prices?: Promise<Map<string, number>>;

  public constructor(baseUrl?: string) {
    this._baseUrl = baseUrl || DEFAULT_URL;
  }

  private async fetchData<T>(api: string): Promise<T> {
    const resp = await fetch([this._baseUrl, api].join(''));
    if (!resp.ok) {
      throw new Error(
        `Wormhole Governor request failed: ${resp.status} ${api}`
      );
    }
    const json = await resp.json();
    return json.data as T;
  }

  async getRateLimits(): Promise<GovernorChainLimit[]> {
    return this.fetchData('/api/v1/governor/limit');
  }

  async getConfig(): Promise<{ tokens: GovernorTokenPrice[] }[]> {
    return this.fetchData('/api/v1/governor/config');
  }

  async getEnqueuedVaas(): Promise<
    { chainId: number; enqueuedVaas: GovernorEnqueuedVaa[] }[]
  > {
    return this.fetchData('/api/v1/governor/enqueued_vaas');
  }

  private priceKey(originChainId: number, originAddress: string): string {
    return `${originChainId}:${originAddress.toLowerCase()}`;
  }

  async getTokenPrices(): Promise<Map<string, number>> {
    if (!this._prices) {
      this._prices = this.getConfig()
        .then((config) => {
          const prices = new Map<string, number>();
          const tokens = config[0]?.tokens ?? [];
          for (const t of tokens) {
            prices.set(
              this.priceKey(t.originChainId, t.originAddress),
              t.price
            );
          }
          return prices;
        })
        .catch((e) => {
          this._prices = undefined;
          throw e;
        });
    }
    return this._prices;
  }

  async getWormholeRateLimit(
    wormholeChainId: number
  ): Promise<WormholeRateLimit> {
    const [limits, enqueued] = await Promise.all([
      this.getRateLimits(),
      this.getEnqueuedVaas(),
    ]);

    const limit = limits.find((l) => l.chainId === wormholeChainId);
    const enqueuedCount =
      enqueued.find((e) => e.chainId === wormholeChainId)?.enqueuedVaas
        ?.length ?? 0;

    if (!limit) {
      return {
        configured: false,
        notionalLimit: 0,
        availableNotional: 0,
        maxTransactionSize: 0,
        enqueued: enqueuedCount > 0,
        enqueuedCount,
      };
    }

    return {
      configured: true,
      notionalLimit: limit.notionalLimit,
      availableNotional: limit.availableNotional,
      maxTransactionSize: limit.maxTransactionSize,
      enqueued: enqueuedCount > 0,
      enqueuedCount,
    };
  }

  /**
   * USD notional as priced by the Governor.
   *
   * @returns USD notional value, or null when none of the origins is governed
   */
  async toNotionalUsd(
    origins: { wormholeChainId: number; originAddress: string }[],
    amount: bigint,
    decimals: number
  ): Promise<number | null> {
    const prices = await this.getTokenPrices();
    for (const { wormholeChainId, originAddress } of origins) {
      const price = prices.get(this.priceKey(wormholeChainId, originAddress));
      if (price !== undefined) {
        const whole = Number(amount) / 10 ** decimals;
        return whole * price;
      }
    }
    return null;
  }
}
