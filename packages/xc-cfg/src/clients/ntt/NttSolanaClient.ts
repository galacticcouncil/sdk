import {
  AnyChain,
  Asset,
  SolanaChain,
  spl,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { getMinimumBalanceForRentExemptAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

import { ExecutorBudget } from '../wormhole';
import {
  capacityAt,
  NttClient,
  NttRateLimit,
  nttDef,
  UNMETERED,
} from './types';

// Upstream returns 250k for svm; 26 sampled redeems peaked at 87_592 CU.
const GAS_LIMIT = 250_000n;

// Lamports a redeem costs the fee payer with the recipient ata already open.
// A redeem is four transactions - verify_signatures, verify_signatures,
// post_vaa, then receive/redeem/release - and permanently creates the
// transceiver-message and inbox-item pdas. Measured on mainnet at 9_292_040
// across the three managers routed to here; rounded up for headroom.
//
// The earlier 6_000_000 was measured over the last transaction alone, which is
// why it under-funded even the ata-exists case.
const REDEEM_LAMPORTS = 10_000_000n;

// Rent-exempt minimum of a 165 byte token account, used when the ata cannot
// be read. Matches getMinimumBalanceForRentExemptAccount on mainnet.
const ATA_RENT_FALLBACK = 2_039_280n;

const RATE_LIMIT_DURATION = 60 * 60 * 24;
const OUTBOX_RATE_LIMIT_OFFSET = 8;
const INBOX_RATE_LIMIT_OFFSET = 8 + 1;

function decodeRateLimit(data: Uint8Array, offset: number) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    limit: view.getBigUint64(offset, true),
    capacityAtLastTx: view.getBigUint64(offset + 8, true),
    lastTxTimestamp: view.getBigInt64(offset + 16, true),
  };
}

export class NttSolanaClient implements NttClient {
  constructor(
    private readonly chain: SolanaChain,
    private readonly asset?: Asset
  ) {}

  getOutboundLimit(): Promise<NttRateLimit> {
    return this.getLimit();
  }

  getInboundLimit(from: AnyChain): Promise<NttRateLimit> {
    return this.getLimit(Wh.fromChain(from).getWormholeId());
  }

  /**
   * An svm redeem mints into the recipient's associated token account and the
   * relayer opens it when missing, so its rent is charged only then -
   * mirroring upstream, which adds it on `getAccountInfo(ata) === null`.
   *
   * Budgeting it unconditionally would be simpler, but the executor charges
   * source native for lamports it fronts, so every transfer to an existing
   * account would pay for rent nobody spends.
   */
  async getRedeemBudget(recipient?: string): Promise<ExecutorBudget> {
    const { connection } = this.chain;
    const budget = { gasLimit: GAS_LIMIT, msgValue: REDEEM_LAMPORTS };

    // Without a recipient the ata cannot be checked. Assume it is missing:
    // over-quoting delays nothing, under-quoting aborts the relay.
    if (!this.asset || !recipient) {
      return { ...budget, msgValue: budget.msgValue + ATA_RENT_FALLBACK };
    }

    const mint = new PublicKey(nttDef(this.chain, this.asset).token);
    const { ata } = await spl.getTokenAccount(
      connection,
      mint,
      new PublicKey(recipient)
    );

    const account = await connection.getAccountInfo(ata);
    if (account) {
      return budget;
    }

    const rent = await getMinimumBalanceForRentExemptAccount(connection);
    return { ...budget, msgValue: budget.msgValue + BigInt(rent) };
  }

  private async getLimit(from?: number): Promise<NttRateLimit> {
    const { pda, offset } = this.rateLimitPda(from);
    const account = await this.chain.connection.getAccountInfo(pda);

    if (!account) {
      return UNMETERED;
    }

    const { limit, capacityAtLastTx, lastTxTimestamp } = decodeRateLimit(
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
        BigInt(RATE_LIMIT_DURATION)
      ),
      limit: limit,
      windowMs: RATE_LIMIT_DURATION * 1000,
      capacityAtLastTx: capacityAtLastTx,
      lastTxMs: Number(lastTxTimestamp) * 1000,
    };
  }

  private rateLimitPda(from?: number): { pda: PublicKey; offset: number } {
    const programId = new PublicKey(nttDef(this.chain, this.asset).manager);
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
}
