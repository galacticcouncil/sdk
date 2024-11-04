import {
  AnyChain,
  Asset,
  AssetAmount,
  AssetRoute,
  Parachain,
} from '@galacticcouncil/xcm-core';
import { Metadata } from '@galacticcouncil/xcm-sdk';

const SS85_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const H160_ADDRESS = '0x0000000000000000000000000000000000000000';

const isfullAddressSpace = (chain: AnyChain): boolean => {
  return (
    chain instanceof Parachain &&
    chain.isEvmParachain() &&
    chain.usesH160Acc == false
  );
};

const ish160AddressSpaceOnly = (chain: AnyChain): boolean => {
  return (
    (chain instanceof Parachain && chain.usesH160Acc == true) ||
    chain.isEvmChain()
  );
};

export const getAddress = (chain: AnyChain): string => {
  if (isfullAddressSpace(chain)) {
    return SS85_ADDRESS;
  }

  if (ish160AddressSpaceOnly(chain)) {
    return H160_ADDRESS;
  }

  return SS85_ADDRESS;
};

export const getAmount = async (
  amount: number,
  asset: Asset,
  metadata: Metadata
) => {
  const assetDecimals = await metadata.getDecimals(asset);
  const assetAmount = amount * 10 ** assetDecimals;
  return AssetAmount.fromAsset(asset, {
    decimals: assetDecimals,
    amount: BigInt(assetAmount),
  });
};

export const getRouteKey = (chain: AnyChain, route: AssetRoute) => {
  const { source, destination } = route;
  return [chain.key, destination.chain.key, source.asset.key].join('-');
};
