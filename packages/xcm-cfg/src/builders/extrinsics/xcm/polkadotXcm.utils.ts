import {
  ChainEcosystem,
  multiloc,
  Parachain,
  TxWeight,
} from '@galacticcouncil/xcm-core';

import { getX1Junction } from './utils';
import { XcmTransferType, XcmVersion } from './types';

const ETHEREUM_CHAIN_ID = 1;
const ETHEREUM_BRIDGE_LOCATION = {
  parents: 2,
  interior: {
    X1: [{ GlobalConsensus: { Ethereum: { chain_id: ETHEREUM_CHAIN_ID } } }],
  },
};
const HUB_PARACHAIN_ID = 1000;

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

  // Relay transfer
  if (destination.parachainId === 0) {
    return {
      [version]: {
        parents: 1,
        interior: 'Here',
      },
    };
  }

  // Ethereum snowbridge transfers are routed via hub
  const parachain =
    destination.key === 'ethereum' ? HUB_PARACHAIN_ID : destination.parachainId;

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
  transferAssetLocation: object
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
          reserve: ETHEREUM_BRIDGE_LOCATION,
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
          ],
        },
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
const reanchorLocation = (version: XcmVersion, assetLocation: object) => {
  const erc20Key = multiloc.findNestedKey(assetLocation, 'key');
  return {
    parents: 0,
    interior: {
      X1: getX1Junction(version, { AccountKey20: erc20Key }),
    },
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
