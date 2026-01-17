import {
  addr,
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  Parachain,
  Precompile,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

import { getAssetERC20Address } from '../utils';

const { Ss58Addr } = addr;

export function PolkadotXcm() {
  return {
    transferAssetsToPara32: (): ContractConfigBuilder => ({
      build: async ({ address, amount, asset, destination, source }) => {
        const assetAddress = getAssetERC20Address(source.chain, asset);

        return new ContractConfig({
          abi: Abi.PolkadotXcm,
          address: Precompile.PolkadotXcm,
          args: [
            (destination.chain as Parachain).parachainId,
            Ss58Addr.getPubKey(address) as `0x${string}`,
            [{ asset: assetAddress, amount }],
            0,
          ],
          func: 'transferAssetsToPara32',
          module: 'PolkadotXcm',
        });
      },
    }),
    transferAssetsToPara32WithFee: (): ContractConfigBuilder => ({
      build: async ({ address, amount, asset, destination, source }) => {
        const assetAddress = getAssetERC20Address(source.chain, asset);
        const feeAssetAddress = getAssetERC20Address(
          source.chain,
          source.destinationFeeBalance
        );
        const feeAmount = big.toBigInt(
          destination.fee.amount,
          destination.fee.decimals
        );

        return new ContractConfig({
          abi: Abi.PolkadotXcm,
          address: Precompile.PolkadotXcm,
          args: [
            (destination.chain as Parachain).parachainId,
            Ss58Addr.getPubKey(address) as `0x${string}`,
            [
              { asset: assetAddress, amount },
              { asset: feeAssetAddress, amount: feeAmount },
            ],
            1,
          ],
          func: 'transferAssetsToPara32',
          module: 'PolkadotXcm',
        });
      },
    }),
  };
}
