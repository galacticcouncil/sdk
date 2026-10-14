import { addr, NearClient } from '@galacticcouncil/xc-core';

import { OMNI_BRIDGE_API, OMNI_CONNECTORS } from './consts';
import type {
  OmniClient,
  OmniConnector,
  OmniConnectorConfig,
  OmniDepositOrder,
  OmniUtxoChain,
} from './types';

const { ZecAddr } = addr;

const DEFAULT_NEAR_RPC = 'https://free.rpc.fastnear.com';
const DEFAULT_TIMEOUT_MS = 15_000;

/** Construction options for the Omni client. */
export interface OmniClientOpts {
  /** Omni bridge api base URL. Default the mainnet api. */
  apiUrl?: string;
  /** NEAR rpc the connector is read from. Default fastnear's free rpc. */
  nearRpc?: string;
  /** Per request timeout, ms. Default 15000. */
  timeoutMs?: number;
}

/** Whether the address is one a deposit on the chain can be paid to. */
function isDepositAddress(chain: OmniUtxoChain, address: string): boolean {
  switch (chain) {
    case 'zcash':
      return ZecAddr.isValid(address);
    default:
      return false;
  }
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

/**
 * Omni bridge client over the mainnet api and a NEAR rpc.
 *
 * - Registers orders with `skip_tx`, leaving no public NEAR record
 * - Returns an address only once the connector's own view derives it
 * - Caches an order's address; a failed one is retried
 */
export function createOmniClient(opts: OmniClientOpts = {}): OmniClient {
  const apiUrl = opts.apiUrl ?? OMNI_BRIDGE_API;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const near = new NearClient(opts.nearRpc ?? DEFAULT_NEAR_RPC);

  const addresses = new Map<string, Promise<string>>();

  const view = <T>(account: string, method: string, args: object) =>
    withTimeout(
      near.view<T>(account, method, args),
      timeoutMs,
      `near view ${account}.${method}`
    );

  const getConnector = (chain: OmniUtxoChain): OmniConnector => {
    const connector = OMNI_CONNECTORS[chain];
    if (connector) {
      return connector;
    }
    throw new Error('Omni has no ' + chain + ' connector configured');
  };

  const register = async (order: OmniDepositOrder): Promise<string> => {
    const res = await fetch(`${apiUrl}/utxo/get_user_deposit_address`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chain: order.chain,
        recipient: order.recipient,
        safe_deposit: { msg: order.msg },
        refund_address: order.refundAddress,
        skip_tx: true,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

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
  };

  const resolve = async (order: OmniDepositOrder): Promise<string> => {
    const { account } = getConnector(order.chain);
    const to = await register(order);

    if (!isDepositAddress(order.chain, to)) {
      throw new Error(
        `Omni deposit address is not a ${order.chain} address: ${to}`
      );
    }

    const derived = await view<string>(account, 'get_user_deposit_address', {
      deposit_msg: {
        recipient_id: order.recipient,
        safe_deposit: { msg: order.msg },
        refund_address: order.refundAddress,
      },
    });
    if (derived !== to) {
      throw new Error(
        `Omni deposit address ${to} does not derive from the order (${derived})`
      );
    }
    return to;
  };

  return {
    getConnector,

    async getConnectorConfig(chain) {
      const { account } = getConnector(chain);
      return view<OmniConnectorConfig>(account, 'get_config', {});
    },

    getDepositAddress(order) {
      const { chain, recipient, msg, refundAddress } = order;
      const key = JSON.stringify({ chain, recipient, msg, refundAddress });

      let address = addresses.get(key);
      if (!address) {
        const pending = resolve({ chain, recipient, msg, refundAddress });
        pending.catch(() => {
          if (addresses.get(key) === pending) addresses.delete(key);
        });
        addresses.set(key, pending);
        address = pending;
      }
      return address;
    },
  };
}
