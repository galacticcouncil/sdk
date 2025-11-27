import { Codec, getTypedCodecs, FixedSizeBinary } from 'polkadot-api';
import { getSs58AddressInfo } from '@polkadot-api/substrate-bindings';
import { toHex, fromHex } from '@polkadot-api/utils';
import { Struct, Enum } from 'scale-ts';
import {
  XcmVersionedLocation,
  XcmV3Junction,
  XcmV3Junctions,
  hydration,
} from '@polkadot-api/descriptors';

import { Parachain } from '../chain';

type XcmRoutingUserAction = {
  destination: XcmVersionedLocation;
};

type VersionedUserAction = {
  tag: 'V1';
  value: XcmRoutingUserAction;
};

interface EncodedPayload {
  bytes: Uint8Array;
  toHex(): string;
  toU8a(): Uint8Array;
}

async function getVersionedUserActionCodec(
  parachain: Parachain
): Promise<Codec<VersionedUserAction>> {
  try {
    const codecs = await getTypedCodecs(hydration);
    const destCodec = codecs.tx.PolkadotXcm.send.inner.dest;

    const XcmRoutingUserActionCodec = Struct({
      destination: destCodec,
    }) as Codec<XcmRoutingUserAction>;

    const VersionedUserActionCodec = Enum({
      V1: XcmRoutingUserActionCodec,
    }) as Codec<VersionedUserAction>;

    return VersionedUserActionCodec;
  } catch (error) {
    throw new Error(
      `Failed to get codec for parachain ${parachain.key}: ${error}`
    );
  }
}

/**
 * Create XCM location based on parachain configuration and address
 */
function createXcmLocation(
  parachain: Parachain,
  address: string,
  isEthereumStyle: boolean
): XcmVersionedLocation {
  const versionTag =
    parachain.xcmVersion.toUpperCase() as keyof typeof XcmVersionedLocation;

  let accountJunction: XcmV3Junction;

  if (isEthereumStyle) {
    const keyHex = address.startsWith('0x') ? address : '0x' + address;
    const keyBytes = fromHex(keyHex.slice(2));
    if (keyBytes.length !== 20) {
      throw new Error(`Invalid Ethereum address length: ${keyBytes.length}`);
    }
    accountJunction = XcmV3Junction.AccountKey20({
      key: FixedSizeBinary.fromHex(keyHex),
      network: undefined,
    });
  } else {
    const info = getSs58AddressInfo(address);
    if (!info.isValid || info.publicKey.length !== 32) {
      throw new Error('Invalid SS58 address');
    }
    accountJunction = XcmV3Junction.AccountId32({
      id: FixedSizeBinary.fromHex(toHex(info.publicKey)),
      network: undefined,
    });
  }

  const destination = (XcmVersionedLocation[versionTag] as any)({
    parents: 1,
    interior: XcmV3Junctions.X2([
      XcmV3Junction.Parachain(parachain.parachainId),
      accountJunction,
    ]),
  });

  return destination;
}

export async function createPayload(
  parachain: Parachain,
  address: string,
  isEthereumStyle = false
): Promise<EncodedPayload> {
  const destination = createXcmLocation(parachain, address, isEthereumStyle);

  const codec = await getVersionedUserActionCodec(parachain);
  const value: VersionedUserAction = {
    tag: 'V1',
    value: { destination },
  };

  const encodedBytes = codec.enc(value);

  return {
    bytes: encodedBytes,
    toHex(): string {
      return toHex(encodedBytes);
    },
    toU8a(): Uint8Array {
      return encodedBytes;
    },
  };
}

export async function decodePayload(
  parachain: Parachain,
  payloadHex: string
): Promise<VersionedUserAction> {
  const hex = payloadHex.startsWith('0x') ? payloadHex.slice(2) : payloadHex;
  const bytes = fromHex(hex);

  const codec = await getVersionedUserActionCodec(parachain);
  return codec.dec(bytes);
}

export async function encodeDestination(
  parachain: Parachain,
  address: string,
  isEthereumStyle = false
): Promise<Uint8Array> {
  const destination = createXcmLocation(parachain, address, isEthereumStyle);

  const codecs = await getTypedCodecs(hydration);
  const destCodec = codecs.tx.PolkadotXcm.send.inner.dest;

  return destCodec.enc(destination);
}
