import {
  getSovereignAccounts,
  getMultilocationDerivatedAccount,
} from './account';

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

  // describe('getMultilocationDerivatedAccount', () => {
  //   it('should get correct ChildChain addresses', async () => {
  //     expect(
  //       getMultilocationDerivatedAccount(
  //         0,
  //         '7Lh1DEaxk8TNVU7snC3UkSv7N7NHb7BUuEkYZBwrzfrPNQE3',
  //         0
  //       )
  //     ).toStrictEqual('5DbFqm1UFuYMDNoT9MJb3cT6YUVk814tbcegLrpxVFgS8T5r');
  //   });

  //   it('should get correct SiblingChain addresses', async () => {
  //     expect(
  //       getMultilocationDerivatedAccount(
  //         0,
  //         '7Lh1DEaxk8TNVU7snC3UkSv7N7NHb7BUuEkYZBwrzfrPNQE3',
  //         1
  //       )
  //     ).toStrictEqual('5FuA1PnyhuvePvbFxCAnYhrYCEg8QcWEXaajZhjMKMZpLsCJ');
  //   });

  //   it('should get correct ParentChain addresses', async () => {
  //     expect(
  //       getMultilocationDerivatedAccount(
  //         0,
  //         '7Lh1DEaxk8TNVU7snC3UkSv7N7NHb7BUuEkYZBwrzfrPNQE3',
  //         1
  //       )
  //     ).toStrictEqual('5FuA1PnyhuvePvbFxCAnYhrYCEg8QcWEXaajZhjMKMZpLsCJ');
  //   });
  // });
});
