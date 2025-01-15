import { ApiPromise, WsProvider } from '@polkadot/api';

export const getApi = async (wsUrl: string | string[]): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(wsUrl);
  return ApiPromise.create({ provider: wsProvider });
};
