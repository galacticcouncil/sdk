import { addr, AnyChain, NearChain } from '@galacticcouncil/xc-core';

import {
  OMNI_BRIDGE_API,
  OMNI_CONNECTORS,
  OMNI_MPC_DOMAIN,
  OMNI_MPC_SIGNER,
  OmniConnector,
} from '../../bridges/omni';

const { NearAddr } = addr;

const TIMEOUT_MS = 15_000;

/** Connector's `get_config` view, raw. */
export interface OmniConnectorConfig {
  min_deposit_amount: string;
  min_withdraw_amount: string;
  refund_timelock_sec: number;
  withdraw_bridge_fee: { fee_min: string; fee_rate: number };
}

/** Order Omni derives the deposit address from. */
export interface OmniDepositOrder {
  /** NEAR account the deposit is delivered to. */
  recipient: string;
  /** `ft_transfer_call` msg, byte for byte. */
  msg: string;
  /** Source chain address a refused deposit is refunded to. */
  refundAddress: string;
}

/** Rejects once `ms` pass without the promise settling. */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** The value cached under `key`, loaded on first use; a failure is retried. */
function memoize<V>(
  cache: Map<string, Promise<V>>,
  key: string,
  load: () => Promise<V>
): Promise<V> {
  let value = cache.get(key);
  if (!value) {
    const pending = load();
    pending.catch(() => {
      if (cache.get(key) === pending) cache.delete(key);
    });
    cache.set(key, pending);
    value = pending;
  }
  return value;
}

/**
 * Omni connector of a UTXO chain, over the mainnet api and the NEAR hub.
 *
 * - Registers orders with `skip_tx`, leaving no public NEAR record
 * - Returns an address only once the connector's own view derives it
 * - Caches deposit addresses and withdraw accounts; a failed one is retried
 */
export class OmniClient {
  readonly source: AnyChain;
  readonly hub: NearChain;
  readonly connector: OmniConnector;

  private readonly timeoutMs: number;
  private readonly addresses = new Map<string, Promise<string>>();
  private readonly accounts = new Map<string, Promise<string>>();

  /**
   * @param source - UTXO chain deposits are paid on
   * @param hub - NEAR chain the connector is read from
   * @param timeoutMs - per request timeout
   */
  constructor(source: AnyChain, hub: NearChain, timeoutMs = TIMEOUT_MS) {
    const connector = OMNI_CONNECTORS[source.key];
    if (!connector) {
      throw new Error('Omni has no connector for ' + source.name);
    }
    this.source = source;
    this.hub = hub;
    this.connector = connector;
    this.timeoutMs = timeoutMs;
  }

  /** Live connector config. */
  async getConfig(): Promise<OmniConnectorConfig> {
    return this.view<OmniConnectorConfig>(
      this.connector.account,
      'get_config',
      {}
    );
  }

  /**
   * Deposit address of the order.
   *
   * @param order - recipient, msg and refund address
   */
  getDepositAddress(order: OmniDepositOrder): Promise<string> {
    const { recipient, msg, refundAddress } = order;
    const key = JSON.stringify({ recipient, msg, refundAddress });
    return memoize(this.addresses, key, () =>
      this.resolve({ recipient, msg, refundAddress })
    );
  }

  /**
   * NEAR account a withdrawal to `address` settles to.
   *
   * - The withdraw contract's `path_of`, then the MPC signer's key under it
   * - Implicit: the account id is the key's hex
   * - One address, one account, permanently
   *
   * @param address - destination on the UTXO chain, already valid
   */
  getWithdrawAccount(address: string): Promise<string> {
    return memoize(this.accounts, address, async () => {
      const { contract } = this.connector.withdrawal;
      const path = await this.view<string>(contract, 'path_of', { address });
      const key = await this.view<string>(
        OMNI_MPC_SIGNER,
        'derived_public_key',
        { path, predecessor: contract, domain_id: OMNI_MPC_DOMAIN }
      );
      return NearAddr.fromPublicKey(key);
    });
  }

  /**
   * What Omni takes from a withdrawal on its way out, smallest unit.
   *
   * - Bridge fee, the connector's own formula: `max(amount × rate, min)`
   * - Miner fee the withdraw contract fixes
   *
   * @param amount - landing on NEAR, smallest unit
   */
  async getWithdrawFee(amount: bigint): Promise<bigint> {
    const { withdraw_bridge_fee } = await this.getConfig();
    const { fee_min, fee_rate } = withdraw_bridge_fee;
    const rated = (amount * BigInt(fee_rate)) / 10_000n;
    const min = BigInt(fee_min);
    const bridgeFee = rated > min ? rated : min;
    return bridgeFee + this.connector.withdrawal.minerFee;
  }

  private view<T>(account: string, method: string, args: object): Promise<T> {
    return withTimeout(
      this.hub.client.view<T>(account, method, args),
      this.timeoutMs,
      `near view ${account}.${method}`
    );
  }

  private async register(order: OmniDepositOrder): Promise<string> {
    const res = await fetch(
      `${OMNI_BRIDGE_API}/utxo/get_user_deposit_address`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chain: this.connector.chain,
          recipient: order.recipient,
          safe_deposit: { msg: order.msg },
          refund_address: order.refundAddress,
          skip_tx: true,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      }
    );

    if (!res.ok) {
      throw new Error(
        `Omni deposit address failed: ${res.status} ${await res.text()}`
      );
    }

    const { address } = (await res.json()) as { address?: unknown };
    if (typeof address !== 'string' || !address) {
      throw new Error('Omni deposit address missing in the response');
    }
    return address;
  }

  private async resolve(order: OmniDepositOrder): Promise<string> {
    const to = await this.register(order);

    if (!this.source.isValidAddress(to)) {
      throw new Error(
        `Omni deposit address is not a ${this.source.name} address: ${to}`
      );
    }

    const derived = await this.view<string>(
      this.connector.account,
      'get_user_deposit_address',
      {
        deposit_msg: {
          recipient_id: order.recipient,
          safe_deposit: { msg: order.msg },
          refund_address: order.refundAddress,
        },
      }
    );
    if (derived !== to) {
      throw new Error(
        `Omni deposit address ${to} does not derive from the order (${derived})`
      );
    }
    return to;
  }
}
