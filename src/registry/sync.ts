import fetch from 'node-fetch';
import { mkdirSync, existsSync } from 'fs';
import { writeJsonSync } from './utils';

const XCMGAR_REPO = 'https://raw.githubusercontent.com/colorfulnotion/xcm-global-registry/main';
const RELAY_CHAINS = ['kusama', 'polkadot'];

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
  const fld = `./registry/${relay}/xcAssets`;
  if (!existsSync(fld)) {
    mkdirSync(fld);
  }
  chainKeys
    .map((chainKey) => chainKey.replace('-', '_'))
    .forEach(async (chainKey) => {
      try {
        const xcAssets = await fetchXcAssets(relay, chainKey);
        const XC_ASSETS_FILE_PATH = `./registry/${relay}/xcAssets/${chainKey}_xcAssets.json`;
        writeJsonSync(XC_ASSETS_FILE_PATH, xcAssets);
      } catch (err) {}
    });
};

const syncAssets = async (relay: string, chainKeys: string[]) => {
  const fld = `./registry/${relay}/assets`;
  if (!existsSync(fld)) {
    mkdirSync(fld);
  }
  chainKeys
    .map((chainKey) => chainKey.replace('-', '_'))
    .forEach(async (chainKey) => {
      try {
        const xcAssets = await fetchAssets(relay, chainKey);
        const ASSETS_FILE_PATH = `./registry/${relay}/assets/${chainKey}_assets.json`;
        writeJsonSync(ASSETS_FILE_PATH, xcAssets);
      } catch (err) {}
    });
};

(async () => {
  RELAY_CHAINS.forEach(async (relay: string) => {
    const fld = `./registry/${relay}`;
    if (!existsSync(fld)) {
      mkdirSync(fld);
    }
    const ENDPOINT_FILE_PATH = `./registry/${relay}/endpoints.json`;
    const endpoints = await fetchPublicEndpoints(relay);

    await syncXcAssets(relay, Object.keys(endpoints));
    await syncAssets(relay, Object.keys(endpoints));

    writeJsonSync(ENDPOINT_FILE_PATH, endpoints);
    console.log(`${relay} done ✅`);
  });
})();
