import { EvmResolver } from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

const { H160, isEvmAccount } = h160;

export class HydrationEvmResolver implements EvmResolver {
  async toH160(ss58Addr: string): Promise<string> {
    if (!isEvmAccount(ss58Addr)) {
      throw new Error(
        `SS58 address is not an EVM-derived account: ${ss58Addr}`
      );
    }
    return H160.fromAccount(ss58Addr);
  }

  async toSS58(h160Addr: string): Promise<string> {
    return H160.toAccount(h160Addr);
  }
}
