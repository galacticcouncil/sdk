import { AnyChain, Parachain } from '@galacticcouncil/xcm-core';

const SS85_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
const H160_ADDRESS = '0x0000000000000000000000000000000000000000'; // Evm default
const BASE58_ADDRESS = 'ETnqC8mvPRyUVXyXoph22EQ1GS5sTs1zndkn5eGMYWfs'; // Solana default

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

const isSolanaAddressSpaceOnly = (chain: AnyChain): boolean => {
  return chain.isSolana();
};

export const getAddress = (chain: AnyChain): string => {
  if (isFullAddressSpace(chain)) {
    return SS85_ADDRESS;
  }

  if (isH160AddressSpaceOnly(chain)) {
    return H160_ADDRESS;
  }

  if (isSolanaAddressSpaceOnly(chain)) {
    return BASE58_ADDRESS;
  }

  return SS85_ADDRESS;
};
