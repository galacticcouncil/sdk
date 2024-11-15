import { AnyChain, AssetRoute } from '@galacticcouncil/xcm-core';

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

export const jsonFromatter = (_: any, nestedValue: any) => {
  return typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
};
