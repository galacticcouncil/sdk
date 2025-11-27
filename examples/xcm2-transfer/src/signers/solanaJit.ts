import {
  SolanaLilJit,
  type Call,
  type SolanaCall,
} from '@galacticcouncil/xcm2-sdk';
import { AnyChain, SolanaChain } from '@galacticcouncil/xcm-core';

import { MessageV0, VersionedTransaction } from '@solana/web3.js';

export async function signAndSend(
  calls: Call[],
  chain: AnyChain,
  onError: (error: unknown) => void
) {
  const ctx = chain as SolanaChain;
  const lilJit = new SolanaLilJit(ctx);

  const versioned = calls.map((c) => toVersioned(c));

  const wallet = (window as any).phantom.solana;
  await wallet.connect();

  const signed = await wallet.signAllTransactions(versioned);
  const encoded = signed.map((s) =>
    Buffer.from(s.serialize()).toString('base64')
  );

  try {
    const simulation = await lilJit.simulateBundle(encoded);
    console.log(simulation);

    const bundleId = await lilJit.sendBundle(encoded);
    console.log(bundleId);

    const status = await lilJit.getInflightBundleStatuses([bundleId]);
    console.log(status);
  } catch (err) {
    onError(err);
  }
}

function toVersioned(call: Call): VersionedTransaction {
  const { data, signers } = call as SolanaCall;

  const mssgBuffer = Buffer.from(data, 'hex');
  const mssgArray = Uint8Array.from(mssgBuffer);
  const mssgV0 = MessageV0.deserialize(mssgArray);

  const versioned = new VersionedTransaction(mssgV0);
  if (signers) {
    versioned.sign(signers);
  }
  return versioned;
}
