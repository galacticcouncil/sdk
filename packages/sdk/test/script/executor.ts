import { ApiPromise, WsProvider } from '@polkadot/api';

import '@galacticcouncil/api-augment/hydradx';

export enum ApiUrl {
  Local = 'ws://localhost:8000',
  Chopsticks = 'wss://chopsticks.rpc.hydration.cloud',
  Nice = 'wss://rpc.nice.hydration.cloud',
  Basilisk = 'wss://rpc.basilisk.cloud',
  Basilisk_UK = 'wss://basilisk-mainnet-rpc-07.basilisk.cloud',
  Basilisk_Rococo = 'wss://rococo-basilisk-rpc.hydration.dev',
  Basilisk_Rococo_UK = 'wss://rococo-basilisk-rpc04.hydration.dev',
  Basilisk_Rococo_CLOUD = 'wss://basilisk-rococo-rpc.play.hydration.cloud',
  HydraDx = 'wss://rpc.hydradx.cloud',
  HydraDx_Rococo = 'wss://hydradx-rococo-rpc.play.hydration.cloud',
}

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
    return new Promise((resolve, reject) => {
      try {
        const provider = new WsProvider(this.apiUrl);
        const api = new ApiPromise({
          provider: provider,
        });

        api
          .on('connected', () => console.log('API connected'))
          .on('disconnected', () => console.log('API disconnected'))
          .on('error', () => console.log('API error'))
          .on('ready', () => {
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
                reject(e);
              })
              .finally(() => {
                console.timeEnd('Execution time:');
                api.disconnect();
                resolve('');
              });
          });
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  abstract script(api: ApiPromise): Promise<any>;
}
