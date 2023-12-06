import { FeeConfigBuilder } from '@moonbeam-network/xcm-builder';
import { ChainTransferConfig } from '@moonbeam-network/xcm-config';
import { AnyChain, AssetAmount } from '@moonbeam-network/xcm-types';
import { toBigInt } from '@moonbeam-network/xcm-utils';

import { BalanceAdapter, TransferAdapter } from '../adapters';
import { EvmClient } from '../evm';
import { SubstrateService } from '../substrate';

import { buildTransfer } from './TransferUtils';

export class TransferService {
  readonly balance: BalanceAdapter;
  readonly transfer: TransferAdapter;

  protected substrate: SubstrateService;

  constructor(evmClient: EvmClient, substrate: SubstrateService) {
    this.balance = new BalanceAdapter({ evmClient, substrate });
    this.transfer = new TransferAdapter({ evmClient, substrate });
    this.substrate = substrate;
  }

  async getBalance(
    address: string,
    transferConfig: ChainTransferConfig,
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;
    const assetId = chain.getBalanceAssetId(asset);
    const balanceConfig = config.balance.build({
      address: address,
      asset: assetId,
    });
    return this.balance.read(asset, balanceConfig);
  }

  async getDestinationFee(
    transferConfig: ChainTransferConfig,
  ): Promise<AssetAmount> {
    const { config } = transferConfig;
    const { asset, amount } = config.destinationFee;
    const decimals = this.substrate.getDecimals(asset);

    if (Number.isFinite(amount)) {
      return AssetAmount.fromAsset(asset, {
        amount: toBigInt(amount as number, decimals),
        decimals,
      });
    }

    const feeConfigBuilder = amount as FeeConfigBuilder;
    const feeConfig = feeConfigBuilder.build({
      api: this.substrate.api,
      asset: this.substrate.chain.getAssetId(asset),
    });
    const feeBalance = await feeConfig.call();
    return AssetAmount.fromAsset(asset, {
      amount: feeBalance,
      decimals,
    });
  }

  async getFee(
    address: string,
    amount: bigint,
    feeBalance: AssetAmount,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig,
  ): Promise<AssetAmount> {
    const config = buildTransfer(
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig,
    );
    return this.transfer.getFee(address, amount, feeBalance, config);
  }

  async getFeeBalance(
    address: string,
    transferConfig: ChainTransferConfig,
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    if (config.fee) {
      const feeAsset = config.fee.asset;
      const feeAssetId = chain.getBalanceAssetId(feeAsset);
      const feeBalanceConfig = config.fee.balance.build({
        address: address,
        asset: feeAssetId,
      });
      return this.balance.read(feeAsset, feeBalanceConfig);
    }
    return this.getBalance(address, transferConfig);
  }

  async getMin(transferConfig: ChainTransferConfig): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;
    if (config.min) {
      const minAssetId = chain.getMinAssetId(asset);
      const minBalanceConfig = config.min.build({
        asset: minAssetId,
      });
      return this.balance.read(asset, minBalanceConfig);
    }
    return this.getAssetMin(transferConfig);
  }

  async getAssetMin(transferConfig: ChainTransferConfig): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;
    const assetMin = chain.getAssetMin(asset);
    const decimals = this.substrate.getDecimals(asset);

    let balance: bigint = 0n;
    if (assetMin) {
      balance = toBigInt(assetMin, decimals);
    }

    return AssetAmount.fromAsset(asset, {
      amount: balance,
      decimals: decimals,
    });
  }
}
