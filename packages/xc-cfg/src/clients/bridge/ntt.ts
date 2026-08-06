import {
  Abi,
  AnyChain,
  Asset,
  EvmChain,
  Ntt as NttRegistry,
  NttTokenDef,
  SolanaChain,
  SuiChain,
  suiPkg,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { PublicKey } from '@solana/web3.js';

export interface NttRateLimit {
  capacity: bigint;
  limit: bigint;
  windowMs: number;
  capacityAtLastTx: bigint;
  lastTxMs: number;
}

const UNMETERED: NttRateLimit = {
  capacity: 0n,
  limit: 0n,
  windowMs: 0,
  capacityAtLastTx: 0n,
  lastTxMs: 0,
};

// Mirror manager's linear refill (rate_limit::capacity_at).
function capacityAt(
  limit: bigint,
  capacityAtLastTx: bigint,
  lastTxTimestamp: bigint,
  now: bigint,
  duration: bigint
): bigint {
  const elapsed = now > lastTxTimestamp ? now - lastTxTimestamp : 0n;
  const refilled = capacityAtLastTx + (limit * elapsed) / duration;
  return refilled < limit ? refilled : limit;
}

// TrimmedAmount is a uint72 - `amount << 8 | decimals`.
function untrim(packed: bigint, decimals: number): bigint {
  const amount = packed >> 8n;
  const trimmedDecimals = Number(packed & 0xffn);
  return amount * 10n ** BigInt(decimals - trimmedDecimals);
}

async function getEvmLimit(
  chain: EvmChain,
  ntt: NttTokenDef,
  from?: number
): Promise<NttRateLimit> {
  const provider = chain.evmClient.getProvider();
  const abi = Abi.NttManager;
  const address = ntt.manager as `0x${string}`;

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

const SOLANA_RATE_LIMIT_DURATION = 60 * 60 * 24;
const OUTBOX_RATE_LIMIT_OFFSET = 8;
const INBOX_RATE_LIMIT_OFFSET = 8 + 1;

function decodeSolanaRateLimit(data: Uint8Array, offset: number) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    limit: view.getBigUint64(offset, true),
    capacityAtLastTx: view.getBigUint64(offset + 8, true),
    lastTxTimestamp: view.getBigInt64(offset + 16, true),
  };
}

function solanaRateLimitPda(
  ntt: NttTokenDef,
  from?: number
): { pda: PublicKey; offset: number } {
  const programId = new PublicKey(ntt.manager);
  const encoder = new TextEncoder();

  if (from === undefined) {
    const [pda] = PublicKey.findProgramAddressSync(
      [encoder.encode('outbox_rate_limit')],
      programId
    );
    return { pda, offset: OUTBOX_RATE_LIMIT_OFFSET };
  }

  const chainId = new Uint8Array(2);
  new DataView(chainId.buffer).setUint16(0, from, false);
  const [pda] = PublicKey.findProgramAddressSync(
    [encoder.encode('inbox_rate_limit'), chainId],
    programId
  );
  return { pda, offset: INBOX_RATE_LIMIT_OFFSET };
}

async function getSolanaLimit(
  chain: SolanaChain,
  ntt: NttTokenDef,
  from?: number
): Promise<NttRateLimit> {
  const { pda, offset } = solanaRateLimitPda(ntt, from);
  const account = await chain.connection.getAccountInfo(pda);

  if (!account) {
    return UNMETERED;
  }

  const { limit, capacityAtLastTx, lastTxTimestamp } = decodeSolanaRateLimit(
    account.data,
    offset
  );
  const now = BigInt(Math.floor(Date.now() / 1000));

  return {
    capacity: capacityAt(
      limit,
      capacityAtLastTx,
      lastTxTimestamp,
      now,
      BigInt(SOLANA_RATE_LIMIT_DURATION)
    ),
    limit: limit,
    windowMs: SOLANA_RATE_LIMIT_DURATION * 1000,
    capacityAtLastTx: capacityAtLastTx,
    lastTxMs: Number(lastTxTimestamp) * 1000,
  };
}

const SUI_RATE_LIMIT_DURATION_MS = 60 * 60 * 24 * 1000;

// Sui stores RateLimitState in *local* token decimals, not as the packed
// TrimmedAmount the evm manager keeps - so no untrimming here. There is no
// upstream sui ntt binding to mirror (wormhole-sdk-ts ships no ntt protocol,
// and native-token-transfers only binds solana), so this is off a live read:
// the SUI manager reads limit 1e14 against 9 decimals = 100k SUI, and each
// peer carries its own `token_decimals` for confirmation.
function toSuiRateLimit(fields: Record<string, any>): NttRateLimit {
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
      BigInt(SUI_RATE_LIMIT_DURATION_MS)
    ),
    limit: limit,
    windowMs: SUI_RATE_LIMIT_DURATION_MS,
    capacityAtLastTx: capacityAtLastTx,
    // Sui already stamps in milliseconds.
    lastTxMs: Number(lastTxTimestamp),
  };
}

async function getSuiLimit(
  chain: SuiChain,
  ntt: NttTokenDef,
  from?: number
): Promise<NttRateLimit> {
  const client = chain.client;
  const state = await suiPkg.getObject(client, ntt.manager);

  if (from === undefined) {
    const rateLimit = state.fields['outbox']?.fields?.rate_limit?.fields;
    return rateLimit ? toSuiRateLimit(rateLimit) : UNMETERED;
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
  return rateLimit ? toSuiRateLimit(rateLimit) : UNMETERED;
}

function getLimit(
  chain: AnyChain,
  ntt: NttTokenDef,
  from?: number
): Promise<NttRateLimit> {
  if (chain instanceof SolanaChain) {
    return getSolanaLimit(chain, ntt, from);
  }
  if (chain instanceof SuiChain) {
    return getSuiLimit(chain, ntt, from);
  }
  return getEvmLimit(chain as EvmChain, ntt, from);
}

export async function getNttOutboundLimit(
  chain: AnyChain,
  asset: Asset
): Promise<NttRateLimit> {
  return getLimit(chain, NttRegistry.fromChain(chain, asset));
}

export async function getNttInboundLimit(
  chain: AnyChain,
  asset: Asset,
  from: AnyChain
): Promise<NttRateLimit> {
  return getLimit(
    chain,
    NttRegistry.fromChain(chain, asset),
    Wh.fromChain(from).getWormholeId()
  );
}
