import { createClient, PolkadotClient } from 'polkadot-api';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';

export const getWs = async (
  wsUrl: string | string[]
): Promise<PolkadotClient> => {
  const endpoints = typeof wsUrl === 'string' ? wsUrl.split(',') : wsUrl;
  const isNodeJs = typeof window === 'undefined';
  const getWsProvider = isNodeJs
    ? (await import('polkadot-api/ws-provider/node')).getWsProvider
    : (await import('polkadot-api/ws-provider/web')).getWsProvider;
  const wsProvider = getWsProvider(endpoints);
  return createClient(withPolkadotSdkCompat(wsProvider));
};
