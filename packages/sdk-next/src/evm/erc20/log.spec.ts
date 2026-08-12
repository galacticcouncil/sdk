import {
  ERC20_TRANSFER_TOPIC,
  decodeErc20Transfer,
  type EvmLogLike,
} from './log';

/** A real deployment: aDOT's contract on Hydration */
const ADOT_ADDR = '0x02639ec01313c8775fae74f2dad1118c8a8a86da';
const ADOT_ID = 1001;

/** Another registered contract, to cover an id we are not watching */
const OTHER_ADDR = '0x1111111111111111111111111111111111111111';
const OTHER_ID = 9999;

const pad32 = (h160: string) =>
  '0x' + h160.replace(/^0x/, '').padStart(64, '0');

const ALICE = '0x1234567890abcdef1234567890abcdef12345678';
const BOB = '0x00000000000000000000000000000000000000ff';

const log = (address: string, topics: string[], data = '0x'): EvmLogLike => ({
  log: { address, topics, data },
});

const transferLog = (contract: string, from: string, to: string) =>
  log(contract, [ERC20_TRANSFER_TOPIC, pad32(from), pad32(to)]);

describe('decodeErc20Transfer', () => {
  it('decodes a Transfer and reports the emitting contract', () => {
    const t = decodeErc20Transfer(transferLog(ADOT_ADDR, ALICE, BOB));
    expect(t).toBeDefined();
    expect(t!.contract).toBe(ADOT_ADDR);
    expect(t!.from).toBe(ALICE.toLowerCase());
    expect(t!.to).toBe(BOB.toLowerCase());
  });

  it('lower-cases the contract address', () => {
    const upper = '0x' + ADOT_ADDR.slice(2).toUpperCase();
    const t = decodeErc20Transfer(transferLog(upper, ALICE, BOB));
    expect(t!.contract).toBe(ADOT_ADDR);
  });

  it('is topic0-case-insensitive', () => {
    const t = decodeErc20Transfer(
      log(ADOT_ADDR, [
        ERC20_TRANSFER_TOPIC.toUpperCase(),
        pad32(ALICE),
        pad32(BOB),
      ])
    );
    expect(t?.contract).toBe(ADOT_ADDR);
  });

  it('returns undefined for a non-Transfer topic0', () => {
    const t = decodeErc20Transfer(
      log(ADOT_ADDR, ['0x' + 'ab'.repeat(32), pad32(ALICE), pad32(BOB)])
    );
    expect(t).toBeUndefined();
  });

  it('returns undefined for logs with fewer than 3 topics (non-indexed)', () => {
    const t = decodeErc20Transfer(log(ADOT_ADDR, [ERC20_TRANSFER_TOPIC]));
    expect(t).toBeUndefined();
  });

  it('strips 12-byte left padding from indexed address topics', () => {
    const t = decodeErc20Transfer(transferLog(ADOT_ADDR, ALICE, BOB));
    expect(t!.from).toHaveLength(42);
    expect(t!.to).toHaveLength(42);
  });
});

describe('event-gate filter (contract + from/to match)', () => {
  // mirrors the predicate used in BalanceClient.watchErc20Balance
  const byContract = new Map([
    [ADOT_ADDR, ADOT_ID],
    [OTHER_ADDR, OTHER_ID],
  ]);
  const watched = new Set([ADOT_ID]);
  const owner = ALICE.toLowerCase();

  const gated = (l: EvmLogLike) => {
    const t = decodeErc20Transfer(l);
    if (t === undefined) return false;
    if (t.from !== owner && t.to !== owner) return false;
    const id = byContract.get(t.contract);
    return id !== undefined && watched.has(id);
  };

  it('passes when the watched account is the sender', () => {
    expect(gated(transferLog(ADOT_ADDR, ALICE, BOB))).toBe(true);
  });

  it('passes when the watched account is the receiver', () => {
    expect(gated(transferLog(ADOT_ADDR, BOB, ALICE))).toBe(true);
  });

  it('drops transfers not involving the watched account', () => {
    const carol = '0x000000000000000000000000000000000000ccc1';
    expect(gated(transferLog(ADOT_ADDR, BOB, carol))).toBe(false);
  });

  it('drops a contract the registry does not map to an asset', () => {
    const unknown = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    expect(gated(transferLog(unknown, ALICE, BOB))).toBe(false);
  });

  it('drops transfers of an asset id we are not watching', () => {
    expect(gated(transferLog(OTHER_ADDR, ALICE, BOB))).toBe(false);
  });
});
