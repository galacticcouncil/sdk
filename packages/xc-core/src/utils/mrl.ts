import {
  Codec,
  getTypedCodecs,
  FixedSizeBinary,
  AccountId,
} from 'polkadot-api';

import { Struct, Enum } from 'scale-ts';

import { toHex, fromHex } from '@polkadot-api/utils';
import {
  XcmVersionedLocation,
  XcmV3Junction,
  XcmV3Junctions,
  hydration,
} from '@galacticcouncil/descriptors';

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

async function getVersionedUserActionCodec(): Promise<
  Codec<VersionedUserAction>
> {
  const codecs = await getTypedCodecs(hydration);
  const destCodec = codecs.tx.PolkadotXcm.send.inner.dest;

  const XcmRoutingUserActionCodec = Struct({
    destination: destCodec,
  }) as Codec<XcmRoutingUserAction>;

  const VersionedUserActionCodec = Enum({
    V1: XcmRoutingUserActionCodec,
  }) as Codec<VersionedUserAction>;

  return VersionedUserActionCodec;
}

function createXcmLocation(
  parachain: Parachain,
  address: string,
  isEthereumStyle: boolean
): XcmVersionedLocation {
  let accountJunction: XcmV3Junction;

  if (isEthereumStyle) {
    accountJunction = XcmV3Junction.AccountKey20({
      key: FixedSizeBinary.fromHex(address),
      network: undefined,
    });
  } else {
    const ss58 = AccountId().enc(address);
    accountJunction = XcmV3Junction.AccountId32({
      id: FixedSizeBinary.fromBytes(ss58),
      network: undefined,
    });
  }

  return XcmVersionedLocation.V4({
    parents: 1,
    interior: XcmV3Junctions.X2([
      XcmV3Junction.Parachain(parachain.parachainId),
      accountJunction,
    ]),
  });
}

export async function createPayload(
  parachain: Parachain,
  address: string,
  isEthereumStyle = false
): Promise<EncodedPayload> {
  const destination = createXcmLocation(parachain, address, isEthereumStyle);

  const codec = await getVersionedUserActionCodec();
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
  payloadHex: string
): Promise<VersionedUserAction> {
  const hex = payloadHex.startsWith('0x') ? payloadHex.slice(2) : payloadHex;
  const bytes = fromHex(hex);
  const codec = await getVersionedUserActionCodec();
  return codec.dec(bytes);
}
