import {
  BalanceConfigBuilder,
  SubstrateQueryConfig,
} from '@moonbeam-network/xcm-builder';
import { OrmlTokensAccountData } from '@polkadot/types/lookup';

export function BalanceBuilderV2() {
  return {
    substrate,
  };
}

export function substrate() {
  return {
    ormlTokens,
  };
}

function ormlTokens() {
  return {
    accounts: (): BalanceConfigBuilder => ({
      build: ({ address, asset }) =>
        new SubstrateQueryConfig({
          module: 'ormlTokens',
          func: 'accounts',
          args: [address, asset],
          transform: async ({
            free,
            frozen,
          }: OrmlTokensAccountData): Promise<bigint> =>
            BigInt(free.sub(frozen).toString()),
        }),
    }),
  };
}
