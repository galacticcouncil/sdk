import { ExternalAsset } from '@galacticcouncil/sdk';
import { templates } from '@galacticcouncil/xcm-cfg';
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
    id: '17',
    internalId: '1000082',
    name: 'dog wif dots',
    origin: 1000,
    symbol: 'WIFD',
  },
  {
    decimals: 4,
    id: '18',
    internalId: '1000038',
    name: 'DOTA',
    origin: 1000,
    symbol: 'DOTA',
  },
  {
    decimals: 10,
    id: '23',
    internalId: '1000021',
    name: 'PINK',
    origin: 1000,
    symbol: 'PINK',
  },
  {
    decimals: 10,
    id: '30',
    internalId: '1000019',
    name: 'DED',
    origin: 1000,
    symbol: 'DED',
  },
  {
    decimals: 20,
    id: '32',
    internalId: '1000120',
    name: 'ClayOnDot',
    origin: 1000,
    symbol: 'CLAY',
  },
  {
    decimals: 2,
    id: '420',
    internalId: '1000036',
    name: 'BEEFY',
    origin: 1000,
    symbol: 'BEEFY',
  },
  {
    decimals: 10,
    id: '8889',
    internalId: '1000091',
    name: 'BANDIT the CAT',
    origin: 1000,
    symbol: 'BNDT',
  },
  {
    decimals: 10,
    id: '31337',
    internalId: '1000085',
    name: 'WUD',
    origin: 1000,
    symbol: 'WUD',
  },
  {
    decimals: 10,
    id: '42069',
    internalId: '1000034',
    name: 'STINK',
    origin: 1000,
    symbol: 'STINK',
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
  const hydration = configService.getChain('hydration');
  const { balanceId, ...base } = assetData;

  assethub.updateAsset(base);
  hydration.updateAsset(assetData);

  configService.updateAsset(assetData.asset);
  configService.updateChainAssetConfig(
    assethub,
    templates.assethub.toHydrationExtTemplate(assetData.asset)
  );
  configService.updateChainAssetConfig(
    hydration,
    templates.hydration.toAssethubExtTemplate(assetData.asset)
  );
}
