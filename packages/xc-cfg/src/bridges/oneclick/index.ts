import { AnyChain, OneClickClient, ZecChain } from '@galacticcouncil/xc-core';

/** 1 ZEC: a withdrawal fee is quoted on at least this much. */
export const ONE_CLICK_FEE_QUOTE_AMOUNT = 100_000_000n;

/** 1Click client registered on the chain; throws without one. */
export function getOneClickClient(chain: AnyChain): OneClickClient {
  const client = (chain as ZecChain).oneClickClient;
  if (client) {
    return client;
  }
  throw new Error('No 1Click client registered on ' + chain.name);
}
