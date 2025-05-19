import { ApiPromise } from '@polkadot/api';
import { CallDryRunEffects } from '@polkadot/types/interfaces';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { getLogValue } from '../utils/log';

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

  async dryRun(
    account: string,
    extrinsic: SubmittableExtrinsic
  ): Promise<CallDryRunEffects> {
    let result;
    try {
      result = await this.api.call.dryRunApi.dryRunCall(
        {
          System: { Signed: account },
        },
        extrinsic.inner.toHex()
      );
    } catch (e) {
      console.error(e);
      throw new Error('Dry run execution failed!');
    }

    if (result.isOk) {
      return result.asOk;
    }
    console.log(result.asErr.toHuman());
    throw new Error('Dry run execution error!');
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
