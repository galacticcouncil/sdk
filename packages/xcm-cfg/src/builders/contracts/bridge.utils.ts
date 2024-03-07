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
  parachainId: number,
  account: string,
  isEthereumStyle = false
) {
  // Create a multilocation object based on the target parachain's account type
  const versionedMultiLocation = {
    v1: {
      parents: 1,
      interior: {
        X2: [
          { Parachain: parachainId },
          isEthereumStyle
            ? { AccountKey20: { key: account } }
            : { AccountId32: { id: account } },
        ],
      },
    },
  };

  // Format multilocation object as a Polkadot.js type
  const destination = registry.createType(
    'VersionedMultiLocation',
    versionedMultiLocation
  );

  // Wrap and format the MultiLocation object into the precompile's input type
  const userAction = new XcmRoutingUserAction({ destination });
  const versionedUserAction = new VersionedUserAction({ V1: userAction });

  // SCALE encode resultant precompile formatted objects
  return versionedUserAction.toHex();
}
