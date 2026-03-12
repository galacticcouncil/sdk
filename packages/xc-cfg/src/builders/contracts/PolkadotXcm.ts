import {
  addr,
  Abi,
  AnyChain,
  Asset,
  ContractConfig,
  ContractConfigBuilder,
  Parachain,
  Precompile,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

const { Ss58Addr } = addr;

function formatAssetIdToERC20(id: string) {
  if (id.startsWith('0x')) {
    return id;
  }

  if (!/^\d{38,39}$/.test(id)) {
    throw new Error(`Asset id: ${id} must be a string and have 38-39 digits`);
  }

  return `0xffffffff${BigInt(id).toString(16).padStart(32, '0')}`;
}

function getAssetERC20Address(chain: AnyChain, asset: Asset) {
  const assetId = chain.getAssetId(asset);
  return typeof assetId === 'string' ? formatAssetIdToERC20(assetId) : assetId;
}

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
