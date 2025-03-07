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

  describe('getMultilocationDerivatedAccount', () => {
    it('should get correct ChildChain addresses for hydration (to Relay)', async () => {
      expect(
        getMultilocationDerivatedAccount(
          2034,
          '7Lh1DEaxk8TNVU7snC3UkSv7N7NHb7BUuEkYZBwrzfrPNQE3',
          0
        )
      ).toStrictEqual('5FhDbKUGUp7xofuc5NaJ93ytaJM1kDs7ZafaLtkTXFnB5FFQ');
    });

    it('should get correct SiblingChain addresses for hydration (to Para)', async () => {
      expect(
        getMultilocationDerivatedAccount(
          2034,
          '7Lh1DEaxk8TNVU7snC3UkSv7N7NHb7BUuEkYZBwrzfrPNQE3',
          1
        )
      ).toStrictEqual('5EjgcaN2F3J3vH5wR52Gitzu3HimYbKU81SaRLWDMs58FrQJ');
    });

    it('should get correct SiblingChain addresses for hydration (to Para), h160 style', async () => {
      expect(
        getMultilocationDerivatedAccount(
          2034,
          '7Lh1DEaxk8TNVU7snC3UkSv7N7NHb7BUuEkYZBwrzfrPNQE3',
          1,
          true
        )
      ).toStrictEqual('0x7632da7afff71e425b32cd610f55c7fdd45a90c3');
    });

    it('should get correct ParentChain addresses', async () => {
      expect(
        getMultilocationDerivatedAccount(
          undefined,
          '7Lh1DEaxk8TNVU7snC3UkSv7N7NHb7BUuEkYZBwrzfrPNQE3',
          1
        )
      ).toStrictEqual('5FuA1PnyhuvePvbFxCAnYhrYCEg8QcWEXaajZhjMKMZpLsCJ');
    });
  });
});
