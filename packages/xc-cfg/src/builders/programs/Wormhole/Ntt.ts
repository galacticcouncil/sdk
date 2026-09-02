import {
  EvmParachain,
  Ntt as NttRegistry,
  ProgramConfig,
  ProgramConfigBuilder,
  SolanaBalanceType,
  SolanaChain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { getMinimumBalanceForRentExemptAccount } from '@solana/spl-token';
import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { toChain } from '@wormhole-foundation/sdk-base';
import { UniversalAddress } from '@wormhole-foundation/sdk-definitions';
import { SolanaAddress } from '@wormhole-foundation/sdk-solana';

import '@wormhole-foundation/sdk-definitions-ntt';

async function getLookupTables(
  connection: Connection,
  tx: Transaction | VersionedTransaction
): Promise<AddressLookupTableAccount[]> {
  if (!('message' in tx) || tx.message.version === 'legacy') {
    return [];
  }
  const luts = await Promise.all(
    tx.message.addressTableLookups.map((acc) =>
      connection.getAddressLookupTable(acc.accountKey)
    )
  );
  return luts
    .map((lut) => lut.value)
    .filter((val): val is AddressLookupTableAccount => val !== null);
}

/** Unpack an unsigned tx back into the instructions ProgramConfig carries. */
async function toProgramConfig(
  connection: Connection,
  tx: Transaction | VersionedTransaction,
  signers: Keypair[]
): Promise<ProgramConfig> {
  const lookupTables = await getLookupTables(connection, tx);
  const instructions =
    'message' in tx
      ? TransactionMessage.decompile(tx.message, {
          addressLookupTableAccounts: lookupTables,
        }).instructions
      : tx.instructions;
  return new ProgramConfig({
    instructions,
    signers,
    lookupTables,
    func: 'transfer',
    module: 'NttManager',
  });
}

const transfer = (): ProgramConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, sender, source, destination } = params;
    const ctx = source.chain as SolanaChain;
    const rcv = destination.chain;

    const ntt = NttRegistry.fromChain(ctx, asset);
    const ctxWh = Wh.fromChain(ctx);
    const rcvWh = Wh.fromChain(rcv);

    let rcvAddress = address;
    if (rcv instanceof EvmParachain) {
      rcvAddress = await rcv.getDerivatedAddress(address);
    }

    // Lazy - the package esm dist doesn't load under node (broken import).
    const { SolanaNtt } = await import('@wormhole-foundation/sdk-solana-ntt');

    const solanaNtt = new SolanaNtt('Mainnet', 'Solana', ctx.connection, {
      coreBridge: ctxWh.getCoreBridge(),
      ntt: {
        manager: ntt.manager,
        token: ntt.token,
        transceiver: { wormhole: ntt.transceiver.wormhole },
      },
    });

    // The manager locks an spl token. A native gas source (sol) has to be
    // wrapped into it (wSOL) first - upstream yields that as its own
    // transaction, the pair doesn't fit one.
    const wrapNative = ctx.getBalanceType(asset) === SolanaBalanceType.Native;

    const outboxItem = Keypair.generate();
    const sequence: ProgramConfig[] = [];
    for await (const unsigned of solanaNtt.transfer(
      new SolanaAddress(sender),
      amount,
      {
        chain: toChain(rcvWh.getWormholeId()),
        address: new UniversalAddress(rcvWh.normalizeAddress(rcvAddress)),
      },
      { queue: false, automatic: false, wrapNative },
      outboxItem
    )) {
      const { transaction, signers } = unsigned.transaction;
      sequence.push(
        await toProgramConfig(ctx.connection, transaction, signers ?? [])
      );
    }

    // Wrapping opens an associated token account when the sender has none.
    // Carried on the transfer, the only one the fee is estimated from.
    const rentReserve = wrapNative
      ? BigInt(await getMinimumBalanceForRentExemptAccount(ctx.connection))
      : 0n;

    const main = sequence[sequence.length - 1];
    return [
      ...sequence.slice(0, -1),
      new ProgramConfig({
        instructions: main.instructions,
        signers: main.signers,
        lookupTables: main.lookupTables,
        rentReserve: rentReserve,
        func: 'transfer',
        module: 'NttManager',
      }),
    ];
  },
});

export const Ntt = () => {
  return {
    transfer,
  };
};
