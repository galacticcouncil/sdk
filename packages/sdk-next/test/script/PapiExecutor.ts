import { PolkadotClient } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

import { ApiUrl } from './types';

import { api, json } from '../../src';

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
    console.log('Connecting to:', this.apiUrl);
    const client = await api.getWs(this.apiUrl);
    const papi = client.getTypedApi(hydration);
    const { spec_name, spec_version } = await papi.constants.System.Version();
    console.log(`Runtime ready ${spec_name}/${spec_version}`);
    console.log('Running script...');
    console.log(this.desc);
    console.time('Execution time:');

    this.script(client)
      .then((output: any) => {
        if (typeof output === 'function') {
          //setTimeout(output, 10_000);
          return;
        }

        if (this.pretty) {
          console.log(
            output ? JSON.stringify(output, json.jsonFormatter, 2) : ''
          );
        } else {
          console.log(output);
        }
        console.log('Destroying...');
        client.destroy();
      })
      .catch((e) => {
        console.log(e);
        client.destroy();
      })
      .finally(() => {
        console.timeEnd('Execution time:');
      });
  }

  abstract script(client: PolkadotClient): Promise<any>;

  logTime() {
    const time = [
      '-----',
      new Date().toISOString().replace('T', ' ').replace('Z', ''),
      '-----',
    ].join('');
    console.log(time);
  }
}
