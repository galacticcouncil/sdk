import { ChainTransferConfig, TransactInfo } from '@galacticcouncil/xcm-core';
import { FeeConfigBuilder } from '@moonbeam-network/xcm-builder';
import { AnyChain, AssetAmount } from '@moonbeam-network/xcm-types';
import { toBigInt } from '@moonbeam-network/xcm-utils';

import { BalanceAdapter, TransferAdapter } from '../adapters';
import { EvmClient, EvmReconciler } from '../evm';
import { SubstrateService } from '../substrate';
import { XCall } from '../types';
import { isH160Address } from '../utils';

import {
  buildTransact,
  buildTransfer,
  getXcmDeliveryFee,
} from './TransferUtils';

export class TransferService {
  private readonly balance: BalanceAdapter;
  private readonly transfer: TransferAdapter;

  readonly evmClient: EvmClient;
  readonly evmReconciler: EvmReconciler;
  readonly substrate: SubstrateService;

  constructor(
    evmClient: EvmClient,
    evmReconciler: EvmReconciler,
    substrate: SubstrateService
  ) {
    this.balance = new BalanceAdapter({ substrate, evmClient });
    this.transfer = new TransferAdapter({ substrate, evmClient });
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
    const account = isH160Address(assetId.toString())
      ? await this.evmReconciler.toEvmAddress(address, this.substrate.api)
      : address;
    const balanceConfig = config.balance.build({
      address: account,
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

  async getNetworkFee(
    address: string,
    amount: bigint,
    feeBalance: AssetAmount,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { config } = transferConfig;

    const transactInfo = config.transact
      ? await this.getTransactInfo(
          address,
          amount,
          destAddress,
          destChain,
          destFee,
          transferConfig
        )
      : undefined;

    const transfer = buildTransfer(
      address,
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig,
      transactInfo
    );

    const sender = config.contract
      ? await this.evmReconciler.toEvmAddress(address, this.substrate.api)
      : address;

    return this.transfer.getFee(sender, amount, feeBalance, transfer);
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
    const fee = await this.getNetworkFee(
      address,
      amount, // should be transfer fee
      feeBalance,
      destAddress,
      destChain,
      destFee,
      transferConfig
    );

    const xcmDeliveryFee = getXcmDeliveryFee(fee.decimals, config.fee);
    const totalFee = fee.amount + xcmDeliveryFee;
    return fee.copyWith({ amount: totalFee });
  }

  async getCall(
    address: string,
    amount: bigint,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig
  ): Promise<XCall> {
    const { config } = transferConfig;

    const transactInfo = config.transact
      ? await this.getTransactInfo(
          address,
          amount,
          destAddress,
          destChain,
          destFee,
          transferConfig
        )
      : undefined;

    const transfer = buildTransfer(
      address,
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig,
      transactInfo
    );
    return this.transfer.calldata(address, transfer);
  }

  async getFeeBalance(
    address: string,
    transferConfig: ChainTransferConfig
  ): Promise<AssetAmount> {
    const { chain, config } = transferConfig;

    if (!config.fee) {
      return this.getBalance(address, transferConfig);
    }

    const feeAsset = config.fee.asset;
    const feeAssetId = chain.getBalanceAssetId(feeAsset);
    const account = isH160Address(feeAssetId.toString())
      ? await this.evmReconciler.toEvmAddress(address, this.substrate.api)
      : address;
    const feeBalanceConfig = config.fee.balance.build({
      address: account,
      asset: feeAssetId,
    });
    return this.balance.read(feeAsset, feeBalanceConfig);
  }

  async getMin(transferConfig: ChainTransferConfig): Promise<AssetAmount> {
    const { chain, config } = transferConfig;
    const asset = config.asset;

    if (!config.min) {
      return this.getAssetMin(transferConfig);
    }

    const minAssetId = chain.getMinAssetId(asset);
    const minBalanceConfig = config.min.build({
      asset: minAssetId,
    });
    return this.balance.read(asset, minBalanceConfig);
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

  async getTransactInfo(
    address: string,
    amount: bigint,
    destAddress: string,
    destChain: AnyChain,
    destFee: AssetAmount,
    transferConfig: ChainTransferConfig
  ): Promise<TransactInfo | undefined> {
    const config = buildTransact(
      address,
      amount,
      destAddress,
      destChain,
      destFee,
      transferConfig
    );

    const proxyChain = transferConfig.config.transactVia;
    let extrinsic;
    if (proxyChain) {
      console.log('Routed via ' + proxyChain.key);
      const substrate = await SubstrateService.create(
        proxyChain,
        this.substrate.config
      );
      extrinsic = substrate.getExtrinsic(config);
    } else {
      extrinsic = this.substrate.getExtrinsic(config);
    }

    const { weight } = await extrinsic.paymentInfo(address);
    return {
      call: extrinsic.method.toHex(),
      weight: {
        refTime: weight.refTime.toNumber(),
        proofSize: weight.proofSize.toString(),
      },
    } as TransactInfo;
  }
}
