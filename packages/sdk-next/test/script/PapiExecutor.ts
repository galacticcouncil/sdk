import { PolkadotClient } from 'polkadot-api';
import { hydration } from '@polkadot-api/descriptors';

import { ApiUrl } from './types';

import { papi, json } from '../../src';

export abstract class PapiExecutor {
  protected readonly apiUrl: ApiUrl;
  protected readonly desc: string;
  protected readonly pretty: boolean;

  constructor(apiUrl: ApiUrl, desc: string, pretty?: boolean) {
    this.apiUrl = apiUrl;
    this.desc = desc;
    this.pretty = pretty || false;
  }

  async run() {
    const client = await papi.getWs(this.apiUrl);
    const api = client.getTypedApi(hydration);
    const { spec_name, spec_version } = await api.constants.System.Version();
    console.log(`Runtime ready ${spec_name}/${spec_version}`);
    console.log('Running script...');
    console.log(this.desc);
    console.time('Execution time:');

    this.script(client)
      .then((output: any) => {
        if (this.pretty) {
          console.log(
            output ? JSON.stringify(output, json.jsonFormatter, 2) : ''
          );
        } else {
          console.log(output);
        }
        return null;
      })
      .catch((e) => {
        console.log(e);
        client.destroy();
      })
      .finally(() => {
        console.timeEnd('Execution time:');
        client.destroy();
      });
  }

  abstract script(client: PolkadotClient): Promise<any>;
}
