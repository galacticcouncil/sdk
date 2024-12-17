import { u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

export function getExtrinsicAccount(address: string) {
  const isEthAddress = address.length === 42 && address.startsWith('0x');

  return isEthAddress
    ? {
        AccountKey20: {
          key: address,
        },
      }
    : {
        AccountId32: {
          id: u8aToHex(decodeAddress(address)),
          network: null,
        },
      };
}
