import {
  BalanceConfigBuilder,
  ContractConfig,
  SubstrateQueryConfig,
} from '@moonbeam-network/xcm-builder';
import { OrmlTokensAccountData } from '@polkadot/types/lookup';

export function BalanceBuilderV2() {
  return {
    substrate,
    evm,
  };
}

export function substrate() {
  return {
    ormlTokens,
  };
}

export function evm() {
  return {
    native,
  };
}

function native(): BalanceConfigBuilder {
  return {
    build: ({ address }) => {
      return new ContractConfig({
        address: address,
        args: [],
        func: 'eth_getBalance',
        module: 'Native',
      });
    },
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
