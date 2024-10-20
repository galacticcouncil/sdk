import { AnyChain, ChainEcosystem, Parachain } from '@galacticcouncil/xcm-core';

import { chains } from './chains';

const fullAddressSpace = (chain: AnyChain): boolean => {
  return (
    chain instanceof Parachain &&
    chain.isEvmParachain() &&
    chain.usesH160Acc == false
  );
};

const h160AddressSpaceOnly = (chain: AnyChain): boolean => {
  return (
    (chain instanceof Parachain && chain.usesH160Acc == true) ||
    chain.isEvmChain()
  );
};

const ss58AddressSpaceOnly = (chain: AnyChain): boolean => {
  return (
    chain instanceof Parachain &&
    chain.isParachain() &&
    chain.usesH160Acc == false
  );
};

describe('chains config', () => {
  describe('check address space support in polkadot ecosystem', () => {
    it('should match given chains with both evm & substrate address space support', async () => {
      expect(
        chains
          .filter((c) => c.ecosystem === ChainEcosystem.Polkadot)
          .filter((c) => fullAddressSpace(c))
          .map((c) => c.key)
          .sort()
      ).toEqual(['acala', 'hydration'].sort());
    });
    it('should match given chains with evm only address space support', async () => {
      expect(
        chains
          .filter((c) => c.ecosystem === ChainEcosystem.Polkadot)
          .filter((c) => h160AddressSpaceOnly(c))
          .map((c) => c.key)
          .sort()
      ).toEqual(['acala-evm', 'darwinia', 'moonbeam', 'mythos'].sort());
    });
    it('should match given chains with substrate only address space support', async () => {
      expect(
        chains
          .filter((c) => c.ecosystem === ChainEcosystem.Polkadot)
          .filter((c) => ss58AddressSpaceOnly(c))
          .map((c) => c.key)
          .sort()
      ).toEqual(
        [
          'ajuna',
          'assethub',
          'astar',
          'bifrost',
          'centrifuge',
          'crust',
          'interlay',
          'kilt',
          'nodle',
          'pendulum',
          'phala',
          'polkadot',
          'subsocial',
          'unique',
          'zeitgeist',
        ].sort()
      );
    });
  });
});
