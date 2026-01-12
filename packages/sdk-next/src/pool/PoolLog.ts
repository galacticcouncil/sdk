import { log } from '@galacticcouncil/common';

import { PoolType } from './types';

const LogLabel: Record<PoolType, string> = {
  [PoolType.Aave]: 'AAVE',
  [PoolType.LBP]: 'LBP',
  [PoolType.Omni]: 'OMNI',
  [PoolType.Stable]: 'STBL',
  [PoolType.XYK]: 'XYK',
  [PoolType.HSM]: 'HSM',
};

const { logger } = log;

export class PoolLog {
  private readonly type: PoolType;

  constructor(type: PoolType) {
    this.type = type;
  }

  private prefix(): string {
    return this.pad(`pool(${LogLabel[this.type]})`, 10);
  }

  trace(label: string, ...args: any[]) {
    logger.trace(`${this.prefix()} ${label} :`, ...args);
  }

  debug(label: string, ...args: any[]) {
    logger.debug(`${this.prefix()} ${label} :`, ...args);
  }

  info(label: string, ...args: any[]) {
    logger.info(`${this.prefix()} ${label} :`, ...args);
  }

  error(label: string, ...args: any[]) {
    logger.error(`${this.prefix()} ${label} :`, ...args);
  }

  private pad(s: string, n: number) {
    return s.length >= n ? s : s + ' '.repeat(n - s.length);
  }
}
