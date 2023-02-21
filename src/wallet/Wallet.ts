import { ApiPromise, ApiRx } from '@polkadot/api';
import { ChainAsset } from '../registry';
import { BalanceAdapter, EvmProvider } from './types';
import { AssetNotFound } from '../errors';
import { firstValueFrom, Observable } from 'rxjs';
import { AssetBalance } from '../types';
import { TokenBalanceAdapter } from './balance/TokenBalanceAdapter';
import { Erc20BalanceAdapter } from './balance/Erc20BalanceAdapter';

interface WalletConfigs {
  evmProvider?: EvmProvider;
}

export class Wallet {
  readonly api: ApiPromise | ApiRx;
  readonly assets: ChainAsset[];
  readonly adapters: Record<string, BalanceAdapter> = {};

  constructor(api: ApiPromise | ApiRx, assets: ChainAsset[], cfg?: WalletConfigs) {
    this.api = api;
    this.assets = assets;
    this.adapters['Token'] = new TokenBalanceAdapter(api);
    if (cfg?.evmProvider) {
      this.adapters['Erc20'] = new Erc20BalanceAdapter(cfg?.evmProvider);
    }
  }

  getAssets(): ChainAsset[] {
    return this.assets;
  }

  getAsset(assetSymbol: string, assetType = 'Token'): ChainAsset | undefined {
    return this.assets.find((asset: ChainAsset) => asset.symbol == assetSymbol && asset.asset[assetType]);
  }

  subscribeBalance(assetSymbol: string, assetType = 'Token', address: string): Observable<AssetBalance> {
    const asset = this.validateAsset(assetSymbol, assetType);
    const adapter = this.validateAdapter(assetType);
    return adapter.getObserver(asset, address);
  }

  getBalance(assetSymbol: string, assetType = 'Token', address: string): Promise<AssetBalance> {
    const ob = this.subscribeBalance(assetSymbol, assetType, address);
    return firstValueFrom(ob);
  }

  private validateAsset(assetSymbol: string, assetType = 'Token'): ChainAsset {
    const asset = this.getAsset(assetSymbol, assetType);
    if (!asset) {
      throw new AssetNotFound(assetSymbol);
    }
    return asset;
  }

  private validateAdapter(assetType = 'Token'): BalanceAdapter {
    const adapter = this.adapters[assetType];
    if (!adapter) {
      throw new Error(`Balance adapter for asset type ${assetType} not configured`);
    }
    return adapter;
  }
}
