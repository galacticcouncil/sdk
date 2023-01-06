import { PoolType } from './types';

export class PoolConfigNotFound extends Error {
  constructor(poolType: PoolType, param: string) {
    super();
    this.message = `${poolType} pool missing ${param}`;
    this.name = 'PoolConfigNotFound';
  }
}
