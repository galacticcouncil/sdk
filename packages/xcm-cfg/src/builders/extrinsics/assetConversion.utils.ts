import { TypeRegistry } from '@polkadot/types';

const registry = new TypeRegistry();

export function getAssetLocation(location: any) {
  return registry.createType('MultiLocation', location);
}
