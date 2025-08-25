import { ApiPromise, WsProvider } from '@polkadot/api';

import {
  createSdkContext,
  findNestedKey,
  Asset,
  ExternalAsset,
} from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

const ASSETHUB_TREASURY_ADDRESS =
  '13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB';

type RawAsset = Omit<ExternalAsset, 'internalId'>;

class GetAllAssetsExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, client, ctx } = createSdkContext(apiPromise);

    const hubAssets = await fetchHubAssets();

    const getGeneralIndex = (asset: Asset) => {
      const entry = findNestedKey(asset.location, 'generalIndex');
      return entry && entry.generalIndex.toString();
    };

    const assets = await client.asset.getOnChainAssets(true);
    const externals = assets
      .filter((a) => a.type === 'External')
      .map((a) => {
        const extId = getGeneralIndex(a);
        const ext = hubAssets.get(extId);
        return {
          ...ext,
          internalId: a.id,
        } as ExternalAsset;
      });

    await ctx.pool.syncRegistry(externals);
    const pools = await api.router.getPools();

    const dollarPeggedAsset = '10';

    const ids = ctx.pool.assets.map((a) => a.id).sort();
    const [tradeable, routable] = await Promise.all([
      api.router.getAllAssets(),
      api.router.getRouteableAssets(dollarPeggedAsset),
    ]);

    console.log(
      'all: ' + ids.length,
      'routable: ' + routable.length,
      'tradeable: ' + tradeable.length,
      'pools: ' + pools.length
    );

    apiPromise.rpc.chain.subscribeNewHeads(async () => {
      const start = performance.now();
      await api.router.getBestSpotPrices(dollarPeggedAsset);
      console.log('spot:', performance.now() - start);
    });
  }
}

const fetchHubAssets = async () => {
  const provider = new WsProvider('wss://asset-hub-polkadot-rpc.n.dwellir.com');
  const api = await ApiPromise.create({ provider });

  const [dataRaw, assetsRaw] = await Promise.all([
    api.query.assets.metadata.entries(),
    api.query.assets.asset.entries(),
  ]);

  const hubAssets = new Map<string, RawAsset>();
  dataRaw.forEach(([key, dataRaw]) => {
    const id = key.args[0].toString();
    const data = dataRaw;

    const asset = assetsRaw.find((asset) => asset[0].args.toString() === id);

    const supply = asset?.[1].unwrap().supply.toString();
    const admin = asset?.[1].unwrap().admin.toString();
    const owner = asset?.[1].unwrap().owner.toString();
    const isWhiteListed =
      admin === ASSETHUB_TREASURY_ADDRESS &&
      owner === ASSETHUB_TREASURY_ADDRESS;

    hubAssets.set(id, {
      id,
      decimals: data.decimals.toNumber(),
      symbol: Buffer.from(data.symbol.toHex().slice(2), 'hex').toString('utf8'),
      name: Buffer.from(data.name.toHex().slice(2), 'hex').toString('utf8'),
      supply,
      origin: 1000,
      isWhiteListed,
      admin,
      owner,
    } as RawAsset);
  });

  api.disconnect();
  return hubAssets;
};

function timed<T>(
  name: string,
  p: Promise<T>
): Promise<{ name: string; dur: number; result: T }> {
  const start = performance.now();
  return p.then(
    (result) => ({ name, dur: performance.now() - start, result }),
    (err) => {
      throw { name, dur: performance.now() - start, err };
    }
  );
}

new GetAllAssetsExample(
  ApiUrl.Hydration,
  'Get all assets (external included)',
  true
).run();
