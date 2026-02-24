import { AnyChain, Parachain } from '@galacticcouncil/xc-core';

import { ed25519CreateDerive } from '@polkadot-labs/hdkd';
import { DEV_MINI_SECRET } from '@polkadot-labs/hdkd-helpers';
import { getPolkadotSigner } from 'polkadot-api/signer';

const H160_ADDRESS = '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac'; // Alith (Moonbeam dev)

const aliceKp = ed25519CreateDerive(DEV_MINI_SECRET)('//Alice');

// Ed25519 Alice SS58 address: 5FA9nQDVg267DEd8m1ZypXLBnvN7SFxYwV7ndqSYGiN9TTpu
const ALICE_ADDRESS = '5FA9nQDVg267DEd8m1ZypXLBnvN7SFxYwV7ndqSYGiN9TTpu';

export const aliceSigner = getPolkadotSigner(
  aliceKp.publicKey,
  'Ed25519',
  aliceKp.sign
);

export const getAddress = (chain: AnyChain): string => {
  if (
    chain instanceof Parachain &&
    chain.isEvmParachain() &&
    chain.usesH160Acc == false
  ) {
    return ALICE_ADDRESS;
  }

  if (
    (chain instanceof Parachain && chain.usesH160Acc == true) ||
    chain.isEvmChain()
  ) {
    return H160_ADDRESS;
  }

  return ALICE_ADDRESS;
};
