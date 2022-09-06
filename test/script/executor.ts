import { ApiPromise, WsProvider } from '@polkadot/api';

export abstract class PolkadotExecutor {
  protected readonly apiUrl: string;
  protected readonly desc: string;
  protected readonly pretty: boolean;

  constructor(apiUrl: string, desc: string, pretty?: boolean) {
    this.apiUrl = apiUrl;
    this.desc = desc;
    this.pretty = pretty || false;
  }

  async run() {
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
          console.log('API ready');
          console.log('Running script...');
          console.log(this.desc);
          this.script(api)
            .then((output: any) => {
              if (this.pretty) {
                console.log(output ? JSON.stringify(output, null, 2) : '');
              } else {
                console.log(output);
              }
              return null;
            })
            .catch((e) => console.log(e))
            .finally(() => api.disconnect());
        });
    } catch (error) {
      console.log(error);
    }
  }

  abstract script(api: ApiPromise): Promise<any>;
}
