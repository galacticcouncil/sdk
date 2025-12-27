import { BehaviorSubject, Observable } from 'rxjs';

import { PoolBase } from './types';

export class PoolStore<T extends PoolBase> {
  private store$ = new BehaviorSubject<T[]>([]);
  private updateQueue: Promise<void> = Promise.resolve();
  private changeset: Set<string> = new Set();

  get pools(): readonly T[] {
    return this.store$.value;
  }

  asObservable(): Observable<T[]> {
    return this.store$.asObservable();
  }

  applyChangeset(state: T[]): T[] {
    if (this.changeset.size === 0) return [];
    return state.filter((p) => this.changeset.has(p.address));
  }

  set(next: T[]): void {
    this.changeset = new Set(next.map((p) => p.address));
    this.store$.next(next);
  }

  /**
   * Apply a batched mutation to the store.
   *
   * Updates are applied one at a time in call order (internally queued).
   *
   * @param patch - update callback
   */
  update(patch: (state: readonly T[]) => T[] | Promise<T[]>): void {
    this.updateQueue = this.updateQueue
      .then(async () => {
        const prev = this.store$.value;
        const index = new Map<string, number>(
          prev.map((p, i) => [p.address, i])
        );

        const updates = await patch(prev);
        const next = prev.slice();
        const changed = new Set<string>();

        for (const u of updates) {
          const i = index.get(u.address);

          if (i === undefined) {
            index.set(u.address, next.length);
            next.push(u);
          } else {
            next[i] = u;
          }
          changed.add(u.address);
        }

        this.changeset = changed;
        this.store$.next(next);
      })
      .catch(console.error);
  }

  destroy(): void {
    this.store$.complete();
  }
}
