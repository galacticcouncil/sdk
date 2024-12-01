import { AnyChain, Parachain } from '@galacticcouncil/xcm-core';

const SS85_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
const H160_ADDRESS = '0x0000000000000000000000000000000000000000'; // Evm default

const isFullAddressSpace = (chain: AnyChain): boolean => {
  return (
    chain instanceof Parachain &&
    chain.isEvmParachain() &&
    chain.usesH160Acc == false
  );
};

const isH160AddressSpaceOnly = (chain: AnyChain): boolean => {
  return (
    (chain instanceof Parachain && chain.usesH160Acc == true) ||
    chain.isEvmChain()
  );
};

export const getAddress = (chain: AnyChain): string => {
  if (isFullAddressSpace(chain)) {
    return SS85_ADDRESS;
  }

  if (isH160AddressSpaceOnly(chain)) {
    return H160_ADDRESS;
  }

  return SS85_ADDRESS;
};
