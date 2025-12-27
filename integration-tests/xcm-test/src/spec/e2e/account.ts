import { Parachain } from '@galacticcouncil/xcm-core';

import { Keyring, createTestKeyring } from '@polkadot/keyring';

import * as c from 'console';

/* const keyringEth = createTestKeyring({
  type: 'ethereum',
}); */

const keyringEth = new Keyring({ type: 'ethereum' });

const keyring = new Keyring({
  type: 'ed25519',
});

const alice = keyring.addFromUri('//Alice');
const alith = keyringEth.addFromUri(
  '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133'
);

export const getAccount = (chain: Parachain) => {
  return chain.usesH160Acc ? alith : alice;
};
