import {
  AnyChain,
  Asset,
  NearChain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { ExecutorBudget } from '../wormhole';
import {
  capacityAt,
  NttClient,
  NttRateLimit,
  nttDef,
  UNMETERED,
} from './types';

const RATE_LIMIT_DURATION = 60 * 60 * 24;

/** Storage key of the contract state, the outbound limit inside it. */
const STATE_KEY = new TextEncoder().encode('STATE');

/** `StorageKey::Inbound` - inbound limits live under it, keyed by chain. */
const INBOUND_PREFIX = 1;

type StoredRateLimit = {
  limit: bigint;
  capacityAtLastTx: bigint;
  lastTxTimestamp: bigint;
};

/** Borsh `RateLimit` - limit & capacity u128, last_tx_at u64 seconds. */
function decodeRateLimit(view: DataView, offset: number): StoredRateLimit {
  const u128 = (at: number) =>
    view.getBigUint64(at, true) + (view.getBigUint64(at + 8, true) << 64n);
  return {
    limit: u128(offset),
    capacityAtLastTx: u128(offset + 16),
    lastTxTimestamp: view.getBigUint64(offset + 32, true),
  };
}

/**
 * Outbound limit, out of the contract `STATE`.
 *
 * - Borsh layout of whm near-ntt `NttManager`: owner, paused, token,
 *   token_decimals, registration_deposit, core, seq, peers (prefix), outbound
 * - The strings make its offset variable, so the fields ahead are walked
 */
function decodeOutboundLimit(state: Uint8Array): StoredRateLimit {
  const view = new DataView(state.buffer, state.byteOffset, state.byteLength);
  let offset = 0;
  const skipVec = () => {
    offset += 4 + view.getUint32(offset, true);
  };

  skipVec(); // owner
  offset += 1; // paused
  skipVec(); // token
  offset += 1 + 16; // token_decimals, registration_deposit
  skipVec(); // core
  offset += 8; // seq
  skipVec(); // peers
  return decodeRateLimit(view, offset);
}

/** Storage key of the inbound limit from a chain - prefix, then u16 le. */
function inboundKey(chainId: number): Uint8Array {
  const key = new Uint8Array(3);
  key[0] = INBOUND_PREFIX;
  new DataView(key.buffer).setUint16(1, chainId, true);
  return key;
}

/**
 * The whm near-ntt contract - manager & transceiver in one, always locking.
 *
 * - Its views report capacity alone, so the limits are read from storage
 * - Rpc nodes serve storage only while the contract holds under their view
 *   limit (50kB by default), and every executed inbound transfer adds to it -
 *   a view of the full limit is due before this outgrows it
 */
export class NttNearClient implements NttClient {
  constructor(
    private readonly chain: NearChain,
    private readonly asset?: Asset
  ) {}

  getOutboundLimit(): Promise<NttRateLimit> {
    return this.getLimit();
  }

  getInboundLimit(from: AnyChain): Promise<NttRateLimit> {
    return this.getLimit(Wh.fromChain(from).getWormholeId());
  }

  /** No executor serves NEAR - redeems are the recipient's own `complete`. */
  async getRedeemBudget(): Promise<ExecutorBudget> {
    throw new Error('No executor delivery to ' + this.chain.name + '.');
  }

  /** Custody is the contract's own token balance, released by ft_transfer. */
  async getCustody(): Promise<bigint> {
    const { manager, token } = nttDef(this.chain, this.asset);
    const balance = await this.chain.client.view<string>(
      token,
      'ft_balance_of',
      { account_id: manager }
    );
    return BigInt(balance);
  }

  private async getLimit(from?: number): Promise<NttRateLimit> {
    const stored = await this.readLimit(from);
    if (!stored) {
      return UNMETERED;
    }

    const { limit, capacityAtLastTx, lastTxTimestamp } = stored;
    const now = BigInt(Math.floor(Date.now() / 1000));

    return {
      capacity: capacityAt(
        limit,
        capacityAtLastTx,
        lastTxTimestamp,
        now,
        BigInt(RATE_LIMIT_DURATION)
      ),
      limit: limit,
      windowMs: RATE_LIMIT_DURATION * 1000,
      capacityAtLastTx: capacityAtLastTx,
      lastTxMs: Number(lastTxTimestamp) * 1000,
    };
  }

  /** Stored limit, or undefined for a chain the contract has no peer on. */
  private async readLimit(from?: number): Promise<StoredRateLimit | undefined> {
    const contract = nttDef(this.chain, this.asset).manager;
    const key = from === undefined ? STATE_KEY : inboundKey(from);
    const [item] = await this.chain.client.viewState(contract, key);

    if (!item) {
      return undefined;
    }

    if (from === undefined) {
      return decodeOutboundLimit(item.value);
    }

    const { buffer, byteOffset, byteLength } = item.value;
    return decodeRateLimit(new DataView(buffer, byteOffset, byteLength), 0);
  }
}
