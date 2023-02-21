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

export class AssetNotFound extends Error {
  constructor(asset: string) {
    super();
    this.message = `Asset ${asset} not available in current network`;
    this.name = 'AssetNotFound';
  }
}

export class StorageConfigNotFound extends Error {
  constructor(param: string) {
    super();
    this.message = `Storage missing ${param}`;
    this.name = 'StorageConfigNotFound';
  }
}

export class SubscriptionNotSupported extends Error {
  constructor(subscriptionType: string) {
    super();
    this.message = `Subscription type "${subscriptionType}" not supported`;
    this.name = 'SubscriptionNotSupported';
  }
}

export class ProviderConfigNotFound extends Error {
  constructor(message: string) {
    super();
    this.message = `${message}`;
    this.name = 'ProviderConfigNotFound';
  }
}
