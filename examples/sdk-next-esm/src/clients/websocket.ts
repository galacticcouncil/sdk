import { api } from '@galacticcouncil/sdk-next';

export function getWsProvider(ws: string) {
  return api.getWs(ws, {
    onStatusChanged: (s) => {
      switch (s.type) {
        case 0:
          console.log('[WS] CONNECTING', s.uri);
          break;
        case 1:
          console.log('[WS] CONNECTED', s.uri);
          break;
        case 2:
          console.warn('[WS] CLOSED', s.event);
          break;
        case 3:
          console.error('[WS] ERROR', s);
          break;
      }
    },
  });
}
