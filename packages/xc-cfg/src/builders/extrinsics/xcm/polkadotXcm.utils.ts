import {
  multiloc,
  ChainEcosystem,
  Parachain,
  TxWeight,
} from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';
import {
  XcmV3Junction,
  XcmV3Junctions,
  XcmV3JunctionNetworkId,
} from '@galacticcouncil/descriptors';

import { ETHEREUM_CHAIN_ID, ASSET_HUB_ID, RELAY_ID } from './builder';
import { instr } from './utils';
import { XcmTransferType, XcmVersion } from './types';

const BRIDGE_CONSENSUS = [ChainEcosystem.Polkadot, ChainEcosystem.Kusama];
const DOT_RESERVE_LOCATION = {
  parents: 1,
  interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(1000)),
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
    const networkId =
      destination.ecosystem === ChainEcosystem.Polkadot
        ? XcmV3JunctionNetworkId.Polkadot()
        : XcmV3JunctionNetworkId.Kusama();

    return {
      [version]: {
        parents: 2,
        interior: XcmV3Junctions.X2([
          XcmV3Junction.GlobalConsensus(networkId),
          XcmV3Junction.Parachain(destination.parachainId),
        ]),
      },
    };
  }

  if (destination.parachainId === RELAY_ID) {
    return {
      [version]: {
        parents: 1,
        interior: XcmV3Junctions.Here(),
      },
    };
  }

  // Snowbridge transfers are routed via assethub
  const parachain =
    destination.key === 'ethereum' ? ASSET_HUB_ID : destination.parachainId;

  return {
    [version]: {
      parents: 1,
      interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(parachain)),
    },
  };
};

export const toBeneficiary = (version: XcmVersion, account: any) => {
  return {
    [version]: {
      parents: 0,
      interior: XcmV3Junctions.X1(account),
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
      RemoteReserve: {
        [version]: isDot(assetLocation) ? DOT_RESERVE_LOCATION : assetLocation,
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
          assets: {
            Wild: {
              AllCounted: 1,
            },
          },
          beneficiary: {
            parents: 0,
            interior: XcmV3Junctions.X1(account),
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
    interior: XcmV3Junctions.Here(),
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
            interior: XcmV3Junctions.X1(
              XcmV3Junction.Parachain(destination.parachainId)
            ),
          },
          xcm: [
            {
              BuyExecution: {
                fees: toAsset(transferAssetLocation, transferFeeAmount),
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
                  interior: XcmV3Junctions.X1(account),
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
    interior: XcmV3Junctions.Here(),
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
            interior: XcmV3Junctions.Here(),
          },
          xcm: [
            {
              BuyExecution: {
                fees: toAsset(transferAssetLocation, transferFeeAmount),
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
                  interior: XcmV3Junctions.X1(account),
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
                interior: XcmV3Junctions.X1(sender),
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
                  id: reanchorLocation(transferAssetLocation),
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
                  interior: XcmV3Junctions.X1(account),
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
 * @param assetLocation asset multilocation
 * @returns fixed location
 */
const reanchorLocation = (assetLocation: object) => {
  const erc20Key = multiloc.findNestedKey(assetLocation, 'key');

  if (erc20Key) {
    return {
      parents: 0,
      interior: XcmV3Junctions.X1(
        XcmV3Junction.AccountKey20({
          key: Binary.fromHex(erc20Key),
          network: undefined,
        })
      ),
    };
  }
  return {
    parents: 0,
    interior: XcmV3Junctions.Here(),
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
            interior: XcmV3Junctions.X1(account),
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
            interior: XcmV3Junctions.X1(receiver),
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
            interior: XcmV3Junctions.X1(account),
          },
        },
      },
    ],
  };
};
