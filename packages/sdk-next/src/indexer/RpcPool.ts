import { PolkadotClient, createClient } from 'polkadot-api';

import { getWs } from '../api';

export class RpcPool {
  private readonly clients: PolkadotClient[] = [];
  private readonly owned: boolean;
  private idx = 0;

  private constructor(clients: PolkadotClient[], owned: boolean) {
    if (clients.length === 0) {
      throw new Error('RpcPool requires at least one client');
    }
    this.clients = clients;
    this.owned = owned;
  }

  static fromEndpoints(endpoints: string | string[]): RpcPool {
    const list =
      typeof endpoints === 'string' ? endpoints.split(',') : endpoints;
    const clients = list.map((endpoint) => createClient(getWs(endpoint)));
    return new RpcPool(clients, true);
  }

  static fromClients(clients: PolkadotClient[]): RpcPool {
    return new RpcPool(clients, false);
  }

  size(): number {
    return this.clients.length;
  }

  next(): PolkadotClient {
    const client = this.clients[this.idx % this.clients.length];
    this.idx++;
    return client;
  }

  destroy(): void {
    if (!this.owned) return;
    for (const client of this.clients) client.destroy();
  }
}
