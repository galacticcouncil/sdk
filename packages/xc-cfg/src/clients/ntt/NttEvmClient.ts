import {
  Abi,
  AnyChain,
  AnyEvmChain,
  Asset,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

import { ExecutorBudget } from '../wormhole';
import { NttClient, NttRateLimit, nttDef, UNMETERED } from './types';

// Upstream DEFAULT_EXECUTOR_GAS_LIMIT (evm/ts/src/executorGasLimits.ts).
const GAS_LIMIT = 500_000n;

// TrimmedAmount is a uint72 - `amount << 8 | decimals`.
function untrim(packed: bigint, decimals: number): bigint {
  const amount = packed >> 8n;
  const trimmedDecimals = Number(packed & 0xffn);
  return amount * big.pow10(decimals - trimmedDecimals);
}

export class NttEvmClient implements NttClient {
  constructor(
    private readonly chain: AnyEvmChain,
    private readonly asset?: Asset
  ) {}

  getOutboundLimit(): Promise<NttRateLimit> {
    return this.getLimit();
  }

  getInboundLimit(from: AnyChain): Promise<NttRateLimit> {
    return this.getLimit(Wh.fromChain(from).getWormholeId());
  }

  /** An evm redeem holds nothing - receiveMessage moves no value. */
  async getRedeemBudget(): Promise<ExecutorBudget> {
    return { gasLimit: GAS_LIMIT, msgValue: 0n };
  }

  private async getLimit(from?: number): Promise<NttRateLimit> {
    const provider = this.chain.evmClient.getProvider();
    const abi = Abi.NttManager;
    const address = nttDef(this.chain, this.asset).manager as `0x${string}`;

    const [duration, decimals, capacity, params] = await Promise.all([
      provider.readContract({
        abi,
        address,
        functionName: 'rateLimitDuration',
      }) as Promise<bigint>,
      provider.readContract({
        abi,
        address,
        functionName: 'tokenDecimals',
      }) as Promise<number>,
      (from === undefined
        ? provider.readContract({
            abi,
            address,
            functionName: 'getCurrentOutboundCapacity',
          })
        : provider.readContract({
            abi,
            address,
            functionName: 'getCurrentInboundCapacity',
            args: [from],
          })) as Promise<bigint>,
      (from === undefined
        ? provider.readContract({
            abi,
            address,
            functionName: 'getOutboundLimitParams',
          })
        : provider.readContract({
            abi,
            address,
            functionName: 'getInboundLimitParams',
            args: [from],
          })) as Promise<{
        limit: bigint;
        currentCapacity: bigint;
        lastTxTimestamp: bigint;
      }>,
    ]);

    if (duration === 0n) {
      return UNMETERED;
    }

    return {
      capacity: capacity,
      limit: untrim(params.limit, decimals),
      windowMs: Number(duration) * 1000,
      capacityAtLastTx: untrim(params.currentCapacity, decimals),
      lastTxMs: Number(params.lastTxTimestamp) * 1000,
    };
  }
}
