import { getWsProvider } from 'polkadot-api/ws';
import { withLogsRecorder } from 'polkadot-api/logs-provider';

type WsProviderConfig = Parameters<typeof getWsProvider>[1];

export const getWs = (
  wsUrl: string | string[],
  config: WsProviderConfig = {}
) => {
  const endpoints = typeof wsUrl === 'string' ? wsUrl.split(',') : wsUrl;
  const wsProvider = getWsProvider(endpoints, config);
  withLogsRecorder((line) => console.log(line), wsProvider);
  return wsProvider;
};
