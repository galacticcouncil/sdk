import { PolkadotClient } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

export abstract class Papi {
  readonly client: PolkadotClient;

  constructor(client: PolkadotClient) {
    this.client = client;
  }

  public get api() {
    return this.client.getTypedApi(hydration);
  }

  logSync(who: string, action: string, payload: any) {
    const addr = who.substring(0, 10).concat('...');
    const log = ['🔄 Sync', action, '[', addr, ']', payload].join(' ');
    console.log(log);
  }
}
