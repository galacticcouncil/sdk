import type { OmniConnector, OmniUtxoChain } from './types';

/** Omni bridge (NEAR One) mainnet api. */
export const OMNI_BRIDGE_API = 'https://mainnet.api.bridge.nearone.org/api/v3';

/** Mainnet connectors; `minDeposit` mirrors `min_deposit_amount`. */
export const OMNI_CONNECTORS: Partial<Record<OmniUtxoChain, OmniConnector>> = {
  zcash: {
    account: 'zcash-connector.bridge.near',
    token: 'zec.omft.near',
    minDeposit: 100_000n,
  },
};
