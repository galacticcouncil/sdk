import { type WsProvider } from '@polkadot/api';

import { type Transport, type EIP1193RequestFn } from 'viem';

export function pjsWebSocket(provider: WsProvider): Transport<'webSocket'> {
  const request: EIP1193RequestFn = async ({ method, params }) => {
    const args = Array.isArray(params) ? params : [];
    return provider.send(method, args);
  };

  return () => ({
    request,
    config: {
      name: 'PolkadotWsTransport',
      type: 'webSocket',
      key: 'polkadotWs',
      request,
    },
  });
}
