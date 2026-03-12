import {
  connectParachains,
  connectVertical,
  setupWithServer,
  StorageValues,
  BuildBlockMode,
} from '@acala-network/chopsticks';
import { createConfig } from '@acala-network/chopsticks-testing';
import { Parachain } from '@galacticcouncil/xcm-core';
import { ApiPromise, WsProvider } from '@polkadot/api';

import * as c from 'console';

import { initStorage } from './storage';
import { SetupCtx } from './types';

export async function createNetwork(parachain: Parachain): Promise<SetupCtx> {
  const wasm = 'wasm/hydradx_runtime.xcmV5.wasm';

  const config =
    parachain.key === 'hydration'
      ? createConfig({ endpoint: parachain.ws, wasmOverride: wasm })
      : createConfig({ endpoint: parachain.ws });
  const { chain, addr, close } = await setupWithServer(config);

  const url = `ws://${addr}`;
  const ws = new WsProvider(url, 3_000, undefined, config.timeout);
  const api = await ApiPromise.create({
    provider: ws,
    noInitWarn: true,
    types: {
      VersionedMultiLocation: {
        _enum: {
          V0: 'MultiLocationV0',
          V1: 'MultiLocationV1',
          V2: 'MultiLocationV2',
          V3: 'MultiLocationV3',
          V4: 'MultiLocationV4',
          V5: 'MultiLocationV4',
        },
      },
      VersionedXcm: {
        _enum: {
          V0: 'XcmV0',
          V1: 'XcmV1',
          V2: 'XcmV2',
          V3: 'XcmV3',
          V4: 'XcmV4',
          V5: 'XcmV4',
        },
      },
    },
  });

  const { specVersion } = api.consts.system.version;
  c.log(`🥢 ${parachain.name} spec: ${specVersion}`);

  const ctx = {
    url,
    chain,
    ws,
    api,
    dev: {
      newBlock: (param?: Partial<any>): Promise<string> => {
        return ws.send('dev_newBlock', [param]);
      },
      setStorage: (values: StorageValues, blockHash?: string) => {
        return ws.send('dev_setStorage', [values, blockHash]);
      },
      timeTravel: (date: string | number) => {
        return ws.send<number>('dev_timeTravel', [date]);
      },
      setHead: (hashOrNumber: string | number) => {
        return ws.send('dev_setHead', [hashOrNumber]);
      },
    },
    async teardown() {
      await api.disconnect();
      await close();
    },
    async pause() {
      await ws.send('dev_setBlockBuildMode', [BuildBlockMode.Instant]);
      setTimeout(
        () =>
          console.log(
            `Test paused. Polkadot.js apps URL: https://polkadot.js.org/apps/?rpc=${url}`
          ),
        100
      );
      return new Promise((_resolve) => {});
    },
  };

  const chainStorage = await initStorage(api, parachain);
  c.log('🥢 ' + parachain.name + ' storage ready.');
  await ctx.dev.setStorage(chainStorage);

  return {
    ...ctx,
    config: parachain,
  };
}

export async function createNetworks(chains: Parachain[]): Promise<SetupCtx[]> {
  const networks = await Promise.all(chains.map(createNetwork));
  const relaychain = networks.find(({ config }) => config.parachainId === 0);
  const parachains = networks.filter(({ config }) => config.parachainId > 0);

  await connectParachains(
    parachains.map(({ chain }) => chain),
    true
  );
  if (relaychain) {
    for (const parachain of parachains) {
      await connectVertical(relaychain.chain, parachain.chain);
    }
  }

  return networks;
}
