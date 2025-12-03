import { acc, Parachain } from '@galacticcouncil/xc-core';
import { Binary } from 'polkadot-api';

import { getSs58AddressInfo } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

export function getExtrinsicAccount(address: string) {
  const isEthAddress = address.length === 42 && address.startsWith('0x');

  if (isEthAddress) {
    return {
      type: 'AccountKey20',
      value: {
        key: Binary.fromHex(address),
        network: undefined,
      },
    };
  }

  const info = getSs58AddressInfo(address);
  if (!info.isValid) {
    throw new Error(`Invalid SS58 address: ${address}`);
  }

  return {
    type: 'AccountId32',
    value: {
      id: Binary.fromHex(toHex(info.publicKey)),
      network: undefined,
    },
  };
}

export function getDerivativeAccount(
  from: Parachain,
  fromAddress: string,
  to: Parachain
) {
  return acc.getMultilocationDerivatedAccount(
    from.parachainId,
    fromAddress,
    to.parachainId === 0 ? 0 : 1,
    to.usesH160Acc
  );
}
