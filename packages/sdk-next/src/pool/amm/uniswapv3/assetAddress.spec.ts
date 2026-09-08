import {
  aliasAddress,
  assetAddress,
  contractFromLocation,
} from './assetAddress';

/** Hydration mainnet, read from the registry 2026-08-25. */
const ADOT = {
  id: 1001,
  contract: '0x02639ec01313c8775fae74f2dad1118c8a8a86da',
  alias: '0x00000000000000000000000000000001000003e9',
};
const HOLLAR = {
  id: 222,
  contract: '0x531a654d1696ed52e7275a8cede955e82620f99a',
  alias: '0x00000000000000000000000000000001000000de',
};
/** WETH — `Token`-kind, so the alias IS its address. */
const WETH = { id: 20, alias: '0x0000000000000000000000000000000100000014' };

const accountKey20 = (key: string) => ({
  parents: 0,
  interior: { type: 'X1', value: { type: 'AccountKey20', value: { key } } },
});

describe('uniswap v3 asset address resolution', () => {
  describe('aliasAddress', () => {
    it('encodes the id into the last 4 bytes after a 0x01 marker', () => {
      expect(aliasAddress(ADOT.id)).toBe(ADOT.alias);
      expect(aliasAddress(HOLLAR.id)).toBe(HOLLAR.alias);
      expect(aliasAddress(WETH.id)).toBe(WETH.alias);
    });

    it('rejects an id that cannot fit', () => {
      expect(() => aliasAddress(-1)).toThrow();
      expect(() => aliasAddress(2 ** 32)).toThrow();
      expect(() => aliasAddress(1.5)).toThrow();
    });
  });

  describe('contractFromLocation', () => {
    it('reads the key out of an X1/AccountKey20 location', () => {
      expect(contractFromLocation(accountKey20(ADOT.contract))).toBe(
        ADOT.contract
      );
    });

    it('lower-cases, so address comparison and sorting are safe', () => {
      const mixed = '0x02639eC01313c8775FAe74f2DAd1118c8a8A86Da';
      expect(contractFromLocation(accountKey20(mixed))).toBe(ADOT.contract);
    });

    it('ignores a location that is not an AccountKey20', () => {
      expect(contractFromLocation(undefined)).toBeUndefined();
      expect(
        contractFromLocation({ interior: { type: 'Here' } })
      ).toBeUndefined();
      // Parachain carries a plain number where AccountKey20 carries an object.
      expect(
        contractFromLocation({
          interior: { type: 'X1', value: { type: 'Parachain', value: 2034 } },
        })
      ).toBeUndefined();
    });
  });

  describe('assetAddress', () => {
    it('uses the alias for a Token-kind asset', () => {
      const r = assetAddress(WETH.id, 'Token', undefined);
      expect(r).toEqual({ address: WETH.alias, viaContract: false });
    });

    it('uses the registered contract for an Erc20-kind asset', () => {
      const r = assetAddress(ADOT.id, 'Erc20', accountKey20(ADOT.contract));
      expect(r).toEqual({ address: ADOT.contract, viaContract: true });
    });

    it('never returns the alias for an Erc20 asset that has a contract', () => {
      // The regression: the alias is a live precompile that answers symbol() and
      // decimals(), so it looks correct while addressing a different pool.
      const r = assetAddress(ADOT.id, 'Erc20', accountKey20(ADOT.contract));
      expect(r.address).not.toBe(ADOT.alias);
    });

    it('flags an Erc20 asset with no AccountKey20 rather than silently aliasing', () => {
      const r = assetAddress(ADOT.id, 'Erc20', { interior: { type: 'Here' } });
      expect(r.viaContract).toBe(false);
      expect(r.problem).toMatch(/no AccountKey20/);
    });
  });

  describe('pool ordering for the launch pair', () => {
    const sort = (a: string, b: string) => (a < b ? [a, b] : [b, a]);

    it('sorts aDOT first by contract — the opposite of the alias sort', () => {
      const byContract = sort(ADOT.contract, HOLLAR.contract);
      const byAlias = sort(ADOT.alias, HOLLAR.alias);

      expect(byContract[0]).toBe(ADOT.contract); // token0 = aDOT
      expect(byAlias[0]).toBe(HOLLAR.alias); // token0 = HOLLAR

      // The inversion is the whole hazard: same pair, opposite token0, and every
      // tick sign downstream flips with it.
      expect(byContract[0] === ADOT.contract).not.toBe(
        byAlias[0] === ADOT.alias
      );
    });

    it('resolves the launch pair to the contracts the runtime uses', () => {
      const a = assetAddress(ADOT.id, 'Erc20', accountKey20(ADOT.contract));
      const b = assetAddress(HOLLAR.id, 'Erc20', accountKey20(HOLLAR.contract));
      const [token0, token1] = sort(a.address, b.address);

      // Matches lark4 factory.getPool(...) -> 0xc3139a43E80c1b5C0f31CFF9A60531B7cA3898ef
      expect(token0).toBe(ADOT.contract);
      expect(token1).toBe(HOLLAR.contract);
    });
  });
});
