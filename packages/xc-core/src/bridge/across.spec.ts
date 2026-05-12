import { Across } from './across';

// Tests at the primitive level avoid importing EvmChain (which transitively
// imports @galacticcouncil/common and requires a workspace build to typecheck).
// Snowfork-published mainnet addresses; see Snowbridge polkadot_mainnet_bridge_info.g.ts.
const baseLikeChain = {
  name: 'base',
  across: new Across({
    spokePool: '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64',
    multicallHandler: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
    snowbridgeL2Adaptor: '0x07fe4e7340976fc873b74bafe3c3e5b0e01f3665',
  }),
};

const ethereumLikeChain = {
  name: 'ethereum',
  across: new Across({
    spokePool: '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5',
    multicallHandler: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
    snowbridgeL1Adaptor: '0xd3b11c36404b092645522b682832fcdee07d2668',
  }),
};

const bareChain = { name: 'optimism' };

describe('Across bridge primitive', () => {
  describe('constructor + getters', () => {
    it('exposes provided addresses through typed getters', () => {
      const across = new Across({
        spokePool: '0xspoke',
        multicallHandler: '0xmulti',
        snowbridgeL2Adaptor: '0xl2',
      });
      expect(across.getSpokePool()).toBe('0xspoke');
      expect(across.getMulticallHandler()).toBe('0xmulti');
      expect(across.getSnowbridgeL2Adaptor()).toBe('0xl2');
      expect(across.getSnowbridgeL1Adaptor()).toBeUndefined();
    });

    it('leaves optional adaptor fields undefined when unset', () => {
      const across = new Across({
        spokePool: '0xspoke',
        multicallHandler: '0xmulti',
      });
      expect(across.getSnowbridgeL2Adaptor()).toBeUndefined();
      expect(across.getSnowbridgeL1Adaptor()).toBeUndefined();
    });
  });

  describe('fromChain', () => {
    it('returns the Across instance attached to an L2 chain', () => {
      const across = Across.fromChain(baseLikeChain as never);
      expect(across).toBeInstanceOf(Across);
      expect(across.getSpokePool()).toBe(
        '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64'
      );
      expect(across.getSnowbridgeL2Adaptor()).toBe(
        '0x07fe4e7340976fc873b74bafe3c3e5b0e01f3665'
      );
      expect(across.getSnowbridgeL1Adaptor()).toBeUndefined();
    });

    it('returns the Across instance attached to Ethereum with L1 adaptor', () => {
      const across = Across.fromChain(ethereumLikeChain as never);
      expect(across.getSnowbridgeL1Adaptor()).toBe(
        '0xd3b11c36404b092645522b682832fcdee07d2668'
      );
      expect(across.getSnowbridgeL2Adaptor()).toBeUndefined();
    });

    it('throws with the chain name when Across is not configured', () => {
      expect(() => Across.fromChain(bareChain as never)).toThrow(
        'optimism is not supported in Across.'
      );
    });
  });

  describe('isKnown', () => {
    it('returns true when across is attached', () => {
      expect(Across.isKnown(baseLikeChain as never)).toBe(true);
    });

    it('returns false when across is missing', () => {
      expect(Across.isKnown(bareChain as never)).toBe(false);
    });
  });
});
