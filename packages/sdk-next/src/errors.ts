import { PoolType } from './pool';

export class PoolNotFound extends Error {
  constructor(poolType: PoolType) {
    super();
    this.message = `${poolType} pool invalid`;
    this.name = 'PoolNotFound';
  }
}

export class RouteNotFound extends Error {
  constructor(assetIn: number, assetOut: number) {
    super();
    this.message = `Route from ${assetIn} to ${assetOut} not found in pool configuration`;
    this.name = 'RouteNotFound';
  }
}
