import '@galacticcouncil/api-augment/hydradx';

import { ApiPromise, WsProvider } from '@polkadot/api';

import { ApiUrl } from './types';

export abstract class PolkadotExecutor {
  protected readonly apiUrl: ApiUrl;
  protected readonly desc: string;
  protected readonly pretty: boolean;

  constructor(apiUrl: ApiUrl, desc: string, pretty?: boolean) {
    this.apiUrl = apiUrl;
    this.desc = desc;
    this.pretty = pretty || false;
  }

  async run() {
    const wsProvider = new WsProvider(
      this.apiUrl,
      2_500, // autoConnect (2.5 seconds)
      {}, // headers
      60_000, // request timeout (60 seconds)
      102400, // cache capacity
      10 * 60_000 // cache TTL (10 minutes)
    );

    const api = await ApiPromise.create({ provider: wsProvider });

    const { specName, specVersion } = api.consts.system.version;
    console.log(`Runtime ready ${specName}/${specVersion}`);
    console.log('Running script...');
    console.log(this.desc);
    console.time('Execution time:');

    this.script(api)
      .then((output: any) => {
        if (this.pretty) {
          console.log(output ? JSON.stringify(output, null, 2) : '');
        } else {
          console.log(output);
        }
        return null;
      })
      .catch((e) => {
        console.log(e);
        api.disconnect();
      })
      .finally(() => {
        console.timeEnd('Execution time:');
      });
  }

  abstract script(api: ApiPromise): Promise<any>;
}
