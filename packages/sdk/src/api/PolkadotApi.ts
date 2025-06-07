import { ApiPromise } from '@polkadot/api';

import { getLogValue } from './utils';

import '@galacticcouncil/api-augment/hydradx';
import '@galacticcouncil/api-augment/basilisk';

export abstract class PolkadotApiClient {
  protected readonly api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  get chainDecimals() {
    return this.api.registry.chainDecimals[0];
  }

  get chainToken() {
    return this.api.registry.chainTokens[0];
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
