import {
  IOfflinePoolServiceDataSource,
  PersistentAsset,
} from '../types';

export class AssetOfflineClient {
  private SUPPORTED_TYPES = [
    'StableSwap',
    'Bond',
    'Token',
    'External',
    'Erc20',
  ];

  private readonly persistentAssets: Map<string, PersistentAsset> = new Map([]);

  constructor(dataSource: IOfflinePoolServiceDataSource) {
    this.persistentAssets = new Map(dataSource.assets.map((a) => [a.id, a]));
  }

  private getSystemTokenName(chainToken: string) {
    switch (chainToken) {
      case 'HDX':
        return 'Hydration';
      case 'BSX':
        return 'Basilisk';
      default:
        return chainToken;
    }
  }

  private getSupportedAssets(assets: PersistentAsset[]) {
    return assets.filter((a) => {
      return this.isSupportedAsset(a);
    });
  }

  getOnChainAssets(includeInvalid?: boolean): PersistentAsset[] {
    const supportedAssets = this.getSupportedAssets(
      Array.from(this.persistentAssets.values())
    );

    return includeInvalid
      ? supportedAssets
      : supportedAssets.filter((a) => this.isValidAsset(a));
  }

  private isValidAsset(asset: PersistentAsset): boolean {
    const decimalSign = Math.sign(asset.decimals);
    return !!asset.symbol && (decimalSign === 0 || decimalSign === 1);
  }

  private isSupportedAsset(details: PersistentAsset): boolean {
    const type = details.type.toString();
    return this.SUPPORTED_TYPES.includes(type);
  }
}
