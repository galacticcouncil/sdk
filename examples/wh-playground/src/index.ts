import { Wormhole, signSendWait } from '@wormhole-foundation/sdk';

import { encoding } from '@wormhole-foundation/sdk-base';
import { SolanaAddress } from '@wormhole-foundation/sdk-solana';

import { PublicKey } from '@solana/web3.js';

import { restoreBip44Mnemonic } from './utils';
import { loadProtocols, evm, solana } from './setup';
import { getSigner } from './signer';

import { createAttestation } from './solana/ops';
import { printSpaMeta } from './solana/meta';

import { Buffer } from 'buffer';

await loadProtocols(evm);
await loadProtocols(solana);

// @ts-ignore
window.Buffer = Buffer;

const wh = new Wormhole('Mainnet', [evm.Platform, solana.Platform], {
  chains: {
    Moonbeam: {
      rpc: 'https://moonbeam.public.blastapi.io',
    },
    Ethereum: {
      rpc: 'https://ethereum-rpc.publicnode.com',
    },
    Solana: {
      rpc: 'https://wispy-palpable-market.solana-mainnet.quiknode.pro',
    },
  },
});

const originChain = wh.getChain('Solana');

const mnemonic = '';
const keyPair = restoreBip44Mnemonic(mnemonic, '');
const publicKey = keyPair.publicKey.toBase58();
const privateKey = encoding.b58.encode(keyPair.secretKey);

const { signer: origSigner } = await getSigner(originChain, privateKey);

const fartcoin = new PublicKey('9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump');
const fuel = new PublicKey('9nD29a6TMDFHqAXS3iJ6nwLByLBS1gx2664ieQf7Zo7H');

//printSpaMeta(fartcoin.toBase58());
//printSpaMeta(fuel.toBase58());

const tb = await originChain.getTokenBridge();

const isWrapped = await tb.isWrappedAsset(
  new SolanaAddress(fartcoin.toBytes())
);
console.log('Is already wrapped:', isWrapped);

// Default impl
const attestTxns = tb.createAttestation(
  new SolanaAddress(fartcoin),
  Wormhole.parseAddress(origSigner.chain(), origSigner.address())
);

const txids = await signSendWait(originChain, attestTxns, origSigner);
console.log(txids);

// Custom impl (playground)
const attestTx = await createAttestation(
  keyPair,
  originChain,
  new SolanaAddress(fartcoin),
  new SolanaAddress(publicKey)
);
