import { ConfigService, Dex, Parachain } from '@galacticcouncil/xc-core';
import { dex } from '@galacticcouncil/xc-cfg';

import { createSdkContext } from '@galacticcouncil/sdk-next';

import { XcOpts } from './types';

type DexBootstrap = (chain: Parachain, opts: XcOpts) => Promise<Dex>;

const bootstrap: Record<string, DexBootstrap> = {
  hydration: async (chain, { poolCtx }) => {
    if (!poolCtx) {
      const { ctx } = await createSdkContext(chain.client);
      return new dex.HydrationDex(chain, ctx.pool);
    }
    return new dex.HydrationDex(chain, poolCtx);
  },

  assethub: async (chain) => {
    return new dex.AssethubDex(chain);
  },
};

// chains that share another chain's runtime and reuse its dex
const dexAlias: Record<string, string> = {
  assethub_cex: 'assethub',
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

  // reuse a sibling chain's dex for chains sharing its runtime
  for (const [alias, target] of Object.entries(dexAlias)) {
    const chain = config.chains.get(alias) as Parachain | undefined;
    chain?.registerDex(config.getChain(target).dex);
  }
}
