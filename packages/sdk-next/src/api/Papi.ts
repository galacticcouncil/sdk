import { PolkadotClient, TypedApi } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

import { getLogValue } from './utils';

export abstract class Papi {
  readonly client: PolkadotClient;
  readonly api: TypedApi<typeof hydration>;

  constructor(client: PolkadotClient) {
    this.client = client;
    this.api = this.client.getTypedApi(hydration);
  }

  protected log(message?: any, ...optionalParams: any[]) {
    const debug =
      typeof window === 'undefined'
        ? process.env['GC_DEBUG']
        : window.localStorage.getItem('gc.debug');

    const logOn = getLogValue(debug);
    if (logOn) {
      console.log(message, ...optionalParams);
    }
  }
}
