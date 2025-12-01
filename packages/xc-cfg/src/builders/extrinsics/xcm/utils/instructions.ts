export const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

const ethereumNetwork = (ethChainId: number) => ({
  type: 'GlobalConsensus',
  value: {
    type: 'Ethereum',
    value: {
      chain_id: ethChainId,
    },
  },
});

export function bridgeLocation(ethChainId: number) {
  return {
    parents: 2,
    interior: {
      type: 'X1',
      value: ethereumNetwork(ethChainId),
    },
  };
}

export function parachainLocation(paraId: number) {
  return {
    parents: 1,
    interior: {
      type: 'X1',
      value: {
        type: 'Parachain',
        value: paraId,
      },
    },
  };
}

export function erc20Location(ethChainId: number, tokenAddress: string) {
  if (tokenAddress === ETHER_TOKEN_ADDRESS) {
    return bridgeLocation(ethChainId);
  }

  return {
    parents: 2,
    interior: {
      type: 'X2',
      value: [
        ethereumNetwork(ethChainId),
        {
          type: 'AccountKey20',
          value: {
            key: tokenAddress,
          },
        },
      ],
    },
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
    interior: {
      type: 'X1',
      value: {
        type: 'AccountKey20',
        value: {
          key: tokenAddress,
        },
      },
    },
  };
}
