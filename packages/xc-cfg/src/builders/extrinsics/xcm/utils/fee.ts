import { multiloc } from '@galacticcouncil/xc-core';

export function shouldFeeAssetPrecede(
  transferAssetLocation: any,
  transferFeeLocation: any
) {
  const assetGeneralIndex = multiloc.findNestedKey(
    transferAssetLocation,
    'GeneralIndex'
  );

  const feeGeneralIndex = multiloc.findNestedKey(
    transferFeeLocation,
    'GeneralIndex'
  );

  const assetIndex = assetGeneralIndex && assetGeneralIndex['GeneralIndex'];
  const feeIndex = feeGeneralIndex && feeGeneralIndex['GeneralIndex'];

  if (Number.isNaN(assetIndex) || Number.isNaN(feeIndex)) {
    return false;
  }

  return Number(assetIndex) > Number(feeIndex);
}

// Junction variant order of the XCM `Junction` enum - the derived Ord in the
// runtime compares variant index first, so canonical asset sorting must too.
const JUNCTION_ORDER = [
  'Parachain',
  'AccountId32',
  'AccountIndex64',
  'AccountKey20',
  'PalletInstance',
  'GeneralIndex',
  'GeneralKey',
  'OnlyChild',
  'Plurality',
  'GlobalConsensus',
];

function toJunctionArray(interiorValue: any): any[] {
  return Array.isArray(interiorValue) ? interiorValue : [interiorValue];
}

function compareJunction(a: any, b: any): number {
  const aKey = Object.keys(a)[0];
  const bKey = Object.keys(b)[0];
  const rank = JUNCTION_ORDER.indexOf(aKey) - JUNCTION_ORDER.indexOf(bKey);
  if (rank !== 0) {
    return rank;
  }
  const aVal = a[aKey];
  const bVal = b[bKey];
  if (typeof aVal === 'number' || typeof bVal === 'number') {
    return Number(aVal) - Number(bVal);
  }
  const aStr = JSON.stringify(aVal);
  const bStr = JSON.stringify(bVal);
  return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
}

/**
 * Canonical XCM `Location` ordering (mirrors the runtime's derived Ord):
 * parents first, then interior arity, then junction by junction. The runtime
 * rejects (fails to decode) any `Assets` vector that is not sorted with this
 * ordering, so multi-asset transfers must order fee/asset accordingly.
 */
export function compareLocations(a: any, b: any): number {
  const parents = Number(a.parents ?? 0) - Number(b.parents ?? 0);
  if (parents !== 0) {
    return parents;
  }

  const aInterior = a.interior ?? 'Here';
  const bInterior = b.interior ?? 'Here';
  const aHere = aInterior === 'Here' || aInterior.Here !== undefined;
  const bHere = bInterior === 'Here' || bInterior.Here !== undefined;
  if (aHere || bHere) {
    return Number(bHere) - Number(aHere) === 0 ? 0 : aHere ? -1 : 1;
  }

  const aJunctions = toJunctionArray(Object.values(aInterior)[0]);
  const bJunctions = toJunctionArray(Object.values(bInterior)[0]);
  if (aJunctions.length !== bJunctions.length) {
    return aJunctions.length - bJunctions.length;
  }

  for (let i = 0; i < aJunctions.length; i++) {
    const cmp = compareJunction(aJunctions[i], bJunctions[i]);
    if (cmp !== 0) {
      return cmp;
    }
  }
  return 0;
}
