import fetch from 'node-fetch';
import { mkdirSync, existsSync } from 'fs';
import { pairs2Map, writeJsonSync } from './utils';

const XCMGAR_REPO = 'https://raw.githubusercontent.com/colorfulnotion/xcm-global-registry/main';
const RELAY_CHAINS = ['kusama', 'polkadot'];
const DEST = './src/registry/data';

const fetchPublicEndpoints = async (relay: string) => {
  const response = await fetch(`${XCMGAR_REPO}/publicEndpoints/${relay}_publicEndpoints.json`);
  return await response.json();
};

const fetchXcAssets = async (relay: string, chainKey: string) => {
  const response = await fetch(`${XCMGAR_REPO}/xcAssets/${relay}/${chainKey}_xcAssets.json`);
  return await response.json();
};

const fetchAssets = async (relay: string, chainKey: string) => {
  const response = await fetch(`${XCMGAR_REPO}/assets/${relay}/${chainKey}_assets.json`);
  return await response.json();
};

const syncXcAssets = async (relay: string, chainKeys: string[]) => {
  const fld = `${DEST}/${relay}/xcAssets`;
  if (!existsSync(fld)) {
    mkdirSync(fld);
  }
  chainKeys
    .map((chainKey) => chainKey.replace('-', '_'))
    .forEach(async (chainKey) => {
      try {
        const xcAssets = await fetchXcAssets(relay, chainKey);
        const XC_ASSETS_FILE_PATH = `${DEST}/${relay}/xcAssets/${chainKey}_xcAssets.json`;
        writeJsonSync(XC_ASSETS_FILE_PATH, xcAssets);
      } catch (err) {}
    });
};

const syncAssets = async (relay: string, chainKeys: string[]) => {
  const assets: [string, any][] = await Promise.all(
    chainKeys
      .map((chainKey) => chainKey.replace('-', '_'))
      .map(async (chainKey) => {
        let assets = [];
        try {
          assets = await fetchAssets(relay, chainKey);
        } catch (err) {}
        return [chainKey.replace(`${relay}_`, ''), assets];
      })
  );

  const assetMap = pairs2Map(assets);
  const ASSETS_FILE_PATH = `${DEST}/${relay}/assets.json`;
  writeJsonSync(ASSETS_FILE_PATH, Object.fromEntries(assetMap));
};

(async () => {
  RELAY_CHAINS.forEach(async (relay: string) => {
    const fld = `${DEST}/${relay}`;
    if (!existsSync(fld)) {
      mkdirSync(fld);
    }
    const ENDPOINT_FILE_PATH = `${DEST}/${relay}/endpoints.json`;
    const endpoints = await fetchPublicEndpoints(relay);

    //await syncXcAssets(relay, Object.keys(endpoints));
    await syncAssets(relay, Object.keys(endpoints));

    writeJsonSync(ENDPOINT_FILE_PATH, Object.values(endpoints));
    console.log(`${relay} done ✅`);
  });
})();
