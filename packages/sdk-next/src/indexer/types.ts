import type { PolkadotClient } from 'polkadot-api';

// System.Events storage key (twox128("System") ++ twox128("Events"))
export const SYSTEM_EVENTS_KEY =
  '0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7';

export interface RawBlock {
  number: number;
  hash: string;
  // chain_getBlock header — present when withBlock is true
  header?: unknown;
  // chain_getBlock extrinsics — present when withBlock is true (empty otherwise)
  extrinsics: string[];
  // raw SCALE-encoded System.Events blob (hex, "0x"-prefixed) — present when withEvents is true
  eventsHex?: string;
  // event count from the compact length prefix of the events blob (0 if not fetched)
  eventsCount: number;
  // approximate bytes received over the wire (block JSON + events hex)
  bytes: number;
}

export interface FetchBlockOptions {
  // when true, also fetches chain_getBlock (header + extrinsics). Default false.
  withBlock?: boolean;
  // when true, also fetches the raw System.Events blob. Default false.
  withEvents?: boolean;
}

export type BlockHandler = (block: RawBlock) => void | Promise<void>;

export type ClientSelector = () => PolkadotClient;
