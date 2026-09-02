import { h160 } from '@galacticcouncil/common';
import { AnyChain, Parachain } from '@galacticcouncil/xc-core';

import { chainsMap } from './index';
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
      ).toEqual(['mythos'].sort());
    });
    it('should match given chains with substrate only address space support', async () => {
      expect(
        polkadotChains
          .filter((c) => ss58AddressSpaceOnly(c))
          .map((c) => c.key)
          .sort()
      ).toEqual(
        [
          'assethub',
          'assethub_cex',
          'astar',
          'bifrost',
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

const SS58 = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';
const EVM = '0x72D405a0EC9bc7FD73b9ceA9fb514601f344681f';
const SOLANA = 'GiaSoAk1jEbMr5jEYxXbQKYhWFY7TmxvepcM5DDmuVRH';
const SUI =
  '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf';

const eligible = (address: string, keys: string[]): string[] =>
  keys.filter((key) => chainsMap.get(key)!.isValidAddress(address));

describe('chain address space', () => {
  const keys = [
    'hydration',
    'assethub',
    'polkadot',
    'mythos',
    'ethereum',
    'base',
    'solana',
    'sui',
  ];

  it('should accept ss58 address on substrate chains only', () => {
    expect(eligible(SS58, keys)).toEqual(['hydration', 'assethub', 'polkadot']);
  });

  it('should accept h160 address on evm & h160 native chains only', () => {
    expect(eligible(EVM, keys)).toEqual([
      'hydration',
      'mythos',
      'ethereum',
      'base',
    ]);
  });

  it('should accept solana address on solana chains only', () => {
    expect(eligible(SOLANA, keys)).toEqual(['solana']);
  });

  it('should accept sui address on sui chains only', () => {
    expect(eligible(SUI, keys)).toEqual(['sui']);
  });
});

describe('chain address normalization', () => {
  it('should derive ss58 account from h160 on full address space chain', () => {
    const normalized = chainsMap.get('hydration')!.getNormalizedAddress(EVM);
    expect(normalized).not.toEqual(EVM);
    expect(h160.H160.fromAccount(normalized)).toEqual(EVM.toLowerCase());
  });

  it('should keep ss58 address as is on full address space chain', () => {
    expect(chainsMap.get('hydration')!.getNormalizedAddress(SS58)).toEqual(
      SS58
    );
  });

  it('should keep address as is on single address space chains', () => {
    expect(chainsMap.get('mythos')!.getNormalizedAddress(EVM)).toEqual(EVM);
    expect(chainsMap.get('assethub')!.getNormalizedAddress(SS58)).toEqual(
      SS58
    );
    expect(chainsMap.get('ethereum')!.getNormalizedAddress(EVM)).toEqual(EVM);
    expect(chainsMap.get('base')!.getNormalizedAddress(EVM)).toEqual(EVM);
  });
});
