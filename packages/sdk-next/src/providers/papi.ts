import { createClient, PolkadotClient } from 'polkadot-api';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';

export const getApi = async (
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

export const loadChainSpec = async (chainId: string) => {
  try {
    switch (chainId) {
      case 'kusama':
        return (await import('polkadot-api/chains/ksmcc3')).chainSpec;
      case 'polkadot':
        return (await import('polkadot-api/chains/polkadot')).chainSpec;
      case 'paseo':
        return (await import('polkadot-api/chains/paseo')).chainSpec;
      case 'hydration': {
        return (await import('./chainspec/hydration')).chainSpec;
      }
      default:
        throw new Error(`Unknown chain: ${chainId}`);
    }
  } catch (cause) {
    throw new Error(`Failed to load chain spec for ${chainId}`, {
      cause,
    });
  }
};
