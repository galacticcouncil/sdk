import { convertFromH160, convertToH160, isEvmAccount } from './evm';

const ALICE_SS85 = '7KATdGaiYbPauPtFrTfRj7zMM8KHqLbkjfurUnX6F57aHHqq';
const ALITH_H160 = '0x15fdd31c61141abd04a99fd6822c8558854ccde3';

describe('Evm Utils', () => {
  it('Convert Alice to Alith SS85 => H160', () => {
    const result = convertToH160(ALICE_SS85);
    expect(result).toStrictEqual(ALITH_H160);
  });

  it('Convert Alith to Alice H160 => SS85', () => {
    const result = convertFromH160(ALITH_H160);
    expect(result).toStrictEqual(ALICE_SS85);
  });

  it('Should return true for Alice', () => {
    const result = isEvmAccount(ALICE_SS85);
    expect(result).toBeTruthy();
  });
});
