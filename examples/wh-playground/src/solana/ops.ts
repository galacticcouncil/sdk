import {
  SolanaAddress,
  SolanaChain,
  SolanaPlatform,
  SolanaTransaction,
  SolanaUnsignedTransaction,
} from '@wormhole-foundation/sdk-solana';

import {
  SolanaWormholeCore,
  utils as coreUtils,
} from '@wormhole-foundation/sdk-solana-core';

import { createAttestTokenInstruction } from '@wormhole-foundation/sdk-solana-tokenbridge';

import {
  Keypair,
  MessageV0,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

const WORMHOLE_BRIDGE_ADDRESS = 'wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb';

export async function createAttestation(
  keyPair: Keypair,
  chain: SolanaChain,
  token: SolanaAddress,
  payer: SolanaAddress
): Promise<SolanaUnsignedTransaction<'Mainnet', 'Solana'>> {
  const connection = await chain.getRpc();
  const coreBridge = new SolanaWormholeCore(
    'Mainnet',
    'Solana',
    connection,
    chain.config.contracts
  );

  const senderAddress = new SolanaAddress(payer).unwrap();
  const nonce = 0;

  const msgFee = await coreBridge.getMessageFee();
  const messageKey = Keypair.generate();

  const transferIx = coreUtils.createBridgeFeeTransferInstruction(
    coreBridge.coreBridge.programId,
    senderAddress,
    msgFee
  );

  const attestIx = createAttestTokenInstruction(
    connection,
    WORMHOLE_BRIDGE_ADDRESS,
    coreBridge.address,
    senderAddress,
    new SolanaAddress(token).unwrap(),
    messageKey.publicKey,
    nonce
  );

  const transaction = new Transaction().add(transferIx, attestIx);
  transaction.feePayer = senderAddress;

  const { blockhash } = await SolanaPlatform.latestBlock(connection);

  const mssg = new TransactionMessage({
    payerKey: keyPair.publicKey,
    recentBlockhash: blockhash,
    instructions: transaction.instructions,
  }).compileToV0Message();

  const mssgHex = Buffer.from(mssg.serialize()).toString('hex');
  const mssgArray = Uint8Array.from(Buffer.from(mssgHex, 'hex'));
  const mssgOrig = MessageV0.deserialize(mssgArray);

  const versioned = new VersionedTransaction(mssgOrig);
  versioned.sign([keyPair, ...[messageKey]]);

  const simulateResponse = await connection.simulateTransaction(versioned, {
    replaceRecentBlockhash: true,
    accounts: {
      encoding: 'base64',
      addresses: [keyPair.publicKey.toBase58()],
    },
  });

  console.log('CoreBridge message fee:', msgFee);
  console.log(simulateResponse);
  return createUnsignedTx(
    { transaction, signers: [messageKey] },
    'Solana.AttestToken'
  );
}

function createUnsignedTx(
  txReq: SolanaTransaction,
  description: string,
  parallelizable: boolean = false
): SolanaUnsignedTransaction<'Mainnet', 'Solana'> {
  return new SolanaUnsignedTransaction(
    txReq,
    'Mainnet',
    'Solana',
    description,
    parallelizable
  );
}
