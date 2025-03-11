import { setupContext } from '@acala-network/chopsticks-testing';

import * as c from 'console';

const wasmOverride = 'hydradx_runtime.compact.compressed.wasm';

const main = async () => {
  const ctx = await setupContext({
    endpoint: 'wss://rpc.hydradx.cloud',
    port: 17777,
    wasmOverride: ['wasm', wasmOverride].join('/'),
  });
};

main()
  .then(() => c.log('Chain ready ✅'))
  .catch(c.error);
