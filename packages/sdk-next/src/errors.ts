import { PoolType } from './pool';

export class AssetNotFound extends Error {
  constructor(asset: number) {
    super();
    this.message = `${asset} not found`;
    this.name = 'AssetNotFound';
  }
}

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
    this.message = `Route from ${assetIn} to ${assetOut} not found in current configuration`;
    this.name = 'RouteNotFound';
  }
}
