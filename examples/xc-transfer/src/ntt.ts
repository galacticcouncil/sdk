import {
  Asset,
  AssetRoute,
  ChainRoutes,
  NttDef,
  NttTokenDef,
} from '@galacticcouncil/xc-core';
import { builders, tags } from '@galacticcouncil/xc-cfg';

import { sign } from './signers';
import { xc } from './setup';

const { config, wallet } = xc;
const { ContractBuilder } = builders;
const { Tag } = tags;

/**
 * NTT test token — fill in the per-token NttManager deployments.
 *
 * Registries & routes are wired at runtime (both directions) for every
 * chain with a manager set. To discover deployment addresses of a live
 * NTT token: the VAA emitter on wormholescan is the transceiver, its
 * `nttManager()` view is the manager, the manager `token()` the token.
 */
const TOKEN = new Asset({ key: 'w', originSymbol: 'W' });

const DEPLOYMENTS: Record<
  string,
  { decimals: number; assetId?: string | number; def: NttTokenDef }
> = {
  ethereum: {
    decimals: 18,
    def: {
      token: 'INSERT_TOKEN',
      manager: 'INSERT_MANAGER',
      transceiver: {
        wormhole: 'INSERT_TRANSCEIVER',
      },
    },
  },
  base: {
    decimals: 18,
    def: {
      token: 'INSERT_TOKEN',
      manager: 'INSERT_MANAGER',
      transceiver: {
        wormhole: 'INSERT_TRANSCEIVER',
      },
    },
  },
  hydration: {
    decimals: 18,
    assetId: 'INSERT_ASSET_ID',
    def: {
      token: 'INSERT_TOKEN',
      manager: 'INSERT_MANAGER',
      transceiver: {
        wormhole: 'INSERT_TRANSCEIVER',
      },
    },
  },
};

const active = Object.entries(DEPLOYMENTS).filter(
  ([_, { def }]) => !def.manager.startsWith('INSERT')
);

// Register token asset, chain data, ntt deployments & routes
config.assets.set(TOKEN.key, TOKEN);
active.forEach(([key, { decimals, assetId, def }]) => {
  const chain = config.getChain(key);
  chain.assetsData.set(TOKEN.key, {
    asset: TOKEN,
    decimals: decimals,
    id: assetId ?? def.token,
  });
  if ('ntt' in chain && chain.ntt) {
    (chain.ntt as NttDef)[TOKEN.key] = def;
  }
});

active.forEach(([srcKey]) => {
  const srcChain = config.getChain(srcKey);
  const feeAsset = config.getAsset(srcKey === 'hydration' ? 'hdx' : 'eth')!;
  const nttRoutes = active
    .filter(([destKey]) => destKey !== srcKey)
    .map(
      ([destKey]) =>
        new AssetRoute({
          source: {
            asset: TOKEN,
            fee: {
              asset: feeAsset,
            },
          },
          destination: {
            chain: config.getChain(destKey),
            asset: TOKEN,
            fee: {
              amount: 0,
              asset: TOKEN,
            },
          },
          contract: ContractBuilder().Wormhole().Ntt().transfer(),
          tags: [Tag.Wormhole, Tag.Ntt],
        })
    );

  const chainRoutes = config.routes.get(srcKey);
  const routes = chainRoutes ? chainRoutes.getRoutes() : [];
  config.routes.set(
    srcKey,
    new ChainRoutes({
      chain: srcChain,
      routes: [...routes, ...nttRoutes],
    })
  );
});

// Define transfer constraints
const SRC_CHAIN = 'ethereum';
const DEST_CHAIN = 'hydration';
const SRC_ADDRESS = 'INSERT_ADDRESS';
const DEST_ADDRESS = SRC_ADDRESS;
const AMOUNT = '0.1';

async function transfer() {
  const srcChain = config.getChain(SRC_CHAIN);

  const transfer = await wallet.transfer(
    TOKEN,
    SRC_ADDRESS,
    SRC_CHAIN,
    DEST_ADDRESS,
    DEST_CHAIN
  );
  console.log(transfer);

  const status = await transfer.validate();
  console.log('Validations:', status);

  const [call, fee] = await Promise.all([
    transfer.buildCall(AMOUNT),
    transfer.estimateFee(AMOUNT),
  ]);
  console.log('Call:', call);
  console.log('Estimated fee:', [fee.toDecimal(), fee.originSymbol].join(' '));

  // Sign & send with browser wallet
  await sign(call, srcChain);
}

console.log('NTT chains wired:', active.map(([key]) => key));
console.log('Run ntt.transfer() from the console to build, sign & send.');

(window as any).ntt = { transfer };
