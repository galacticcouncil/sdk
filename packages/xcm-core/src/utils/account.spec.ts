import { getSovereignAccounts } from './account';

describe('Account utils', () => {
  describe('getSovereignAccountAddresses', () => {
    it('should get correct addresses for paraId 1000', async () => {
      expect(getSovereignAccounts(1000)).toStrictEqual({
        generic:
          '0x7369626ce8030000000000000000000000000000000000000000000000000000',
        moonbeam: '0x7369626ce8030000000000000000000000000000',
        relay:
          '0x70617261e8030000000000000000000000000000000000000000000000000000',
      });
    });

    it('should get correct addresses for paraId 2034', async () => {
      expect(getSovereignAccounts(2034)).toStrictEqual({
        generic:
          '0x7369626cf2070000000000000000000000000000000000000000000000000000',
        moonbeam: '0x7369626cf2070000000000000000000000000000',
        relay:
          '0x70617261f2070000000000000000000000000000000000000000000000000000',
      });
    });
  });
});
