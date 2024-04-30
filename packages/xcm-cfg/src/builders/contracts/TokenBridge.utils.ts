import { Parachain } from '@galacticcouncil/xcm-core';
import { TypeRegistry, Enum, Struct } from '@polkadot/types';

// Creates a type registry to properly work with the precompile's input types
const registry = new TypeRegistry();

// Define the precompile's input types VersionedUserAction and XcmRoutingUserAction
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

export function createMRLPayload(
  parachain: Parachain,
  account: string,
  isEthereumStyle = false
): VersionedUserAction {
  const versionedMultiLocation = {
    v1: {
      parents: 1,
      interior: {
        X2: [
          { Parachain: parachain.parachainId },
          isEthereumStyle
            ? { AccountKey20: { key: account } }
            : { AccountId32: { id: account } },
        ],
      },
    },
  };

  const destination = registry.createType(
    'VersionedMultiLocation',
    versionedMultiLocation
  );

  const userAction = new XcmRoutingUserAction({ destination });
  return new VersionedUserAction({ V1: userAction });
}
