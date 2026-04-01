import { ContractConfigBuilderParams } from '@galacticcouncil/xc-core';

import { eurc } from '../../assets';
import { base, hydration } from '../../chains';

import { Basejump } from './Basejump';

const buildCtx = (address: string) => {
  return {
    address,
    amount: 1000000n,
    asset: eurc,
    sender: '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0',
    source: { chain: base },
    destination: { chain: hydration },
  } as ContractConfigBuilderParams;
};

describe('Basejump contract builder', () => {
  describe('bridgeViaWormhole', () => {
    it('should encode EVM H160 address with ETH\\0 prefix', async () => {
      const h160 = '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0';
      const ctx = buildCtx(h160);
      const config = await Basejump().bridgeViaWormhole().build(ctx);

      const recipient = config.args[2] as string;
      // ETH\0 = 0x45544800, then H160 lowercase, then 16 zero hex chars
      expect(recipient.toLowerCase()).toBe(
        '0x45544800' +
          '71feb8b2849101a6e62e3369eaafdc6154cd0bc0' +
          '0000000000000000'
      );
    });

    it('should encode SS58 EVM account with ETH\\0 prefix', async () => {
      // This SS58 address is the Hydration mapping of 0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0
      const { h160 } = await import('@galacticcouncil/common');
      const ss58 = h160.H160.toAccount('0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0');
      const ctx = buildCtx(ss58);
      const config = await Basejump().bridgeViaWormhole().build(ctx);

      const recipient = config.args[2] as string;
      expect(recipient.toLowerCase()).toBe(
        '0x45544800' +
          '71feb8b2849101a6e62e3369eaafdc6154cd0bc0' +
          '0000000000000000'
      );
    });

    it('should encode native SS58 substrate account as raw AccountId32', async () => {
      // Alice's well-known AccountId32
      const alice = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const ctx = buildCtx(alice);
      const config = await Basejump().bridgeViaWormhole().build(ctx);

      const recipient = config.args[2] as string;
      // Alice's raw AccountId32
      expect(recipient.toLowerCase()).toBe(
        '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
      );
    });

    it('should produce correct contract config', async () => {
      const ctx = buildCtx('0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0');
      const config = await Basejump().bridgeViaWormhole().build(ctx);

      expect(config.func).toBe('bridgeViaWormhole');
      expect(config.module).toBe('Basejump');
      expect(config.args).toHaveLength(3);
    });
  });
});
