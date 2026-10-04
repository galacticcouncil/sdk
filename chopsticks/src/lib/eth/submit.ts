import { keccak256, parseTransaction, type Hex } from 'viem';
import { Binary } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

import type { Fork } from '../network';
import { buildTransactionV3 } from './transaction';

export interface EthBatchResult {
  /** keccak256 of each raw signed tx, in submission order. */
  ethHashes: Hex[];
  /** Hash of the block they were sealed into. */
  blockHash: string;
  /** Number of the block they were sealed into. */
  blockNumber: number;
}

/**
 * Seal raw signed Ethereum txs into ONE block, as `pallet_ethereum::transact`.
 *
 * - Self-contained extrinsics: the embedded eth signature is the only auth,
 *   so it has to be real - `mock-signature-host` does not reach it
 * - Built in-process: `dev_newBlock` can't prune a self-contained tx by hash
 *   and rebuilds the same block forever
 * - Same nonce order as given; each tx's gas limit counts against the block
 *
 * @param fork - chain to seal the block on
 * @param rawTxs - signed eth transactions
 */
export async function sendRawEthTxs(
  fork: Fork,
  rawTxs: Hex[]
): Promise<EthBatchResult> {
  const api = fork.client.getTypedApi(hydration);
  const transactions = await Promise.all(
    rawTxs.map(async (rawTx) => {
      const tx = api.tx.Ethereum.transact({
        transaction: buildTransactionV3(parseTransaction(rawTx)),
      });
      return Binary.toHex(await tx.getBareTx()) as `0x${string}`;
    })
  );
  const block = await fork.chain.newBlock({ transactions });
  return {
    ethHashes: rawTxs.map((raw) => keccak256(raw)),
    blockHash: block.hash,
    blockNumber: block.number,
  };
}
