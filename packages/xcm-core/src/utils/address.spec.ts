import { getPubKey, isSolana, isSui } from './address';

describe('Address utils', () => {
  describe('getPubKey', () => {
    it('should get public key hex for ss58 address', async () => {
      expect(
        getPubKey('5Gn12Tq1ndABBJrym2uzNoeGRcBgTRRSviLnSajVxqka4mfX')
      ).toStrictEqual(
        '0xd06fca7ce18f3e9b217576e70c28529dc0b1bb71ae2c53bfdce054deada1ef6a'
      );
    });
  });
  describe('isSolana', () => {
    it('should return true for valid solana base58 address', async () => {
      expect(
        isSolana('AQHqDkgchJaSQHPMDj6BMFH9riTqbHjzEBWwUbAh8Fbq')
      ).toBeTruthy();
    });
  });
  describe('isSui', () => {
    it('should return true for valid sui address', async () => {
      expect(
        isSui(
          '0xd06fca7ce18f3e9b217576e70c28529dc0b1bb71ae2c53bfdce054deada1ef6a'
        )
      ).toBeTruthy();
    });
  });
});
