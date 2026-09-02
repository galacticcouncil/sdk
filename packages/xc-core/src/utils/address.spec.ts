import {
  Ss58Addr,
  SolanaAddr,
  EvmAddr,
  SuiAddr,
  NearAddr,
  ZecAddr,
} from './address';

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
  describe('isNear', () => {
    it('should return true for named accounts', async () => {
      expect(NearAddr.isValid('alice.near')).toBeTruthy();
      expect(NearAddr.isValid('wrap.near')).toBeTruthy();
      expect(NearAddr.isValid('a-b_c.sub.alice.near')).toBeTruthy();
      // a top-level suffix is not required
      expect(NearAddr.isValid('alice')).toBeTruthy();
    });
    it('should return true for implicit accounts', async () => {
      const implicit =
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      expect(NearAddr.isValid(implicit)).toBeTruthy();
      expect(NearAddr.isImplicit(implicit)).toBeTruthy();
      expect(NearAddr.isImplicit('alice.near')).toBeFalsy();
    });
    it('should reject malformed account ids', async () => {
      expect(NearAddr.isValid('Alice.near')).toBeFalsy(); // uppercase
      expect(NearAddr.isValid('.alice.near')).toBeFalsy(); // leading separator
      expect(NearAddr.isValid('alice.near.')).toBeFalsy(); // trailing separator
      expect(NearAddr.isValid('alice..near')).toBeFalsy(); // doubled separator
      expect(NearAddr.isValid('a')).toBeFalsy(); // below the 2 char minimum
      expect(NearAddr.isValid('a'.repeat(65))).toBeFalsy(); // above 64
      expect(NearAddr.isValid('')).toBeFalsy();
    });
  });
  describe('isZec', () => {
    it('should return true for transparent addresses', async () => {
      // t1 (P2PKH, version 0x1cb8) and t3 (P2SH, version 0x1cbd)
      expect(
        ZecAddr.isValid('t1KrG29yWzoi7Bs2pvsgXozZYPvGG4D3sGi')
      ).toBeTruthy();
      expect(
        ZecAddr.isValid('t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd')
      ).toBeTruthy();
    });
    it('should reject a mistyped address via the checksum', async () => {
      // last character altered — well-formed base58, wrong checksum
      expect(
        ZecAddr.isValid('t1KrG29yWzoi7Bs2pvsgXozZYPvGG4D3sGX')
      ).toBeFalsy();
    });
    it('should reject shielded and unified addresses', async () => {
      // 1Click withdraws to transparent addresses only
      expect(
        ZecAddr.isValid(
          'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
        )
      ).toBeFalsy();
      expect(
        ZecAddr.isValid(
          'u1l8xunezsvhq8fgzfl7404m450nwnd76zshscn6nfys7vyz2ywyh4cc5d'
        )
      ).toBeFalsy();
    });
    it('should reject other chains addresses', async () => {
      expect(
        ZecAddr.isValid('AQHqDkgchJaSQHPMDj6BMFH9riTqbHjzEBWwUbAh8Fbq')
      ).toBeFalsy();
      expect(ZecAddr.isValid('')).toBeFalsy();
    });
  });
});
