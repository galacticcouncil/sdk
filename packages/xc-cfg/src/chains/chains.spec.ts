import { AnyChain, Parachain } from '@galacticcouncil/xc-core';

import { polkadotChains } from './polkadot';

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
    chain.usesH160Acc == false &&
    chain.usesCexForwarding == false
  );
};

describe('chains config', () => {
  describe('check address space support in polkadot ecosystem', () => {
    it('should match given chains with both evm & substrate address space support', async () => {
      expect(
        polkadotChains
          .filter((c) => fullAddressSpace(c))
          .map((c) => c.key)
          .sort()
      ).toEqual(['hydration']);
    });
    it('should match given chains with evm only address space support', async () => {
      expect(
        polkadotChains
          .filter((c) => h160AddressSpaceOnly(c))
          .map((c) => c.key)
          .sort()
      ).toEqual(['laos', 'moonbeam', 'mythos'].sort());
    });
    it('should match given chains with substrate only address space support', async () => {
      expect(
        polkadotChains
          .filter((c) => ss58AddressSpaceOnly(c))
          .map((c) => c.key)
          .sort()
      ).toEqual(
        [
          'ajuna',
          'assethub',
          'assethub_cex',
          'astar',
          'bifrost',
          'crust',
          'interlay',
          'neuroweb',
          'pendulum',
          'polkadot',
          'unique',
          'energywebx',
        ].sort()
      );
    });
  });
});
