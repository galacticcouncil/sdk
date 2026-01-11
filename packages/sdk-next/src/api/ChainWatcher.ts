import type { PolkadotClient } from 'polkadot-api';

import { log } from '@galacticcouncil/common';

import { Observable, shareReplay, tap } from 'rxjs';

import { connectionProbe$ } from './probe';

const { logger } = log;

export class ChainWatcher {
  private static instance: ChainWatcher | null = null;

  readonly bestBlock$;
  readonly finalizedBlock$;
  readonly connection$;

  private constructor(client: PolkadotClient) {
    this.bestBlock$ = this.watched(
      'watcher(bestBlock)',
      client.getUnsafeApi().query.System.Number.watchValue('best')
    );

    this.finalizedBlock$ = this.watched(
      'watcher(finalizedBlock)',
      client.finalizedBlock$
    );

    this.connection$ = this.watched(
      'watcher(connection)',
      connectionProbe$(client)
    );
  }

  static getInstance(client: PolkadotClient): ChainWatcher {
    if (!this.instance) {
      this.instance = new ChainWatcher(client);
    }
    return this.instance;
  }

  private watched<T>(tag: string, source$: Observable<T>): Observable<T> {
    return source$.pipe(
      tap({ error: (e) => logger.error(tag, e) }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
