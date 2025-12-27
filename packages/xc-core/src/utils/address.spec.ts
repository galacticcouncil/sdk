import { Ss58Addr, SolanaAddr, EvmAddr, SuiAddr } from './address';

describe('Address utils', () => {
  describe('getPubKey', () => {
    it('should get public key hex for ss58 address', async () => {
      expect(
        Ss58Addr.getPubKey('5Gn12Tq1ndABBJrym2uzNoeGRcBgTRRSviLnSajVxqka4mfX')
      ).toStrictEqual(
        '0xd06fca7ce18f3e9b217576e70c28529dc0b1bb71ae2c53bfdce054deada1ef6a'
      );
    });
  });
  describe('isSS58', () => {
    it('should return true for valid ss58 address', async () => {
      expect(
        Ss58Addr.isValid('5Gn12Tq1ndABBJrym2uzNoeGRcBgTRRSviLnSajVxqka4mfX')
      ).toBeTruthy();
    });
    it('should return false for sui address', async () => {
      expect(
        Ss58Addr.isValid(
          '0xd06fca7ce18f3e9b217576e70c28529dc0b1bb71ae2c53bfdce054deada1ef6a'
        )
      ).toBeFalsy();
    });
  });
  describe('isEvm', () => {
    it('should return true for valid h160 address', async () => {
      expect(
        EvmAddr.isValid('0x15fdd31c61141abd04a99fd6822c8558854ccde3')
      ).toBeTruthy();
    });
  });
  describe('isSolana', () => {
    it('should return true for valid solana base58 address', async () => {
      expect(
        SolanaAddr.isValid('AQHqDkgchJaSQHPMDj6BMFH9riTqbHjzEBWwUbAh8Fbq')
      ).toBeTruthy();
    });
  });
  describe('isSui', () => {
    it('should return true for valid sui address', async () => {
      expect(
        SuiAddr.isValid(
          '0xd06fca7ce18f3e9b217576e70c28529dc0b1bb71ae2c53bfdce054deada1ef6a'
        )
      ).toBeTruthy();
    });
  });
});
