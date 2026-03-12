import { setupContext } from '@acala-network/chopsticks-testing';

import * as c from 'console';

const wasmOverride = 'hydradx_runtime.pegs.wasm';

const main = async () => {
  const ctx = await setupContext({
    endpoint: 'wss://hydration-rpc.n.dwellir.com',
    port: 17777,
    //wasmOverride: ['wasm', wasmOverride].join('/'),
  });
  const block = await ctx.chain.getBlock();
  if (block) {
    console.log('Setting HEAD at', block.number);
    ctx.dev.setHead(block.number);
  }
  console.log(ctx.api.runtimeVersion.toHuman());
};

main()
  .then(() => c.log('Chain ready ✅'))
  .catch(c.error);
