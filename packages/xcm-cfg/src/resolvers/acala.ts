import { EvmResolver } from '@galacticcouncil/xcm-core';

import { ApiPromise } from '@polkadot/api';
import { blake2AsU8a, decodeAddress } from '@polkadot/util-crypto';
import { u8aConcat, u8aEq, u8aToHex } from '@polkadot/util';

const ETH_PREFIX = 'evm:';

export class AcalaEvmResolver implements EvmResolver {
  async toH160(ss58Addr: string, api: ApiPromise): Promise<string> {
    const h160Addr = await api.query.evmAccounts.evmAddresses(ss58Addr);
    return h160Addr.isEmpty
      ? this.toDefaultH160(ss58Addr)
      : h160Addr.toString();
  }

  private toDefaultH160(ss58Addr: string) {
    const publicKey = decodeAddress(ss58Addr);
    const hasEvmPrefix = u8aEq(ETH_PREFIX, publicKey.slice(0, 4));
    if (hasEvmPrefix) {
      return u8aToHex(publicKey.slice(4, 24));
    }
    return u8aToHex(
      blake2AsU8a(u8aConcat(ETH_PREFIX, publicKey), 256).slice(0, 20)
    );
  }
}
