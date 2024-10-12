import { getSovereignAccounts } from './account';

describe('Address utils', () => {
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

    it('should get correct addresses for paraId 3019', async () => {
      expect(getSovereignAccounts(3019)).toStrictEqual({
        generic:
          '0x7369626ccb0b0000000000000000000000000000000000000000000000000000',
        moonbeam: '0x7369626ccb0b0000000000000000000000000000',
        relay:
          '0x70617261cb0b0000000000000000000000000000000000000000000000000000',
      });
    });
  });
});
