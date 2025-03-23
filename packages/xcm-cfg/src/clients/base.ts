import { Asset, Parachain } from '@galacticcouncil/xcm-core';

import {
  FrameSystemAccountInfo,
  OrmlTokensAccountData,
  PalletBalancesAccountData,
} from '@polkadot/types/lookup';

export class BaseClient {
  readonly chain: Parachain;

  constructor(chain: Parachain) {
    this.chain = chain;
  }

  async getSystemAccountBalance(address: string): Promise<bigint> {
    const api = await this.chain.api;
    const response =
      await api.query.system.account<FrameSystemAccountInfo>(address);
    const balance = response.data as PalletBalancesAccountData;
    const { free, frozen } = balance;
    return BigInt(free.sub(frozen).toString());
  }

  async getTokensAccountsBalance(
    address: string,
    asset: string
  ): Promise<bigint> {
    const api = await this.chain.api;
    const response = await api.query.tokens.accounts<OrmlTokensAccountData>(
      address,
      asset
    );
    const { free, frozen } = response;
    return BigInt(free.sub(frozen).toString());
  }

  async calculateDestinationFee(xcm: any, asset: Asset): Promise<bigint> {
    const api = await this.chain.api;
    const weight = await api.call.xcmPaymentApi.queryXcmWeight(xcm);

    if (!weight.isOk) {
      throw Error(`Can't query XCM weight.`);
    }

    const feeAssetLocation = this.chain.getAssetXcmLocation(asset);
    const feeInAsset = await api.call.xcmPaymentApi.queryWeightToAssetFee(
      weight.asOk,
      {
        V4: feeAssetLocation,
      }
    );

    if (!feeInAsset.isOk) {
      throw Error(`Can't convert weight to fee in ${asset.originSymbol}`);
    }

    return feeInAsset.asOk.toBigInt();
  }
}
