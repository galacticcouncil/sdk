import { XcmV3Junctions } from '@polkadot-api/descriptors';

export type XcmV3Multilocation = {
  parents: number;
  interior: XcmV3Junctions;
};
