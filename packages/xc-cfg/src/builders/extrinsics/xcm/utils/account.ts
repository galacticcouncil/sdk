import { acc, Parachain } from '@galacticcouncil/xc-core';
import { FixedSizeBinary } from 'polkadot-api';
import { XcmV3Junction } from '@galacticcouncil/descriptors';

import { getSs58AddressInfo } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

export function getExtrinsicAccount(address: string) {
  const isEthAddress = address.length === 42 && address.startsWith('0x');

  if (isEthAddress) {
    return XcmV3Junction.AccountKey20({
      key: FixedSizeBinary.fromHex(address),
      network: undefined,
    });
  }

  const info = getSs58AddressInfo(address);
  if (!info.isValid) {
    throw new Error(`Invalid SS58 address: ${address}`);
  }

  return XcmV3Junction.AccountId32({
    id: FixedSizeBinary.fromHex(toHex(info.publicKey)),
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
