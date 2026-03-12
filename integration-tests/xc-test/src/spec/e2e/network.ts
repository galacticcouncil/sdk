import {
  connectParachains,
  connectVertical,
  setupWithServer,
  BuildBlockMode,
} from '@acala-network/chopsticks';
import { createConfig } from '@acala-network/chopsticks-testing';
import { Parachain } from '@galacticcouncil/xc-core';

import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider';

import * as c from 'console';

import { initStorage } from './storage';
import { SetupCtx } from './types';

export async function createNetwork(
  parachain: Parachain,
  wasmOverrides?: Record<string, string>
): Promise<SetupCtx> {
  const wasm = wasmOverrides?.[parachain.key];

  const config = wasm
    ? createConfig({ endpoint: parachain.ws, wasmOverride: wasm })
    : createConfig({ endpoint: parachain.ws });
  const { chain, addr, close } = await setupWithServer(config);

  const url = `ws://${addr}`;
  const provider = getWsProvider(url);
  const client = createClient(provider);

  const properties = await client._request<{
    tokenDecimals: number[];
    tokenSymbol: string[];
  }>('system_properties', []);

  const chainName = await client._request<string>('system_name', []);
  c.log(`🥢 ${parachain.name} (${chainName}) connected`);

  // Wait for papi chainHead_v1 subscription to be ready (runtime metadata loaded)
  const CHAIN_HEAD_TIMEOUT = 60_000;
  await Promise.race([
    client.getFinalizedBlock(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${parachain.name} chainHead timed out after ${CHAIN_HEAD_TIMEOUT / 1000}s`)),
        CHAIN_HEAD_TIMEOUT
      )
    ),
  ]);
  c.log(`🥢 ${parachain.name} chainHead ready.`);

  const dev = {
    newBlock: (param?: Partial<any>): Promise<string> => {
      return client._request('dev_newBlock', [param ?? {}]);
    },
    setStorage: (values: any, blockHash?: string): Promise<any> => {
      const serializable = JSON.parse(
        JSON.stringify(values, (_k, v) =>
          typeof v === 'bigint' ? v.toString() : v
        )
      );
      return client._request('dev_setStorage', [serializable, blockHash]);
    },
    timeTravel: (date: string | number): Promise<number> => {
      return client._request('dev_timeTravel', [date]);
    },
    setHead: (hashOrNumber: string | number): Promise<any> => {
      return client._request('dev_setHead', [hashOrNumber]);
    },
  };

  const chainDecimals = properties?.tokenDecimals?.[0] ?? 12;
  const chainStorage = initStorage(chainDecimals, parachain);
  c.log('🥢 ' + parachain.name + ' storage ready.');
  await dev.setStorage(chainStorage);

  return {
    url,
    chain,
    client,
    dev,
    config: parachain,
    async teardown() {
      client.destroy();
      await close();
    },
    async pause() {
      await client._request('dev_setBlockBuildMode', [BuildBlockMode.Instant]);
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
}

export async function createNetworks(
  chains: Parachain[],
  wasmOverrides?: Record<string, string>
): Promise<SetupCtx[]> {
  const networks = await Promise.all(
    chains.map((c) => createNetwork(c, wasmOverrides))
  );
  const relaychain = networks.find(({ config }) => config.parachainId === 0);
  const parachains = networks.filter(({ config }) => config.parachainId > 0);

  await connectParachains(parachains.map(({ chain }) => chain));
  if (relaychain) {
    for (const parachain of parachains) {
      await connectVertical(relaychain.chain, parachain.chain);
    }
  }

  return networks;
}
