import {
  BalanceConfigBuilder,
  ContractConfig,
  SubstrateQueryConfig,
} from '@moonbeam-network/xcm-builder';
import { OrmlTokensAccountData } from '@polkadot/types/lookup';
import { isString } from '@polkadot/util';

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
    build: ({ address, asset }) => {
      if (!asset || !isString(asset)) {
        throw new Error(`Invalid contract address: ${asset}`);
      }

      return new ContractConfig({
        address: asset,
        args: [address],
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
