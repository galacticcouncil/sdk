import { h160 } from '@galacticcouncil/common';
import { EvmResolver } from '@galacticcouncil/xc-core';
import { AccountId, PolkadotClient } from 'polkadot-api';

const { isEvmAccount, H160 } = h160;

export class HydrationEvmResolver implements EvmResolver {
  async toH160(ss58Addr: string, api?: PolkadotClient): Promise<string> {
    if (isEvmAccount(ss58Addr)) {
      return H160.fromAccount(ss58Addr);
    }

    // Substrate native account. Truncated H160 is usable only when the
    // account is bound on chain (EVMAccounts.AccountExtension), otherwise
    // evm balances & fees resolve to the unrelated ETH\0 phantom account.
    const truncated = H160.fromSS58(ss58Addr);
    if (api && (await this.isBound(api, truncated, ss58Addr))) {
      return truncated;
    }
    throw new Error(
      `Account ${ss58Addr} is not an EVM (ETH\\0 prefixed) account nor bound to its EVM address`
    );
  }

  private async isBound(
    api: PolkadotClient,
    evmAddress: string,
    ss58Addr: string
  ): Promise<boolean> {
    const unsafeApi = api.getUnsafeApi();
    const extension =
      await unsafeApi.query.EVMAccounts.AccountExtension.getValue(evmAddress);
    if (!extension) {
      return false;
    }
    // Bound account id = truncated H160 (20 bytes) + stored last 12 bytes.
    // Both sides are wrapped: the browser Buffer polyfill rejects a plain
    // Uint8Array argument, unlike node.
    const publicKey = AccountId().enc(ss58Addr);
    const last12 = this.asBytes(extension);
    return Buffer.from(last12).equals(Buffer.from(publicKey.subarray(20)));
  }

  private asBytes(fixedBinary: unknown): Uint8Array {
    if (fixedBinary instanceof Uint8Array) {
      return fixedBinary;
    }
    if (typeof fixedBinary === 'string') {
      return Buffer.from(fixedBinary.replace('0x', ''), 'hex');
    }
    return (fixedBinary as { asBytes(): Uint8Array }).asBytes();
  }
}
