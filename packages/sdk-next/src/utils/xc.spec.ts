import { convertToId } from './xc';

describe('Xc Utils', () => {
  it('Convert Xc address should result in 10', () => {
    const result = convertToId('0x000000000000000000000000000000010000000A');
    expect(result).toStrictEqual(10);
  });
});
