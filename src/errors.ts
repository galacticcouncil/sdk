import { PoolType } from './types';

export class PoolConfigNotFound extends Error {
  constructor(poolType: PoolType, param: string) {
    super();
    this.message = `${poolType} pool missing ${param}`;
    this.name = 'PoolConfigNotFound';
  }
}

export class RouteNotFound extends Error {
  constructor(assetIn: string, assetOut: string) {
    super();
    this.message = `Route from ${assetIn} to ${assetOut} not found in pool configuration`;
    this.name = 'RouteNotFound';
  }
}
