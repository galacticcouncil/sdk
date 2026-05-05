import { acc } from '@galacticcouncil/common';
import { Parachain } from '@galacticcouncil/xc-core';
import { XcmV3Junction } from '@galacticcouncil/descriptors';

import { SizedHex } from 'polkadot-api';

import { getSs58AddressInfo } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

export function getExtrinsicAccount(address: string) {
  const isEthAddress = address.length === 42 && address.startsWith('0x');

  if (isEthAddress) {
    return XcmV3Junction.AccountKey20({
      key: address as SizedHex<20>,
      network: undefined,
    });
  }

  const info = getSs58AddressInfo(address);
  if (!info.isValid) {
    throw new Error(`Invalid SS58 address: ${address}`);
  }

  return XcmV3Junction.AccountId32({
    id: toHex(info.publicKey) as SizedHex<32>,
    network: undefined,
  });
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
