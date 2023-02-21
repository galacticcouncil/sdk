import { mkdirSync, existsSync, writeFileSync } from 'fs';

const XCMGAR_REPO = 'https://raw.githubusercontent.com/colorfulnotion/xcm-global-registry/main';
const RELAY_CHAINS = ['kusama', 'polkadot'];
const DEST = './src/registry/data';

function pairs2Map(pairs) {
  const result = new Map();
  pairs.forEach((pair) => result.set(pair[0], pair[1]));
  return result;
}

const writeJsonSync = (path, data) => {
  writeFileSync(path, JSON.stringify(data, null, 4));
};

const fetchPublicEndpoints = async (relay) => {
  const response = await fetch(`${XCMGAR_REPO}/publicEndpoints/${relay}_publicEndpoints.json`);
  return await response.json();
};

// TODO: Fetch XcAssets
const fetchXcAssets = async (relay, chainKey) => {
  const response = await fetch(`${XCMGAR_REPO}/xcAssets/${relay}/${chainKey}_xcAssets.json`);
  return await response.json();
};

const fetchAssets = async (relay, chainKey) => {
  const response = await fetch(`${XCMGAR_REPO}/assets/${relay}/${chainKey}_assets.json`);
  return await response.json();
};

const syncAssets = async (relay, chainKeys) => {
  const assets = await Promise.all(
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
  RELAY_CHAINS.forEach(async (relay) => {
    const fld = `${DEST}/${relay}`;
    if (!existsSync(fld)) {
      mkdirSync(fld);
    }
    const ENDPOINT_FILE_PATH = `${DEST}/${relay}/endpoints.json`;
    const endpoints = await fetchPublicEndpoints(relay);

    await syncAssets(relay, Object.keys(endpoints));

    writeJsonSync(ENDPOINT_FILE_PATH, Object.values(endpoints));
    console.log(`${relay} done ✅`);
  });
})();
