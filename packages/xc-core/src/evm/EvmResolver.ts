import { PolkadotClient } from 'polkadot-api';

export interface EvmResolver {
  toH160(ss58Addr: string, api?: PolkadotClient): Promise<string>;
  toSS58(h160Addr: string, api?: PolkadotClient): Promise<string>;
}
