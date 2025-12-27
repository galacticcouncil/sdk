import {
  Abi,
  BalanceConfigBuilder,
  ContractConfig,
} from '@galacticcouncil/xc-core';

export function evm() {
  return {
    erc20,
    native,
  };
}

function native(): BalanceConfigBuilder {
  return {
    build: ({ address }) => {
      return new ContractConfig({
        abi: [],
        address: address,
        args: [],
        func: 'eth_getBalance',
        module: 'Native',
      });
    },
  };
}

function erc20(): BalanceConfigBuilder {
  return {
    build: ({ address, asset, chain }) => {
      const assetId = chain.getBalanceAssetId(asset);
      if (!assetId || typeof assetId !== 'string') {
        throw new Error(`Invalid contract address: ${asset}`);
      }

      return new ContractConfig({
        abi: Abi.Erc20,
        address: assetId,
        args: [address],
        func: 'balanceOf',
        module: 'Erc20',
      });
    },
  };
}
