import { Buffer } from 'buffer';

import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha512 } from '@noble/hashes/sha2';

import slip10 from 'micro-key-producer/slip10.js';

import { Keypair } from '@solana/web3.js';

function normalize(str: string) {
  return (str || '').normalize('NFKD');
}

function salt(password: string) {
  return 'mnemonic' + (password || '');
}

export function mnemonicToSeedSync(mnemonic: string, password: string) {
  const mnemonicBuffer = Uint8Array.from(
    Buffer.from(normalize(mnemonic), 'utf8')
  );
  const saltBuffer = Uint8Array.from(
    Buffer.from(salt(normalize(password)), 'utf8')
  );
  const res = pbkdf2(sha512, mnemonicBuffer, saltBuffer, {
    c: 2048,
    dkLen: 64,
  });
  return Buffer.from(res);
}

export function restoreBip39Mnemonic(
  mnemonic: string,
  password: string
): Keypair {
  const seed = mnemonicToSeedSync(mnemonic, password);
  return Keypair.fromSeed(seed.subarray(0, 32));
}

export function restoreBip44Mnemonic(mnemonic: string, password: string) {
  const seed = mnemonicToSeedSync(mnemonic, password);
  const path = `m/44'/501'/0'/0'`;
  const hd = slip10.fromMasterSeed(seed.toString('hex'));
  return Keypair.fromSeed(hd.derive(path).privateKey);
}
