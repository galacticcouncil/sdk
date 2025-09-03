import {
  multiloc,
  ChainEcosystem,
  Parachain,
  TxWeight,
} from '@galacticcouncil/xcm-core';

import { ETHEREUM_CHAIN_ID, ASSET_HUB_ID } from './builder';
import { getX1Junction, instr } from './utils';
import { XcmTransferType, XcmVersion } from './types';

const BRIDGE_CONSENSUS = [ChainEcosystem.Polkadot, ChainEcosystem.Kusama];

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
      [version]: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: destination.ecosystem,
            },
            {
              Parachain: destination.parachainId,
            },
          ],
        },
      },
    };
  }

  // Special case: Kusama -> Basilisk (KSM transfers route via Kusama Asset Hub)
  if (source.key === 'kusama' && destination.key === 'basilisk') {
    return {
      [version]: {
        parents: 0,
        interior: {
          X1: getX1Junction(version, {
            Parachain: 1000, // Kusama Asset Hub
          }),
        },
      },
    };
  }

  // Special case: Asset Hub to relay chain - go directly to relay chain
  if (source.parachainId === 1000 && destination.parachainId === 0) {
    return {
      [version]: {
        parents: 1,
        interior: 'Here',
      },
    };
  }

  // Special case: Parachain to relay chain (e.g., Basilisk -> Kusama)
  // Route through Asset Hub (parachain 1000 for Kusama ecosystem)
  if (destination.parachainId === 0) {
    const assetHubId = destination.ecosystem === ChainEcosystem.Kusama ? 1000 : 1000; // Both ecosystems use 1000 for Asset Hub
    return {
      [version]: {
        parents: 1,
        interior: {
          X1: getX1Junction(version, {
            Parachain: assetHubId,
          }),
        },
      },
    };
  }

  // Snowbridge transfers are routed via assethub
  const parachain =
    destination.key === 'ethereum' ? ASSET_HUB_ID : destination.parachainId;

  return {
    [version]: {
      parents: 1,
      interior: {
        X1: getX1Junction(version, {
          Parachain: parachain,
        }),
      },
    },
  };
};

export const toBeneficiary = (version: XcmVersion, account: any) => {
  return {
    [version]: {
      parents: 0,
      interior: {
        X1: getX1Junction(version, account),
      },
    },
  };
};

export const toTransferType = (
  version: XcmVersion,
  type: XcmTransferType,
  assetLocation: object
) => {
  if (type === XcmTransferType.RemoteReserve) {
    const reserveChain = multiloc.findNestedKey(assetLocation, 'Parachain');
    return {
      RemoteReserve: {
        [version]: {
          parents: 1,
          interior: {
            X1: getX1Junction(version, reserveChain),
          },
        },
      },
    };
  }
  return type;
};

export const toAsset = (assetLocation: object, amount: any) => {
  return {
    id: assetLocation,
    fun: {
      Fungible: amount,
    },
  };
};

export const toDepositXcmOnDest = (version: XcmVersion, account: any) => {
  return {
    [version]: [
      {
        DepositAsset: {
          assets: { Wild: 'All' },
          beneficiary: {
            parents: 0,
            interior: {
              X1: getX1Junction(version, account),
            },
          },
        },
      },
    ],
  };
};

/**
 * Creates DepositReserveAsset XCM instruction for relay chain to parachain LocalReserve transfers
 * Used for transfers like Kusama -> Basilisk
 *
 * @param version - XCM Version
 * @param account - destination account (receiver)
 * @param destination - destination parachain
 * @param transferFeeLocation - fee asset location
 * @param transferFeeAmount - fee amount for execution
 * @returns xcm DepositReserveAsset instruction
 */
export const toDepositReserveAssetXcmOnDest = (
  version: XcmVersion,
  account: any,
  destination: Parachain,
  transferFeeLocation: object,
  transferFeeAmount: any
) => {
  // From the destination parachain's perspective, the relay chain asset (KSM) is at parents: 1, interior: Here
  const relayChainAssetLocation = {
    parents: 1,
    interior: 'Here',
  };

  return {
    [version]: [
      {
        DepositReserveAsset: {
          assets: {
            Wild: {
              AllCounted: 1,
            },
          },
          dest: {
            parents: 1,
            interior: {
              X1: getX1Junction(version, {
                Parachain: destination.parachainId,
              }),
            },
          },
          xcm: [
            {
              BuyExecution: {
                fees: toAsset(relayChainAssetLocation, transferFeeAmount),
                weightLimit: 'Unlimited',
              },
            },
            {
              DepositAsset: {
                assets: {
                  Wild: {
                    AllCounted: 1,
                  },
                },
                beneficiary: {
                  parents: 0,
                  interior: {
                    X1: getX1Junction(version, account),
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
 * Used for transfers like Basilisk -> Kusama
 *
 * @param version - XCM Version
 * @param account - destination account (receiver)
 * @param transferAssetLocation - transfer asset xcm location
 * @param transferFeeAmount - fee amount for execution
 * @returns xcm InitiateTeleport instruction
 */
export const toInitiateTeleportXcmOnDest = (
  version: XcmVersion,
  account: any,
  transferAssetLocation: object,
  transferFeeAmount: any
) => {
  // After teleporting to relay chain, the asset is local (parents: 0, interior: Here)
  const localAssetLocation = {
    parents: 0,
    interior: 'Here',
  };

  return {
    [version]: [
      {
        InitiateTeleport: {
          assets: {
            Wild: {
              AllCounted: 1,
            },
          },
          dest: {
            parents: 1,
            interior: 'Here',
          },
          xcm: [
            {
              BuyExecution: {
                fees: toAsset(localAssetLocation, transferFeeAmount),
                weightLimit: 'Unlimited',
              },
            },
            {
              DepositAsset: {
                assets: {
                  Wild: {
                    AllCounted: 1,
                  },
                },
                beneficiary: {
                  parents: 0,
                  interior: {
                    X1: getX1Junction(version, account),
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
  messageId: string | undefined
) => {
  return {
    [version]: [
      {
        SetAppendix: [
          {
            DepositAsset: {
              assets: { Wild: 'All' },
              beneficiary: {
                parents: 0,
                interior: {
                  X1: getX1Junction(version, sender),
                },
              },
            },
          },
        ],
      },
      {
        InitiateReserveWithdraw: {
          assets: {
            Wild: {
              AllOf: {
                id: transferAssetLocation,
                fun: 'Fungible',
              },
            },
          },
          reserve: instr.bridgeLocation(ETHEREUM_CHAIN_ID),
          xcm: [
            {
              BuyExecution: {
                fees: {
                  id: reanchorLocation(version, transferAssetLocation),
                  fun: { Fungible: 1 },
                },
                weightLimit: 'Unlimited',
              },
            },
            {
              DepositAsset: {
                assets: {
                  Wild: {
                    AllCounted: 1,
                  },
                },
                beneficiary: {
                  parents: 0,
                  interior: {
                    X1: getX1Junction(version, account),
                  },
                },
              },
            },
            { SetTopic: messageId },
          ],
        },
      },
      { SetTopic: messageId },
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
const reanchorLocation = (version: XcmVersion, assetLocation: object) => {
  const erc20Key = multiloc.findNestedKey(assetLocation, 'key');

  if (erc20Key) {
    return {
      parents: 0,
      interior: {
        X1: getX1Junction(version, { AccountKey20: erc20Key }),
      },
    };
  }
  return {
    parents: 0,
    interior: { Here: null },
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
    [version]: [
      {
        WithdrawAsset: [toAsset(transactFeeLocation, transactFeeAmount)],
      },
      {
        BuyExecution: {
          fees: toAsset(transactFeeLocation, transactFeeAmount),
          weightLimit: 'Unlimited',
        },
      },
      {
        Transact: {
          originKind: 'SovereignAccount',
          requireWeightAtMost: transactWeight,
          call: {
            encoded: transactCall,
          },
        },
      },
      {
        RefundSurplus: {},
      },
      {
        DepositAsset: {
          assets: { Wild: { AllCounted: 1 } },
          beneficiary: {
            parents: 0,
            interior: {
              X1: getX1Junction(version, account),
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
    [version]: [
      {
        WithdrawAsset: [toAsset(transferAssetLocation, transferFeeAmount)],
      },
      {
        BuyExecution: {
          fees: toAsset(transferAssetLocation, transferFeeAmount),
          weightLimit: 'Unlimited',
        },
      },
      {
        TransferAsset: {
          assets: [toAsset(transferAssetLocation, transferAssetAmount)],
          beneficiary: {
            parents: 0,
            interior: {
              X1: getX1Junction(version, receiver),
            },
          },
        },
      },
      {
        RefundSurplus: {},
      },
      {
        DepositAsset: {
          assets: { Wild: { AllCounted: 1 } },
          beneficiary: {
            parents: 0,
            interior: {
              X1: getX1Junction(version, account),
            },
          },
        },
      },
    ],
  };
};
