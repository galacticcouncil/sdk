import { erc20 as erc20Utils } from '@galacticcouncil/common';

import {
  ERC20_TRANSFER_TOPIC,
  decodeErc20Transfer,
  type EvmLogLike,
} from './Erc20Log';

const { ERC20 } = erc20Utils;

const ASSET_ID = 1027;
const ASSET_ADDR = ERC20.fromAssetId(ASSET_ID); // 0x...0100000403

const pad32 = (h160: string) => '0x' + h160.replace(/^0x/, '').padStart(64, '0');

const ALICE = '0x1234567890abcdef1234567890abcdef12345678';
const BOB = '0x00000000000000000000000000000000000000ff';

const log = (
  address: string,
  topics: string[],
  data = '0x'
): EvmLogLike => ({ log: { address, topics, data } });

const transferLog = (contract: string, from: string, to: string) =>
  log(contract, [ERC20_TRANSFER_TOPIC, pad32(from), pad32(to)]);

describe('decodeErc20Transfer', () => {
  it('decodes a Transfer and maps the emitting precompile to an asset id', () => {
    const t = decodeErc20Transfer(transferLog(ASSET_ADDR, ALICE, BOB));
    expect(t).toBeDefined();
    expect(t!.assetId).toBe(ASSET_ID);
    expect(t!.from).toBe(ALICE.toLowerCase());
    expect(t!.to).toBe(BOB.toLowerCase());
  });

  it('is topic0-case-insensitive', () => {
    const t = decodeErc20Transfer(
      log(ASSET_ADDR, [
        ERC20_TRANSFER_TOPIC.toUpperCase(),
        pad32(ALICE),
        pad32(BOB),
      ])
    );
    expect(t?.assetId).toBe(ASSET_ID);
  });

  it('returns undefined for a non-Transfer topic0', () => {
    const t = decodeErc20Transfer(
      log(ASSET_ADDR, ['0x' + 'ab'.repeat(32), pad32(ALICE), pad32(BOB)])
    );
    expect(t).toBeUndefined();
  });

  it('returns undefined for logs with fewer than 3 topics (non-indexed)', () => {
    const t = decodeErc20Transfer(log(ASSET_ADDR, [ERC20_TRANSFER_TOPIC]));
    expect(t).toBeUndefined();
  });

  it('returns assetId null for a non-asset contract (e.g. aToken)', () => {
    // a regular H160 that is NOT the 0x..01<id> asset precompile prefix
    const aToken = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    const t = decodeErc20Transfer(transferLog(aToken, ALICE, BOB));
    expect(t).toBeDefined();
    expect(t!.assetId).toBeNull();
  });

  it('strips 12-byte left padding from indexed address topics', () => {
    const t = decodeErc20Transfer(transferLog(ASSET_ADDR, ALICE, BOB));
    expect(t!.from).toHaveLength(42);
    expect(t!.to).toHaveLength(42);
  });
});

describe('event-gate filter (from/to match)', () => {
  // mirrors the predicate used in BalanceClient.watchErc20Balance
  const watched = new Set([ASSET_ID]);
  const owner = ALICE.toLowerCase();

  const gated = (l: EvmLogLike) => {
    const t = decodeErc20Transfer(l);
    return (
      t !== undefined &&
      t.assetId !== null &&
      watched.has(t.assetId) &&
      (t.from === owner || t.to === owner)
    );
  };

  it('passes when the watched account is the sender', () => {
    expect(gated(transferLog(ASSET_ADDR, ALICE, BOB))).toBe(true);
  });

  it('passes when the watched account is the receiver', () => {
    expect(gated(transferLog(ASSET_ADDR, BOB, ALICE))).toBe(true);
  });

  it('drops transfers not involving the watched account', () => {
    const carol = '0x000000000000000000000000000000000000ccc1';
    expect(gated(transferLog(ASSET_ADDR, BOB, carol))).toBe(false);
  });

  it('drops transfers of an asset id we are not watching', () => {
    const other = ERC20.fromAssetId(9999);
    expect(gated(transferLog(other, ALICE, BOB))).toBe(false);
  });
});
