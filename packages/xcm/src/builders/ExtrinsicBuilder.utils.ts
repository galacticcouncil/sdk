import { XcmVersion } from '@moonbeam-network/xcm-builder';
import { AnyChain } from '@moonbeam-network/xcm-types';
import { SubmittableExtrinsicFunction } from '@polkadot/api/types';
import { getTypeDef } from '@polkadot/types';
import { hexToU8a, isHex, u8aToHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

export function getExtrinsicArgumentVersion(
  func?: SubmittableExtrinsicFunction<'promise'>,
  index: number = 0
): XcmVersion {
  if (!func) return XcmVersion.v1;

  const { type } = func.meta.args[index];
  const instance = func.meta.registry.createType(type.toString());
  const raw = getTypeDef(instance?.toRawType());

  if (!raw.sub) {
    return XcmVersion.v1;
  }

  const versions = Array.isArray(raw.sub) ? raw.sub.map((x) => x.name) : [raw.sub.name];

  if (versions.includes(XcmVersion.v3)) {
    return XcmVersion.v3;
  }

  if (versions.includes(XcmVersion.v2)) {
    return XcmVersion.v2;
  }

  if (versions.includes(XcmVersion.v1)) {
    return XcmVersion.v1;
  }

  throw new Error("Can't find Xcm version");
}

export function getDestinationMultilocation(address: string, destination: AnyChain) {
  if (isValidAddressPolkadotAddress(address)) {
    const accountId32 = '0x' + u8aToHex(decodeAddress(address), -1, false);
    return {
      AccountId32: {
        network: null,
        id: accountId32,
      },
    };
  }
  return {
    AccountKey20: {
      network: 'Any',
      key: address,
    },
  };
}

export function getDestinationMultilocation2(address: string, destination: AnyChain) {
  if (destination.isEvmParachain()) {
    return {
      AccountKey20: {
        network: 'Any',
        key: address,
      },
    };
  }

  const accountId32 = '0x' + u8aToHex(decodeAddress(address), -1, false);
  return {
    AccountId32: {
      network: null,
      id: accountId32,
    },
  };
}

function isValidAddressPolkadotAddress(address: string) {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    return true;
  } catch (error) {
    return false;
  }
}
