import { createClient, PolkadotClient } from 'polkadot-api';
import { withLogsRecorder } from 'polkadot-api/logs-provider';
import { withLegacy } from '@polkadot-api/legacy-provider';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';
import { getWsProvider } from 'polkadot-api/ws-provider';

export const getWs = async (
  wsUrl: string | string[]
): Promise<PolkadotClient> => {
  const endpoints = typeof wsUrl === 'string' ? wsUrl.split(',') : wsUrl;
  const wsProvider = getWsProvider(endpoints, {
    innerEnhancer: withLegacy(),
  });
  const provider = withLogsRecorder((line) => console.log(line), wsProvider);
  return createClient(wsProvider);
};
