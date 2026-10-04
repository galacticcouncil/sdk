import { base58 } from '@scure/base';

import { encodeTransaction, NearKeyPair, signTransaction } from './utils';

/**
 * Golden vector - the same transaction encoded & signed by near-api-js, whose
 * serializer the protocol reference clients share.
 */
const SECRET_KEY =
  'ed25519:2Ana1pUpv2ZbMVkwF5FXapYeBEjdxDatLn7nvJkhgTSdZd8hbDHTd21as7EAsg7ypityqfsw2pMQKJcVDVcAEsd';
const PUBLIC_KEY = 'ed25519:9C6hybhQ6Aycep9jaUnP6uL9ZYvDjUp1aSkFWPUFJtpj';
const BLOCK_HASH = '5wbD6GsVBReHetMUw17QcNne8BjB1xSKRoU4JYpafEx5';
const TX_HASH = '6vRtM1nmaQyL5H1ZhkvCSmutmYePTTQYAnTzGsqcVm2Y';

const ENCODED = [
  '0d000000616c6963652e746573746e65740079b5562e8fe654f94078b112e8a9',
  '8ba7901f853ae695bed7e0e3910bad0496642a000000000000000c0000007772',
  '61702e746573746e6574496aca80e4d8f29fb8e8cd816c3afb48d3f103970b3a',
  '2ee1600c08ca67326dee03000000020f00000073746f726167655f6465706f73',
  '69741a0000007b22726567697374726174696f6e5f6f6e6c79223a747275657d',
  '00a0724e180900000000485637193cc34300000000000000020c0000006e6561',
  '725f6465706f736974020000007b7d00a0724e18090000000000a1edccce1bc2',
  'd3000000000000021000000066745f7472616e736665725f63616c6ccc000000',
  '7b2272656365697665725f6964223a226e74742d6e6561722e77686d2d6e7474',
  '2d3062756764632e746573746e6574222c22616d6f756e74223a223130303030',
  '3030303030303030303030303030303030303030222c226d7367223a227b5c22',
  '726563697069656e745f636861696e5c223a37332c5c22726563697069656e74',
  '5c223a5c22307830303030303030303030303030303030303030303030303064',
  '3864613662663236393634616639643765656439653033653533343135643337',
  '616139363034355c227d227d0060b7986c880000010000000000000000000000',
  '00000000',
].join('');

/** Key type, then the 64 byte signature, appended to the transaction. */
const SIGNATURE =
  '00' +
  '693d4dc03227df6f2f3655d3f03a1f9f962c12c3ce7fdb0667fe4f87a9cd6e39' +
  'caae3161e78a2f4e656e51ca4a7aea66f626958d2d0a4327ef0888e16b0f9100';

const MSG = JSON.stringify({
  recipient_chain: 73,
  recipient:
    '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
});

const buildTx = (keyPair: NearKeyPair) => ({
  signerId: 'alice.testnet',
  publicKey: keyPair.publicKey,
  nonce: 42n,
  receiverId: 'wrap.testnet',
  blockHash: base58.decode(BLOCK_HASH),
  actions: [
    {
      methodName: 'storage_deposit',
      args: { registration_only: true },
      gas: 10_000_000_000_000n,
      deposit: 1_250_000_000_000_000_000_000n,
    },
    {
      methodName: 'near_deposit',
      args: {},
      gas: 10_000_000_000_000n,
      deposit: 1_000_000_000_000_000_000_000_000n,
    },
    {
      methodName: 'ft_transfer_call',
      args: {
        receiver_id: 'ntt-near.whm-ntt-0bugdc.testnet',
        amount: '1000000000000000000000000',
        msg: MSG,
      },
      gas: 150_000_000_000_000n,
      deposit: 1n,
    },
  ],
});

const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

describe('near transaction', () => {
  const keyPair = NearKeyPair.fromSecretKey(SECRET_KEY);

  it('should derive the public key of a 64 byte secret key', () => {
    expect(keyPair.getPublicKey()).toBe(PUBLIC_KEY);
  });

  it('should read a bare 32 byte seed as the same key', () => {
    const seed = base58.decode(SECRET_KEY.split(':')[1]).subarray(0, 32);
    const fromSeed = NearKeyPair.fromSecretKey(
      'ed25519:' + base58.encode(seed)
    );
    expect(fromSeed.getPublicKey()).toBe(PUBLIC_KEY);
  });

  it('should reject a secret key whose public half does not match', () => {
    const bytes = base58.decode(SECRET_KEY.split(':')[1]);
    bytes[63] ^= 1;
    expect(() =>
      NearKeyPair.fromSecretKey('ed25519:' + base58.encode(bytes))
    ).toThrow('does not match');
  });

  it('should reject a key on another curve', () => {
    expect(() => NearKeyPair.fromSecretKey('secp256k1:abc')).toThrow('ed25519');
  });

  it('should borsh encode function calls byte for byte', () => {
    expect(toHex(encodeTransaction(buildTx(keyPair)))).toBe(ENCODED);
  });

  it('should hash & sign the encoded transaction', () => {
    const { hash, signedTx } = signTransaction(buildTx(keyPair), keyPair);
    expect(hash).toBe(TX_HASH);
    expect(toHex(signedTx)).toBe(ENCODED + SIGNATURE);
  });
});
