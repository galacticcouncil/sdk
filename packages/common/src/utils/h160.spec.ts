import { H160, isEvmAddress } from './h160';

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const ALICE_H160 = '0xd43593c715fdd31c61141abd04a99fd6822c8558';

const ALITH_H160 = '0x15fdd31c61141abd04a99fd6822c8558854ccde3';
const ALITH_SS58 = '7KATdGaiYbPauPtFrTfRj7zMM8KHqLbkjfurUnX6F57aHHqq';

describe('H160 Utils', () => {
  it('Convert Alice (Substrate) SS85 => H160', () => {
    const result = H160.fromSS58(ALICE);
    expect(result).toStrictEqual(ALICE_H160);
  });

  it('Convert Alith (Evm) H160 => SS58', () => {
    const result = H160.toAccount(ALITH_H160);
    expect(result).toStrictEqual(ALITH_SS58);
  });

  it('Convert Alith (Evm) SS58 => H160', () => {
    const result = H160.fromAccount(ALITH_SS58);
    expect(result).toStrictEqual(ALITH_H160);
  });

  it('is ALICE_H160 valid h160', () => {
    const result = isEvmAddress(ALICE_H160);
    expect(result).toStrictEqual(true);
  });

  it('is ALITH_H160 valid h160', () => {
    const result = isEvmAddress(ALITH_H160);
    expect(result).toStrictEqual(true);
  });

  it('is ALITH_SS58 not valid h160', () => {
    const result = isEvmAddress(ALITH_SS58);
    expect(result).toStrictEqual(false);
  });

  describe('fromAny', () => {
    it('keeps an EVM address as is', () => {
      expect(H160.fromAny(ALITH_H160)).toStrictEqual(ALITH_H160);
    });

    it('unwraps an ETH-prefixed account to its EVM address', () => {
      expect(H160.fromAny(ALITH_SS58)).toStrictEqual(ALITH_H160);
    });

    it('truncates a plain substrate account to its first 20 bytes', () => {
      expect(H160.fromAny(ALICE)).toStrictEqual(ALICE_H160);
    });

    it('rejects anything else', () => {
      expect(() => H160.fromAny('not-an-address')).toThrow();
    });
  });
});
