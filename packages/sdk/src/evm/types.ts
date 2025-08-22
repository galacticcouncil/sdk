export type EvmLogEvent = [
  log: {
    address: `0x${string}`;
    topics: [signature: `0x${string}`, ...args: `0x${string}`[]];
    data: `0x${string}`;
  },
];
