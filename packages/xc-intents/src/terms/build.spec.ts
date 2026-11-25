import { getAddress } from 'viem';

import {
  buildTerms,
  floorOf,
  ownerOf,
  refundAddress,
  swapDeadline,
  twapDeadline,
  twapFillMultiplier,
} from './build';

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const ALICE_H160 = getAddress('0xd43593c715fdd31c61141abd04a99fd6822c8558');
const ALITH_H160 = '0x15fdd31c61141abd04a99fd6822c8558854ccde3';
const ALITH_SS58 = '7KATdGaiYbPauPtFrTfRj7zMM8KHqLbkjfurUnX6F57aHHqq';

describe('terms build', () => {
  it('owner: an EVM address is its own', () => {
    expect(ownerOf(ALITH_H160).toLowerCase()).toBe(ALITH_H160);
  });

  it('owner: an ETH-prefixed account is its EVM address', () => {
    expect(ownerOf(ALITH_SS58).toLowerCase()).toBe(ALITH_H160);
  });

  it('owner: a substrate account is its truncated id', () => {
    expect(ownerOf(ALICE)).toBe(ALICE_H160);
  });

  it('refundTo: checksums and rejects a bad checksum', () => {
    const checksummed = getAddress(ALITH_H160);
    const flipped = checksummed.replace(/[a-f]/, (c) => c.toUpperCase());
    expect(refundAddress(ALITH_H160)).toBe(checksummed);
    expect(refundAddress(checksummed)).toBe(checksummed);
    expect(() => refundAddress(flipped)).toThrow();
    expect(() => refundAddress(ALICE)).toThrow();
  });

  it('floor: 20% under the rate', () => {
    expect(floorOf(1_000_000n, 2000)).toBe(800_000n);
  });

  it('fill multiplier: the tranche count within 2..100', () => {
    expect(twapFillMultiplier(1)).toBe(2);
    expect(twapFillMultiplier(12)).toBe(12);
    expect(twapFillMultiplier(500)).toBe(100);
  });

  it('swap deadline: the ICE deadline plus an hour', () => {
    expect(swapDeadline(1_700_000_000_000n)).toBe(1_700_003_600n);
  });

  it('twap deadline: the schedule plus two hours', () => {
    // 10 trades × 150 blocks × 2.2 s = 3300 s
    expect(twapDeadline(1_700_000_000_000, 10, 150)).toBe(
      1_700_000_000n + 3300n + 7200n
    );
  });

  it('assembles terms with a fresh quote id', () => {
    const params = {
      account: ALICE,
      destinationAsset: 'nep141:wrap.near',
      recipient: 'alice.near',
      refundTo: ALITH_H160,
      maxSlippageBps: 300,
      maxFillMultiplier: 2,
      minOutPerIn: 1n,
      minDelivery: 1n,
      deadline: 1n,
    };
    const a = buildTerms(params);
    const b = buildTerms(params);
    expect(a.owner).toBe(ALICE_H160);
    expect(a.recipientKind).toBe(0);
    expect(a.quoteId).toMatch(/^0x[0-9a-f]{64}$/);
    expect(a.quoteId).not.toBe(b.quoteId);
  });
});
