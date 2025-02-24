import { convertToId } from './erc20';

describe('Erc20 Utils', () => {
  it('Convert Erc20 should result in 10', () => {
    const result = convertToId('000000000000000000000000000000010000000A');
    expect(result).toStrictEqual(10);
  });
});
