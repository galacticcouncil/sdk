import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import { SuiBalance } from './SuiBalance';

const NATIVE_DECIMALS = 9;

export class Native extends SuiBalance {
  async getBalance(): Promise<bigint> {
    const { address } = this.config;
    const balance = await this.client.getBalance({
      owner: address,
      coinType: SUI_TYPE_ARG,
    });
    return BigInt(balance.totalBalance);
  }

  async getDecimals(): Promise<number> {
    return NATIVE_DECIMALS;
  }
}
