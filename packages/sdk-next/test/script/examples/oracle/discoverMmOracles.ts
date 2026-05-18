import { Binary, PolkadotClient, getTypedCodecs } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';
import type { HydrationEvents } from '@galacticcouncil/descriptors';

import { decodeEventLog, toEventHash } from 'viem';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { EvmClient, EvmRpcAdapter } from '../../../../src/evm';
import { IndexerStats, RpcPool, indexBlocks } from '../../../../src/indexer';

// ─── Config ──────────────────────────────────────────────────────

const SCAN_BLOCKS = 50_000;
const CONCURRENCY = 100;
const BATCH_SIZE = 50;

// ─── ABIs ────────────────────────────────────────────────────────

const MANAGED_ORACLE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roundId', type: 'uint80' },
      { indexed: false, name: 'answer', type: 'int256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'PriceUpdated',
    type: 'event',
  },
] as const;

const DIA_ORACLE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'key', type: 'string' },
      { indexed: false, name: 'value', type: 'uint128' },
      { indexed: false, name: 'timestamp', type: 'uint128' },
    ],
    name: 'OracleUpdate',
    type: 'event',
  },
] as const;

const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { type: 'uint80' },
      { type: 'int256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ─── Types ───────────────────────────────────────────────────────

type EvmPayload = HydrationEvents['EVM']['Log'];

type ManagedHit = {
  kind: 'Managed';
  emitter: string;
  value: bigint;
  timestamp: bigint;
  blockHash: string;
  blockNumber: number;
};

type DiaHit = {
  kind: 'DIA';
  emitter: string;
  key: string;
  value: bigint;
  timestamp: bigint;
  blockHash: string;
  blockNumber: number;
};

type Hit = ManagedHit | DiaHit;

type Mapped =
  | { kind: 'Managed'; mmAddress: string; via: string }
  | { kind: 'DIA'; mmAddress: string; underlying: string; diaKey: string };

// ─── Helpers ─────────────────────────────────────────────────────

const eventKey = (h: Hit) =>
  h.kind === 'Managed' ? `managed:${h.emitter}` : `dia:${h.emitter}:${h.key}`;

const short = (s: string) => `${s.slice(0, 10)}…${s.slice(-4)}`;

function decodeOracleHit(
  log: EvmPayload['log'],
  blockHash: string,
  blockNumber: number,
  topics: { MANAGED: string; DIA: string }
): Hit | null {
  const t = log.topics.map((x) => x.toLowerCase());
  const topic0 = t[0] ?? '';
  if (topic0 !== topics.MANAGED && topic0 !== topics.DIA) return null;

  const emitter = log.address.toLowerCase();
  const data = Binary.toHex(log.data);

  try {
    if (topic0 === topics.MANAGED) {
      const { args } = decodeEventLog({
        abi: MANAGED_ORACLE_ABI,
        topics: t as any,
        data: data as any,
      });
      return {
        kind: 'Managed',
        emitter,
        value: args.answer,
        timestamp: args.timestamp,
        blockHash,
        blockNumber,
      };
    }
    const { args } = decodeEventLog({
      abi: DIA_ORACLE_ABI,
      topics: t as any,
      data: data as any,
    });
    return {
      kind: 'DIA',
      emitter,
      key: args.key,
      value: args.value,
      timestamp: args.timestamp,
      blockHash,
      blockNumber,
    };
  } catch {
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────

class DiscoverMmOracles extends PapiExecutor {
  async script(client: PolkadotClient, _evm: EvmClient) {
    const api = client.getTypedApi(hydration);
    const codecs = await getTypedCodecs(hydration);
    const eventsCodec = codecs.query.System.Events.value;

    // ── PHASE A · setup ────────────────────────────────────────

    const pegs = await api.query.Stableswap.PoolPegs.getEntries();
    const mmAddresses = new Set<string>();
    for (const { value } of pegs) {
      for (const s of value.source) {
        if (s.type === 'MMOracle') {
          mmAddresses.add(s.value.toString().toLowerCase());
        }
      }
    }
    console.log(`\n${mmAddresses.size} mmAddress(es) referenced by PoolPegs`);

    const MANAGED_TOPIC = toEventHash(
      'PriceUpdated(uint80,int256,uint256)'
    ).toLowerCase();

    const DIA_TOPIC = toEventHash(
      'OracleUpdate(string,uint128,uint128)'
    ).toLowerCase();

    const TOPICS = { MANAGED: MANAGED_TOPIC, DIA: DIA_TOPIC };
    const NEEDLES = [MANAGED_TOPIC.slice(2), DIA_TOPIC.slice(2)];

    const tip = await client.getFinalizedBlock();
    const fromBlock = Math.max(0, tip.number - SCAN_BLOCKS + 1);
    console.log(`Scanning blocks ${fromBlock} → ${tip.number}\n`);

    // ── PHASE B · scan & decode ────────────────────────────────

    const pool = RpcPool.fromClients([client]);
    const stats = new IndexerStats();
    const allHits: Hit[] = [];

    const progress = setInterval(() => {
      const s = stats.snapshot();
      process.stdout.write(
        `\r  ${s.blocks}/${SCAN_BLOCKS} blk · ${s.blocksPerSec.toFixed(
          0
        )}/s · ${allHits.length} hit(s)`
      );
    }, 2_000);

    await indexBlocks({
      pool,
      fromBlock,
      blockCount: SCAN_BLOCKS,
      concurrency: CONCURRENCY,
      batchSize: BATCH_SIZE,
      withEvents: true,
      stats,
      onBlock: (block) => {
        const hex = block.eventsHex;
        if (!hex || !NEEDLES.some((n) => hex.includes(n))) return;
        const records = eventsCodec.dec(hex) as any[];
        for (const { event } of records) {
          if (event.type !== 'EVM' || event.value.type !== 'Log') continue;
          const { log } = event.value.value as EvmPayload;
          const hit = decodeOracleHit(log, block.hash, block.number, TOPICS);
          if (hit) allHits.push(hit);
        }
      },
    });

    clearInterval(progress);
    process.stdout.write('\n');
    const idx = stats.snapshot();
    console.log(
      `Scanned ${idx.blocks} blocks in ${(idx.elapsedMs / 1000).toFixed(
        2
      )}s · ${allHits.length} oracle event(s)\n`
    );

    // ── PHASE C · mapping (two passes) ─────────────────────────

    const uniqueByKey = new Map<string, Hit>();
    for (const h of allHits) {
      const k = eventKey(h);
      if (!uniqueByKey.has(k)) uniqueByKey.set(k, h);
    }

    const mapped: Mapped[] = [];
    const mappedMms = new Set<string>();

    // PASS 1 — direct emitter match (Managed)
    for (const hit of uniqueByKey.values()) {
      if (hit.kind !== 'Managed') continue;
      if (!mmAddresses.has(hit.emitter) || mappedMms.has(hit.emitter)) continue;
      mapped.push({
        kind: 'Managed',
        mmAddress: hit.emitter,
        via: `PriceUpdated @ block ${hit.blockNumber}`,
      });
      mappedMms.add(hit.emitter);
    }

    // PASS 2 — DIA value/timestamp match
    const diaHits = [...uniqueByKey.values()].filter(
      (h): h is DiaHit => h.kind === 'DIA'
    );
    for (const hit of diaHits) {
      const adapter = new EvmRpcAdapter(client, hit.blockHash);
      for (const h160 of mmAddresses) {
        if (mappedMms.has(h160)) continue;
        try {
          const [, answer, , updatedAt] = await adapter.readContract({
            abi: AGGREGATOR_V3_ABI,
            address: h160 as `0x${string}`,
            functionName: 'latestRoundData',
          });
          if (answer === hit.value && updatedAt === hit.timestamp) {
            mapped.push({
              kind: 'DIA',
              mmAddress: h160,
              underlying: hit.emitter,
              diaKey: hit.key,
            });
            mappedMms.add(h160);
            break;
          }
        } catch {
          /* unreadable contract — skip */
        }
      }
    }

    // ── PHASE D · report ───────────────────────────────────────

    const unmapped = [...mmAddresses].filter((a) => !mappedMms.has(a));

    console.log('═══════════════════ MAPPING ═══════════════════');
    console.log(
      `Mapped ${mapped.length} of ${mmAddresses.size} mmAddress(es)\n`
    );

    const managed = mapped.filter(
      (m): m is Extract<Mapped, { kind: 'Managed' }> => m.kind === 'Managed'
    );
    if (managed.length) {
      console.log(`Managed (${managed.length}) — direct emitter match`);
      for (const m of managed) {
        console.log(`  ${m.mmAddress}`);
        console.log(`    ${m.via}`);
      }
      console.log();
    }

    const dia = mapped.filter(
      (m): m is Extract<Mapped, { kind: 'DIA' }> => m.kind === 'DIA'
    );
    if (dia.length) {
      console.log(
        `DIA wrapper (${dia.length}) — latestRoundData ≡ OracleUpdate payload`
      );
      for (const m of dia) {
        console.log(`  ${m.mmAddress}`);
        console.log(`    wraps DIA ${short(m.underlying)} key="${m.diaKey}"`);
      }
      console.log();
    }

    if (unmapped.length) {
      console.log(`Unmapped (${unmapped.length})`);
      for (const h160 of unmapped) console.log(`  ${h160}`);
      console.log();
    }
    console.log('═══════════════════════════════════════════════\n');

    pool.destroy();
  }
}

new DiscoverMmOracles(
  ApiUrl.Hydration,
  `Discover MM oracle kinds via Managed + DIA scan (last ${SCAN_BLOCKS} blocks)`
).run();
