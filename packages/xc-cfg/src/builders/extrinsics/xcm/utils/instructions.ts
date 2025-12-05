import {
  XcmV3Junctions,
  XcmV3Junction,
  XcmV3JunctionNetworkId,
} from '@galacticcouncil/descriptors';
import { Binary } from 'polkadot-api';

export const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

const ethereumGlobalConsensus = (ethChainId: number) =>
  XcmV3Junction.GlobalConsensus(
    XcmV3JunctionNetworkId.Ethereum({ chain_id: BigInt(ethChainId) })
  );

export function bridgeLocation(ethChainId: number) {
  return {
    parents: 2,
    interior: XcmV3Junctions.X1(ethereumGlobalConsensus(ethChainId)),
  };
}

export function parachainLocation(paraId: number) {
  return {
    parents: 1,
    interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(paraId)),
  };
}

export function erc20Location(ethChainId: number, tokenAddress: string) {
  if (tokenAddress === ETHER_TOKEN_ADDRESS) {
    return bridgeLocation(ethChainId);
  }

  return {
    parents: 2,
    interior: XcmV3Junctions.X2([
      ethereumGlobalConsensus(ethChainId),
      XcmV3Junction.AccountKey20({ key: Binary.fromHex(tokenAddress) }),
    ]),
  };
}

export function erc20LocationReanchored(tokenAddress: string) {
  if (tokenAddress === ETHER_TOKEN_ADDRESS) {
    return {
      parents: 0,
      interior: {
        type: 'Here',
      },
    };
  }

  return {
    parents: 0,
    interior: XcmV3Junctions.X1(
      XcmV3Junction.AccountKey20({ key: Binary.fromHex(tokenAddress) })
    ),
  };
}
