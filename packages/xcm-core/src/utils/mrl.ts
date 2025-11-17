import { getSs58AddressInfo, compactNumber } from '@polkadot-api/substrate-bindings';
import { toHex, fromHex } from '@polkadot-api/utils';

import { Parachain } from '../chain';

/**
 * Manually encode VersionedUserAction with XcmRoutingUserAction containing VersionedMultiLocation
 * Structure:
 * - VersionedUserAction: Enum { V1: XcmRoutingUserAction }
 * - XcmRoutingUserAction: Struct { destination: VersionedMultiLocation }
 * - VersionedMultiLocation: Enum { V5: MultiLocation }
 */

interface EncodedPayload {
  bytes: Uint8Array;
  toHex(): string;
  toU8a(): Uint8Array;
}

export function createPayload(
  parachain: Parachain,
  address: string,
  isEthereumStyle = false
): EncodedPayload {
  const bytes: number[] = [];

  // VersionedUserAction enum variant: V1 = 0
  bytes.push(0);

  // XcmRoutingUserAction.destination = VersionedMultiLocation
  // VersionedMultiLocation enum variant: V5 = 5
  bytes.push(5);

  // MultiLocation.parents: u8
  bytes.push(1);

  // MultiLocation.interior: Junctions = X2
  // Junctions enum: Here=0, X1=1, X2=2, ... X8=8
  bytes.push(2); // X2

  // First junction: Parachain(u32 compact)
  // Junction enum variant Parachain = 0
  bytes.push(0);
  const parachainIdCompact = compactNumber.enc(parachain.parachainId);
  bytes.push(...parachainIdCompact);

  // Second junction: AccountId32 or AccountKey20
  if (isEthereumStyle) {
    // AccountKey20 variant = 3
    bytes.push(3);

    // AccountKey20 { network: Option<NetworkId>, key: [u8; 20] }
    // network: Option<NetworkId> = None = 0
    bytes.push(0);

    // key: 20 bytes (remove 0x prefix)
    const keyBytes = fromHex(address.startsWith('0x') ? address.slice(2) : address);
    if (keyBytes.length !== 20) {
      throw new Error(`Invalid Ethereum address length: ${keyBytes.length}`);
    }
    bytes.push(...keyBytes);
  } else {
    // AccountId32 variant = 1
    bytes.push(1);

    // AccountId32 { network: Option<NetworkId>, id: [u8; 32] }
    // network: Option<NetworkId> = None = 0
    bytes.push(0);

    // Decode SS58 address to get public key
    const info = getSs58AddressInfo(address);
    if (!info.isValid || info.publicKey.length !== 32) {
      throw new Error('Invalid SS58 address');
    }

    // id: 32 bytes
    bytes.push(...info.publicKey);
  }

  const encodedBytes = new Uint8Array(bytes);

  return {
    bytes: encodedBytes,
    toHex(): string {
      return toHex(encodedBytes);
    },
    toU8a(): Uint8Array {
      return encodedBytes;
    }
  };
}

/**
 * Decode a VersionedMultiLocation hex string to JSON
 * Note: This decodes the payload part after stripping the VersionedUserAction wrapper
 */
export function decodePayload(payloadHex: string): any {
  // Remove '0x' prefix if present
  const hex = payloadHex.startsWith('0x') ? payloadHex.slice(2) : payloadHex;

  // Remove VersionedUserAction enum variant byte (first byte = 00)
  const cleaned = hex.startsWith('00') ? hex.slice(2) : hex;

  const bytes = fromHex(cleaned);
  let pos = 0;

  // Read VersionedMultiLocation enum variant
  const version = bytes[pos++];

  if (version !== 5) {
    throw new Error(`Unsupported MultiLocation version: ${version}`);
  }

  // Read MultiLocation
  const parents = bytes[pos++];

  // Read Junctions enum variant
  const junctionsVariant = bytes[pos++];

  if (junctionsVariant !== 2) {
    throw new Error(`Unsupported Junctions variant: ${junctionsVariant}`);
  }

  // Read first junction (Parachain)
  const junction1Variant = bytes[pos++];
  if (junction1Variant !== 0) {
    throw new Error(`Expected Parachain junction, got: ${junction1Variant}`);
  }

  // Decode compact parachain ID
  // First, calculate compact encoding length based on first byte
  const firstByte = bytes[pos];
  const mode = firstByte & 0b11;
  let compactLen: number;
  if (mode === 0) {
    compactLen = 1; // single byte
  } else if (mode === 1) {
    compactLen = 2; // two bytes
  } else if (mode === 2) {
    compactLen = 4; // four bytes
  } else {
    // mode === 3: big integer, length encoded in first byte
    compactLen = ((firstByte >> 2) & 0b111111) + 4;
  }

  // Extract exactly the compact-encoded bytes
  const compactBytes = bytes.slice(pos, pos + compactLen);
  const parachainId = compactNumber.dec(compactBytes);
  pos += compactLen;

  // Read second junction
  const junction2Variant = bytes[pos++];

  let accountInfo: any;

  if (junction2Variant === 1) {
    // AccountId32 { network: Option<NetworkId>, id: [u8; 32] }
    const network = bytes[pos++];
    const id = toHex(bytes.subarray(pos, pos + 32));
    pos += 32;

    accountInfo = {
      accountId32: {
        id,
        network: network === 0 ? null : network,
      },
    };
  } else if (junction2Variant === 3) {
    // AccountKey20 { network: Option<NetworkId>, key: [u8; 20] }
    const network = bytes[pos++];
    const key = toHex(bytes.subarray(pos, pos + 20));
    pos += 20;

    accountInfo = {
      accountKey20: {
        key,
        network: network === 0 ? null : network,
      },
    };
  } else {
    throw new Error(`Unsupported junction variant: ${junction2Variant}`);
  }

  return {
    v5: {
      interior: {
        x2: [
          { parachain: parachainId },
          accountInfo,
        ],
      },
      parents,
    },
  };
}
