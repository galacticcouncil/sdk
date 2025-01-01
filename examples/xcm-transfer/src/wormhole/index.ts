import {
  ChainAddress,
  TokenTransfer,
  Wormhole,
} from '@wormhole-foundation/sdk-connect';
import { encoding, amount } from '@wormhole-foundation/sdk-base';

import { restoreBip44Mnemonic } from './utils';
import { loadProtocols, evm, solana } from './setup';
import { getSigner } from './signer';
import { Buffer } from 'buffer';

await loadProtocols(evm);
await loadProtocols(solana);

// @ts-ignore
window.Buffer = Buffer;

const wh = new Wormhole('Mainnet', [evm.Platform, solana.Platform], {
  chains: {
    Ethereum: {
      rpc: 'https://ethereum-rpc.publicnode.com',
    },
    Solana: {
      rpc: 'https://solana-mainnet.g.alchemy.com/v2',
    },
  },
});

const amt = '0.01';

const ctxChain = wh.getChain('Solana');
const rcvChain = wh.getChain('Moonbeam');

const token = Wormhole.tokenId(ctxChain.chain, 'native');
const decimals = ctxChain.config.nativeTokenDecimals;

const senderAddress: ChainAddress = Wormhole.chainAddress('Solana', '');

const receiverAddress: ChainAddress = Wormhole.chainAddress('Moonbeam', '');

const transfer = await wh.tokenTransfer(
  token,
  amount.units(amount.parse(amt, decimals)),
  senderAddress,
  receiverAddress,
  false
);

const quote = await TokenTransfer.quoteTransfer(
  wh,
  ctxChain,
  rcvChain,
  transfer.transfer
);

console.log(quote);
console.log(transfer);

const mnemonic = '';
const keyPair = restoreBip44Mnemonic(mnemonic, '');
const publicKey = keyPair.publicKey.toBase58();
const privateKey = encoding.b58.encode(keyPair.secretKey);

console.log(`Public key: ${publicKey}`);
console.log(`Private key: ${privateKey}`);

const signer = await getSigner(ctxChain, privateKey);

console.log('Starting transfer');
const srcTxids = await transfer.initiateTransfer(signer.signer);
console.log(`Started transfer: `, srcTxids);
