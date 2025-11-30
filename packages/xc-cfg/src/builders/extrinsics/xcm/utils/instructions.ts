export const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

const ethereumNetwork = (ethChainId: number) => ({
  GlobalConsensus: { Ethereum: { chain_id: ethChainId } },
});

export function bridgeLocation(ethChainId: number) {
  return {
    parents: 2,
    interior: { X1: [ethereumNetwork(ethChainId)] },
  };
}

export function parachainLocation(paraId: number) {
  return {
    parents: 1,
    interior: { X1: [{ Parachain: paraId }] },
  };
}

export function erc20Location(ethChainId: number, tokenAddress: string) {
  if (tokenAddress === ETHER_TOKEN_ADDRESS) {
    return bridgeLocation(ethChainId);
  }
  return {
    parents: 2,
    interior: {
      X2: [
        ethereumNetwork(ethChainId),
        { AccountKey20: { key: tokenAddress } },
      ],
    },
  };
}

export function erc20LocationReanchored(tokenAddress: string) {
  if (tokenAddress === ETHER_TOKEN_ADDRESS) {
    return {
      parents: 0,
      interior: { here: null },
    };
  }
  return {
    parents: 0,
    interior: { X1: [{ AccountKey20: { key: tokenAddress } }] },
  };
}
