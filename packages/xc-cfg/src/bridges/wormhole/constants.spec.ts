import { encodeNttRequest } from './constants';

describe('encodeNttRequest', () => {
  // Byte-for-byte the requestBytes of a live base -> ethereum ntt relay
  // (base tx 0x754dbd27c92ad69aff8bbd32d7cc255150ad46e0452cbea6283334accdea1685),
  // read off the Executor's RequestForExecution event. The wormhole sdk ships
  // no layout for this, so a real relay is the only reference.
  const LIVE =
    '0x45524e31001e000000000000000000000000bc51f76178a56811fdfe95d3897e6ac2b11dbb6200000000000000000000000000000000000000000000000000000000000032c8';

  it('should reproduce a live relay request', () => {
    expect(
      encodeNttRequest(30, '0xbc51f76178a56811fdfe95d3897e6ac2b11dbb62', 13000n)
    ).toBe(LIVE);
  });

  it('should be 70 bytes', () => {
    const req = encodeNttRequest(73, '0x' + '11'.repeat(20), 4n);
    expect((req.length - 2) / 2).toBe(70);
  });

  // The manager arrives from the registry in checksum case; the executor
  // matches the emitter bytes, so an uppercase nibble would not be found.
  it('should lowercase the manager', () => {
    const req = encodeNttRequest(
      73,
      '0xAABBCCDDEEFF00112233445566778899AABBCCDD',
      1n
    );
    expect(req).toContain('aabbccddeeff00112233445566778899aabbccdd');
  });

  it('should pad the sequence to a full word, not u64', () => {
    const req = encodeNttRequest(73, '0x' + '00'.repeat(20), 4n);
    expect(req.slice(-64)).toBe('4'.padStart(64, '0'));
  });
});
