import { withLogsRecorder } from 'polkadot-api/logs-provider';
import { withLegacy } from '@polkadot-api/legacy-provider';
import { getWsProvider } from 'polkadot-api/ws-provider';

type WsProviderConfig = Parameters<typeof getWsProvider>[1];

export const getWs = (
  wsUrl: string | string[],
  config: WsProviderConfig = {}
) => {
  const endpoints = typeof wsUrl === 'string' ? wsUrl.split(',') : wsUrl;
  const wsProvider = getWsProvider(endpoints, {
    innerEnhancer: withLegacy(),
    ...config,
  });
  withLogsRecorder((line) => console.log(line), wsProvider);
  return wsProvider;
};
