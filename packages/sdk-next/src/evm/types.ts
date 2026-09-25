/** A 20-byte EVM address, hex encoded */
export type H160 = `0x${string}`;

export type EvmLogEvent = [
  log: {
    address: `0x${string}`;
    topics: [signature: `0x${string}`, ...args: `0x${string}`[]];
    data: `0x${string}`;
  },
];
