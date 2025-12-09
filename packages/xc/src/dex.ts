import { ConfigService, Dex, Parachain } from '@galacticcouncil/xc-core';
import { dex } from '@galacticcouncil/xc-cfg';

import { createSdkContext } from '@galacticcouncil/sdk-next';

import { XcOpts } from './types';

type DexBootstrap = (chain: Parachain, opts: XcOpts) => Promise<Dex>;

const bootstrap: Record<string, DexBootstrap> = {
  hydration: async (chain, { pool }) => {
    if (!pool) {
      const { ctx } = await createSdkContext(chain.client);
      return new dex.HydrationDex(chain, ctx.pool);
    }
    return new dex.HydrationDex(chain, pool);
  },

  assethub: async (chain) => {
    return new dex.AssethubDex(chain);
  },
};

export async function registerDexes(
  config: ConfigService,
  opts: XcOpts = {}
): Promise<void> {
  await Promise.all(
    Object.entries(bootstrap).map(async ([chainId, bootstrap]) => {
      const chain = config.getChain(chainId) as Parachain;
      const dex = await bootstrap(chain, opts);
      chain.registerDex(dex);
    })
  );
}
