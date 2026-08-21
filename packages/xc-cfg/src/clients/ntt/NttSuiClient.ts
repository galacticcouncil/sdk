import {
  AnyChain,
  Asset,
  suiPkg,
  SuiChain,
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

// Sui budgets in MIST - a real gas budget, not an abstract unit, which is why
// this is 20x the evm number rather than comparable to it.
//
// Measured against the sui ntt manager this route targets: live redeems
// (parse_and_verify -> validate_message -> redeem -> release) settled at
// ~6.48M MIST net against a 7_556_176 budget. 10M clears the observed budget
// with ~32% headroom and sits far under sui's 1e9 maxGasLimit. Upstream pads
// the same estimate to 20M.
const GAS_LIMIT = 10_000_000n;

const RATE_LIMIT_DURATION_MS = 60 * 60 * 24 * 1000;

function toRateLimit(fields: Record<string, any>): NttRateLimit {
  const limit = BigInt(fields['limit']);
  const capacityAtLastTx = BigInt(fields['capacity_at_last_tx']);
  const lastTxTimestamp = BigInt(fields['last_tx_timestamp']);
  const now = BigInt(Date.now());

  return {
    capacity: capacityAt(
      limit,
      capacityAtLastTx,
      lastTxTimestamp,
      now,
      BigInt(RATE_LIMIT_DURATION_MS)
    ),
    limit: limit,
    windowMs: RATE_LIMIT_DURATION_MS,
    capacityAtLastTx: capacityAtLastTx,
    lastTxMs: Number(lastTxTimestamp),
  };
}

export class NttSuiClient implements NttClient {
  constructor(
    private readonly chain: SuiChain,
    private readonly asset?: Asset
  ) {}

  getOutboundLimit(): Promise<NttRateLimit> {
    return this.getLimit();
  }

  getInboundLimit(from: AnyChain): Promise<NttRateLimit> {
    return this.getLimit(Wh.fromChain(from).getWormholeId());
  }

  /** A sui redeem holds nothing - the coin is minted to the recipient. */
  async getRedeemBudget(): Promise<ExecutorBudget> {
    return { gasLimit: GAS_LIMIT, msgValue: 0n };
  }

  private async getLimit(from?: number): Promise<NttRateLimit> {
    const client = this.chain.client;
    const manager = nttDef(this.chain, this.asset).manager;
    const state = await suiPkg.getObject(client, manager);

    if (from === undefined) {
      const rateLimit = state.fields['outbox']?.fields?.rate_limit?.fields;
      return rateLimit ? toRateLimit(rateLimit) : UNMETERED;
    }

    const peers = state.fields['peers']?.fields?.id?.id;
    if (!peers) {
      return UNMETERED;
    }

    const { data } = await client.getDynamicFieldObject({
      parentId: peers,
      name: { type: 'u16', value: from },
    });
    const content = data?.content as { fields?: Record<string, any> };
    const rateLimit =
      content?.fields?.['value']?.fields?.inbound_rate_limit?.fields;
    return rateLimit ? toRateLimit(rateLimit) : UNMETERED;
  }
}
