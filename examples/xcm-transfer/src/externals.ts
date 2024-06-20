import { ExternalAsset } from '@galacticcouncil/sdk';
import { external } from '@galacticcouncil/xcm-cfg';
import {
  Asset,
  ChainAssetData,
  ConfigService,
} from '@galacticcouncil/xcm-core';

const defaultExternals = [
  '18', // DOTA
  '23', // PINK
  '30', // DED
];

export const externals: ExternalAsset[] = [
  {
    decimals: 10,
    id: '30',
    name: 'DED',
    origin: 1000,
    symbol: 'DED',
    internalId: '1000019',
  },
  {
    decimals: 10,
    id: '23',
    name: 'PINK',
    origin: 1000,
    symbol: 'PINK',
    internalId: '1000021',
  },
  {
    decimals: 4,
    id: '18',
    name: 'DOTA',
    origin: 1000,
    symbol: 'DOTA',
    internalId: '1000038',
  },
  {
    decimals: 10,
    id: '42069',
    name: 'STINK',
    origin: 1000,
    symbol: 'STINK',
    internalId: '1000034',
  },
  {
    decimals: 2,
    id: '420',
    name: 'BEEFY',
    origin: 1000,
    symbol: 'BEEFY',
    internalId: '1000036',
  },
  {
    decimals: 10,
    id: '31337',
    name: 'WUD',
    origin: 1000,
    symbol: 'WUD',
    internalId: '1000085',
  },
];

export function configureExternal(
  external: ExternalAsset[],
  configService: ConfigService
) {
  external.forEach((ext) => {
    if (ext.origin === 1000 && !defaultExternals.includes(ext.id)) {
      const assetData = buildAssetData(ext, '_ah_');
      console.log('Registering ' + assetData.asset.key);
      buildAssethubConfig(assetData, configService);
    }
  });
}

function buildAssetData(
  external: ExternalAsset,
  suffix: string
): ChainAssetData {
  const { decimals, id, symbol, internalId } = external;

  const key = symbol.toLowerCase();
  const asset = new Asset({
    key: key + suffix + id,
    originSymbol: symbol,
  });

  return {
    asset: asset,
    balanceId: internalId,
    decimals: decimals,
    id: id,
    palletInstance: 50,
  } as ChainAssetData;
}

function buildAssethubConfig(
  assetData: ChainAssetData,
  configService: ConfigService
) {
  const assethub = configService.getChain('assethub');
  const hydration = configService.getChain('hydradx');
  const { balanceId, ...base } = assetData;

  assethub.updateAsset(base);
  hydration.updateAsset(assetData);

  configService.updateAsset(assetData.asset);
  configService.updateChainAssetConfig(
    assethub,
    external.fromAhTemplate(assetData)
  );
  configService.updateChainAssetConfig(
    hydration,
    external.toAhTemplate(assetData)
  );
}
