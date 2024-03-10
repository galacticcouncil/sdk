import { FeeConfigBuilder } from '@moonbeam-network/xcm-builder';
import { ChainTransferConfig } from '@moonbeam-network/xcm-config';
import { AnyChain, AssetAmount } from '@moonbeam-network/xcm-types';
import { toBigInt } from '@moonbeam-network/xcm-utils';

import { BalanceAdapter, TransferAdapter } from '../adapters';
import { EvmClient, EvmReconciler } from '../evm';
import { SubstrateService } from '../substrate';
import { isH160Address } from '../utils';

import { buildTransfer, getXcmDeliveryFee } from './TransferUtils';

export class TransferService {
  readonly balance: BalanceAdapter;
  readonly transfer: TransferAdapter;

  protected evmClient: EvmClient;
  protected evmReconciler: EvmReconciler;
  protected substrate: SubstrateService;

  constructor(
    evmClient: EvmClient,
    evmReconciler: EvmReconciler,
    substrate: SubstrateService
  ) {
    this.balance = new BalanceAdapter({ evmClient, substrate });
    this.transfer = new TransferAdapter({ evmClient, substrate });
    this.evmClient = evmClient;
    this.evmReconciler = evmReconciler;
    this.substrate = substrate;
  }

  async getBalance(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;
    const assetId = chain.getBalanceAssetId(asset);
    const isErc20 = isH160Address(assetId.toString());
    const evmAddr = isErc20
      ? await this.evmReconciler.toEvmAddress(address, this.substrate.api)
      : address;
    const balanceConfig = config.balance.build({
      address: evmAddr,
      asset: assetId,
    });
    return this.balance.read(asset, balanceConfig);
  }

  async getDestinationFee(
    transferConfig: ChainTransferConfig
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
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { config } = transferConfig;
    const cfg = buildTransfer(
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig
    );
    const fee = await this.transfer.getFee(address, amount, feeBalance, cfg);
    const feeConfig = config.fee;
    if (feeConfig) {
      const { amount, decimals } = fee;
      const xcmDeliveryFee = getXcmDeliveryFee(decimals, feeConfig);
      const totalFee = amount + xcmDeliveryFee;
      return fee.copyWith({ amount: totalFee });
    }
    return fee;
  }

  async getFeeBalance(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    if (config.fee) {
      const feeAsset = config.fee.asset;
      const feeAssetId = chain.getBalanceAssetId(feeAsset);
      const isErc20 = isH160Address(feeAssetId.toString());
      const evmAddr = isErc20
        ? await this.evmReconciler.toEvmAddress(address, this.substrate.api)
        : address;
      const feeBalanceConfig = config.fee.balance.build({
        address: evmAddr,
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
