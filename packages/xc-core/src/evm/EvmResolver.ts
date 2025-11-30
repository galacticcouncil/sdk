import { PolkadotClient } from 'polkadot-api';

export interface EvmResolver {
  toH160(ss58Addr: string, api?: PolkadotClient): Promise<string>;
}
