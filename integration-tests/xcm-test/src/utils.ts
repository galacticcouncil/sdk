import { AnyChain, AssetRoute } from '@galacticcouncil/xcm-core';

import { writeFileSync } from 'fs';

export const getRouteKey = (chain: AnyChain, route: AssetRoute) => {
  const { source, destination } = route;
  return [chain.key, destination.chain.key, source.asset.key].join('-');
};

export const getRouteInfo = (chain: AnyChain, route: AssetRoute) => {
  const { source, destination } = route;
  const transferFrom = chain.name;
  const transferTo = destination.chain.name;
  const transferAsset = source.asset;
  return [
    transferFrom,
    '->',
    transferTo,
    transferAsset.originSymbol,
    `[${transferAsset.key}]`,
  ].join(' ');
};

export const jsonFormatter = (_: any, nestedValue: any) => {
  return typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
};

export const findNestedKey = (obj: any, keyToFind: any) => {
  const foundObj: any[] = [];
  JSON.stringify(obj, (_, nestedValue) => {
    if (nestedValue && nestedValue[keyToFind]) {
      foundObj.push(nestedValue);
    }
    return nestedValue;
  });
  return foundObj[0];
};
