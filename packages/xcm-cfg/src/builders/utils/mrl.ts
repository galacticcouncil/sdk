import { Parachain } from '@galacticcouncil/xcm-core';

import { TypeRegistry, Enum, Struct } from '@polkadot/types';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

const registry = new TypeRegistry();

class VersionedUserAction extends Enum {
  constructor(value: any) {
    super(registry, { V1: XcmRoutingUserAction }, value);
  }
}

class XcmRoutingUserAction extends Struct {
  constructor(value: any) {
    super(registry, { destination: 'VersionedMultiLocation' }, value);
  }
}

export function createPayload(
  parachain: Parachain,
  address: string,
  isEthereumStyle = false
): VersionedUserAction {
  let acc;
  if (isEthereumStyle) {
    acc = address;
  } else {
    const decoded = decodeAddress(address);
    acc = u8aToHex(decoded);
  }

  const multilocation = {
    V5: {
      parents: 1,
      interior: {
        X2: [
          { Parachain: parachain.parachainId },
          isEthereumStyle
            ? { AccountKey20: { key: acc } }
            : { AccountId32: { id: acc } },
        ],
      },
    },
  };

  const versionedMultilocation = registry.createType(
    'VersionedMultiLocation',
    multilocation
  );

  const userAction = new XcmRoutingUserAction({
    destination: versionedMultilocation,
  });
  return new VersionedUserAction({ V1: userAction });
}

export function decodePayload(payloadHex: string) {
  return registry
    .createType('VersionedMultiLocation', payloadHex.replace('0x00', '0x'))
    .toJSON();
}
