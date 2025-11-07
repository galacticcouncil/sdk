import { acc, Parachain } from '@galacticcouncil/xcm-core';

import { getSs58AddressInfo } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

export function getExtrinsicAccount(address: string) {
  const isEthAddress = address.length === 42 && address.startsWith('0x');

  if (isEthAddress) {
    return {
      AccountKey20: {
        key: address,
      },
    };
  }

  const info = getSs58AddressInfo(address);
  if (!info.isValid) {
    throw new Error(`Invalid SS58 address: ${address}`);
  }

  return {
    AccountId32: {
      id: toHex(info.publicKey),
      network: null,
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
