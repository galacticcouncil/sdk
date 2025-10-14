import { getAccountAddress } from './utils';

describe('staking utils', () => {
  it('should return correct address from seed', async () => {
    const result = getAccountAddress('0x7374616b696e6723');
    console.log(result);
    expect(result).toStrictEqual(
      '7L53bUSxyzrEVzb8VaVtehMs5DpWZ8UyydQHRB3xDq6GwwtF'
    );
  });
});
