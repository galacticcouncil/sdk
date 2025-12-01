import {
  multiloc,
  ChainEcosystem,
  Parachain,
  TxWeight,
} from '@galacticcouncil/xc-core';

import { ETHEREUM_CHAIN_ID, ASSET_HUB_ID, RELAY_ID } from './builder';
import { instr } from './utils';
import { XcmTransferType, XcmVersion } from './types';

const BRIDGE_CONSENSUS = [ChainEcosystem.Polkadot, ChainEcosystem.Kusama];
const DOT_RESERVE_LOCATION = {
  parents: 1,
  interior: {
    type: 'X1',
    value: {
      type: 'Parachain',
      value: 1000,
    },
  },
};

const isDot = (assetLocation: any) => {
  return assetLocation.parents === 1 && assetLocation.interior === 'Here';
};

const isBridgeHubTransfer = (source: Parachain, destination: Parachain) => {
  const isUnknownConsensus = !source.ecosystem || !destination.ecosystem;
  if (isUnknownConsensus) {
    return false;
  }

  return (
    BRIDGE_CONSENSUS.includes(source.ecosystem) &&
    BRIDGE_CONSENSUS.includes(destination.ecosystem) &&
    source.ecosystem !== destination.ecosystem
  );
};

export const toDest = (
  version: XcmVersion,
  source: Parachain,
  destination: Parachain
) => {
  if (isBridgeHubTransfer(source, destination)) {
    return {
      type: version,
      value: {
        parents: 2,
        interior: {
          type: 'X2',
          value: [
            {
              type: 'GlobalConsensus',
              value: destination.ecosystem,
            },
            {
              type: 'Parachain',
              value: destination.parachainId,
            },
          ],
        },
      },
    };
  }

  if (destination.parachainId === RELAY_ID) {
    return {
      type: version,
      value: {
        parents: 1,
        interior: { type: 'Here' },
      },
    };
  }

  // Snowbridge transfers are routed via assethub
  const parachain =
    destination.key === 'ethereum' ? ASSET_HUB_ID : destination.parachainId;

  return {
    type: version,
    value: {
      parents: 1,
      interior: {
        type: 'X1',
        value: {
          type: 'Parachain',
          value: parachain,
        },
      },
    },
  };
};

export const toBeneficiary = (version: XcmVersion, account: any) => {
  return {
    type: version,
    value: {
      parents: 0,
      interior: {
        type: 'X1',
        value: account,
      },
    },
  };
};

export const toTransferType = (
  version: XcmVersion,
  type: XcmTransferType,
  assetLocation: any
) => {
  if (type === XcmTransferType.RemoteReserve) {
    return {
      type: 'RemoteReserve',
      value: {
        type: version,
        value: isDot(assetLocation) ? DOT_RESERVE_LOCATION : assetLocation,
      },
    };
  }
  return {
    type,
  };
};

export const toAsset = (assetLocation: object, amount: any) => {
  return {
    id: assetLocation,
    fun: {
      type: 'Fungible',
      value: amount,
    },
  };
};

export const toDepositXcmOnDest = (version: XcmVersion, account: any) => {
  return {
    type: version,
    value: [
      {
        type: 'DepositAsset',
        value: {
          assets: {
            type: 'Wild',
            value: {
              type: 'AllCounted',
              value: 1,
            },
          },
          beneficiary: {
            parents: 0,
            interior: {
              type: 'X1',
              value: account,
            },
          },
        },
      },
    ],
  };
};

/**
 * Creates DepositReserveAsset XCM instruction for relay chain to parachain
 * LocalReserve transfers
 *
 * @param version - XCM Version
 * @param account - destination account (receiver)
 * @param destination - destination parachain
 * @param transferFeeAmount - fee amount for execution
 * @returns xcm DepositReserveAsset instruction
 */
const toDepositReserveAssetXcmOnDest = (
  version: XcmVersion,
  account: any,
  destination: Parachain,
  transferFeeAmount: any
) => {
  // From the destination parachain's perspective, the relay chain asset is at parents 1
  const transferAssetLocation = {
    parents: 1,
    interior: { type: 'Here' },
  };

  return {
    type: version,
    value: [
      {
        type: 'DepositReserveAsset',
        value: {
          assets: {
            type: 'Wild',
            value: {
              type: 'AllCounted',
              value: 1,
            },
          },
          dest: {
            parents: 1,
            interior: {
              type: 'X1',
              value: {
                type: 'Parachain',
                value: destination.parachainId,
              },
            },
          },
          xcm: [
            {
              type: 'BuyExecution',
              value: {
                fees: toAsset(transferAssetLocation, transferFeeAmount),
                weight_limit: {
                  type: 'Unlimited',
                },
              },
            },
            {
              type: 'DepositAsset',
              value: {
                assets: {
                  type: 'Wild',
                  value: {
                    type: 'AllCounted',
                    value: 1,
                  },
                },
                beneficiary: {
                  parents: 0,
                  interior: {
                    type: 'X1',
                    value: account,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  };
};

/**
 * Creates InitiateTeleport XCM instruction for parachain to relay chain transfers
 *
 * @param version - XCM Version
 * @param account - destination account (receiver)
 * @param transferFeeAmount - fee amount for execution
 * @returns xcm InitiateTeleport instruction
 */
const toInitiateTeleportXcmOnDest = (
  version: XcmVersion,
  account: any,
  transferFeeAmount: any
) => {
  // After teleporting to relay chain, the asset is local
  const transferAssetLocation = {
    parents: 0,
    interior: { type: 'Here' },
  };

  return {
    type: version,
    value: [
      {
        type: 'InitiateTeleport',
        value: {
          assets: {
            type: 'Wild',
            value: {
              type: 'AllCounted',
              value: 1,
            },
          },
          dest: {
            parents: 1,
            interior: { type: 'Here' },
          },
          xcm: [
            {
              type: 'BuyExecution',
              value: {
                fees: toAsset(transferAssetLocation, transferFeeAmount),
                weight_limit: {
                  type: 'Unlimited',
                },
              },
            },
            {
              type: 'DepositAsset',
              value: {
                assets: {
                  type: 'Wild',
                  value: {
                    type: 'AllCounted',
                    value: 1,
                  },
                },
                beneficiary: {
                  parents: 0,
                  interior: {
                    type: 'X1',
                    value: account,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  };
};

/**
 * Instructions are executed in 2 steps:
 *
 * 1) SetAppendix - Error Handling, return everything to sender on Asset hub
 * 2) InitiateReserveWithdraw - Initiate the bridged transfer
 *
 * @param version - XCM Version
 * @param account - destination account (receiver)
 * @param sender - sender account
 * @param transferAssetLocation - transfer asset xcm location
 * @returns xcm ethereum bridge instructions
 */
export const toBridgeXcmOnDest = (
  version: XcmVersion,
  account: any,
  sender: any,
  transferAssetLocation: object,
  messageId: any
) => {
  return {
    type: version,
    value: [
    {
      type: 'SetAppendix',
      value: [
        {
          type: 'DepositAsset',
          value: {
            assets: {
              type: 'Wild',
              value: {
                type: 'All',
              },
            },
            beneficiary: {
              parents: 0,
              interior: {
                type: 'X1',
                value: sender,
              },
            },
          },
        },
      ],
    },
    {
      type: 'InitiateReserveWithdraw',
      value: {
        assets: {
          type: 'Wild',
          value: {
            type: 'AllOf',
            value: {
              id: transferAssetLocation,
              fun: {
                type: 'Fungible',
              },
            },
          },
        },
        reserve: instr.bridgeLocation(ETHEREUM_CHAIN_ID),
        xcm: [
          {
            type: 'BuyExecution',
            value: {
              fees: {
                id: reanchorLocation(transferAssetLocation),
                fun: {
                  type: 'Fungible',
                  value: 1,
                },
              },
              weight_limit: {
                type: 'Unlimited',
              },
            },
          },
          {
            type: 'DepositAsset',
            value: {
              assets: {
                type: 'Wild',
                value: {
                  type: 'AllCounted',
                  value: 1,
                },
              },
              beneficiary: {
                parents: 0,
                interior: {
                  type: 'X1',
                  value: [account],
                },
              },
            },
          },
          {
            type: 'SetTopic',
            value: messageId,
          },
        ],
      },
    },
    {
      type: 'SetTopic',
      value: messageId,
    },
  ],
  };
};

/**
 * Re-anchor location of transfer asset in case
 * of bridge transfer for "BuyExecution"
 *
 * @param version - XCM Version
 * @param assetLocation asset multilocation
 * @returns fixed location
 */
const reanchorLocation = (assetLocation: object) => {
  const erc20Key = multiloc.findNestedKey(assetLocation, 'key');

  if (erc20Key) {
    return {
      parents: 0,
      interior: {
        type: 'X1',
        value: {
          type: 'AccountKey20',
          value: {
            key: erc20Key,
          },
        },
      },
    };
  }
  return {
    parents: 0,
    interior: { type: 'Here' },
  };
};

/**
 * Instructions are executed in 3 steps:
 *
 * 1) WithdrawAsset - Withdraw fee asset from the target account
 * 2) BuyExecution - Buy execution with the fee asset
 * 3) Transact - Destination (Transact) chain call execution
 *
 * Note that DepositAsset using AllCounted and not All, since All
 * has too high of a gas requirement.
 *
 * @param version - XCM Version
 * @param account - destination account (receiver)
 * @param transactFeeLocation - transact fee xcm location
 * @param transactFeeAmount - transact fee amount
 * @param transactCall - transact calldata
 * @param transactWeight - transact weight
 * @returns xcm transact message instructions
 */
export const toTransactMessage = (
  version: XcmVersion,
  account: any,
  transactFeeLocation: object,
  transactFeeAmount: any,
  transactCall: `0x${string}`,
  transactWeight: TxWeight
) => {
  return {
    type: version,
    value: [
      {
        type: 'WithdrawAsset',
        value: [toAsset(transactFeeLocation, transactFeeAmount)],
      },
      {
        type: 'BuyExecution',
        value: {
          fees: toAsset(transactFeeLocation, transactFeeAmount),
          weight_limit: {
            type: 'Unlimited',
          },
        },
      },
      {
        type: 'Transact',
        value: {
          origin_kind: {
            type: 'SovereignAccount',
          },
          require_weight_at_most: transactWeight,
          call: {
            encoded: transactCall,
          },
        },
      },
      {
        type: 'RefundSurplus',
      },
      {
        type: 'DepositAsset',
        value: {
          assets: {
            type: 'Wild',
            value: {
              type: 'AllCounted',
              value: 1,
            },
          },
          beneficiary: {
            parents: 0,
            interior: {
              type: 'X1',
              value: account,
            },
          },
        },
      },
    ],
  };
};

export const toTransferMessage = (
  version: XcmVersion,
  account: any,
  transferAssetLocation: object,
  transferAssetAmount: any,
  transferFeeAmount: any,
  receiver: any
) => {
  return {
    type: version,
    value: [
      {
        type: 'WithdrawAsset',
        value: [toAsset(transferAssetLocation, transferFeeAmount)],
      },
      {
        type: 'BuyExecution',
        value: {
          fees: toAsset(transferAssetLocation, transferFeeAmount),
          weight_limit: {
            type: 'Unlimited',
          },
        },
      },
      {
        type: 'TransferAsset',
        value: {
          assets: [toAsset(transferAssetLocation, transferAssetAmount)],
          beneficiary: {
            parents: 0,
            interior: {
              type: 'X1',
              value: receiver,
            },
          },
        },
      },
      {
        type: 'RefundSurplus',
      },
      {
        type: 'DepositAsset',
        value: {
          assets: {
            type: 'Wild',
            value: {
              type: 'AllCounted',
              value: 1,
            },
          },
          beneficiary: {
            parents: 0,
            interior: {
              type: 'X1',
              value: account,
            },
          },
        },
      },
    ],
  };
};
