import {
  multiloc,
  ChainEcosystem,
  Parachain,
  TxWeight,
} from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';
import {
  XcmV3Junctions,
  XcmV3Junction,
  XcmV3JunctionNetworkId,
  XcmV3MultiassetFungibility,
  XcmV4Instruction,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
  XcmV3WeightLimit,
  XcmV2MultiassetWildFungibility,
  XcmV2OriginKind,
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

export const isSnowbridgeTransfer = (assetLocation: any) => {
  const consensus = multiloc.findGlobalConsensus(assetLocation);
  return consensus && 'Ethereum' in consensus;
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
      type: version,
      value: {
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
      type: version,
      value: {
        parents: 1,
        interior: XcmV3Junctions.Here(),
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
      interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(parachain)),
    },
  };
};

export const toBeneficiary = (version: XcmVersion, account: any) => {
  return {
    type: version,
    value: {
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
    fun: XcmV3MultiassetFungibility.Fungible(amount),
  };
};

export const toDepositXcmOnDest = (
  version: XcmVersion,
  account: any,
  assetsCount: number
) => {
  return {
    type: version,
    value: [
      XcmV4Instruction.DepositAsset({
        assets: XcmV4AssetAssetFilter.Wild(
          XcmV4AssetWildAsset.AllCounted(assetsCount)
        ),
        beneficiary: {
          parents: 0,
          interior: XcmV3Junctions.X1(account),
        },
      }),
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
    type: version,
    value: [
      XcmV4Instruction.DepositReserveAsset({
        assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
        dest: {
          parents: 1,
          interior: XcmV3Junctions.X1(
            XcmV3Junction.Parachain(destination.parachainId)
          ),
        },
        xcm: [
          XcmV4Instruction.BuyExecution({
            fees: {
              id: transferAssetLocation,
              fun: XcmV3MultiassetFungibility.Fungible(transferFeeAmount),
            },
            weight_limit: XcmV3WeightLimit.Unlimited(),
          }),
          XcmV4Instruction.DepositAsset({
            assets: XcmV4AssetAssetFilter.Wild(
              XcmV4AssetWildAsset.AllCounted(1)
            ),
            beneficiary: {
              parents: 0,
              interior: XcmV3Junctions.X1(account),
            },
          }),
        ],
      }),
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
    type: version,
    value: [
      XcmV4Instruction.InitiateTeleport({
        assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
        dest: {
          parents: 1,
          interior: XcmV3Junctions.Here(),
        },
        xcm: [
          XcmV4Instruction.BuyExecution({
            fees: {
              id: transferAssetLocation,
              fun: XcmV3MultiassetFungibility.Fungible(transferFeeAmount),
            },
            weight_limit: XcmV3WeightLimit.Unlimited(),
          }),
          XcmV4Instruction.DepositAsset({
            assets: XcmV4AssetAssetFilter.Wild(
              XcmV4AssetWildAsset.AllCounted(1)
            ),
            beneficiary: {
              parents: 0,
              interior: XcmV3Junctions.X1(account),
            },
          }),
        ],
      }),
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
  transferAssetLocation: { parents: number; interior: XcmV3Junctions },
  messageId: any
) => {
  const topic = Binary.fromHex(messageId);
  return {
    type: version,
    value: [
      XcmV4Instruction.SetAppendix([
        XcmV4Instruction.DepositAsset({
          assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.All()),
          beneficiary: {
            parents: 0,
            interior: XcmV3Junctions.X1(sender),
          },
        }),
      ]),
      XcmV4Instruction.InitiateReserveWithdraw({
        assets: XcmV4AssetAssetFilter.Wild(
          XcmV4AssetWildAsset.AllOf({
            id: transferAssetLocation,
            fun: XcmV2MultiassetWildFungibility.Fungible(),
          })
        ),
        reserve: instr.bridgeLocation(ETHEREUM_CHAIN_ID),
        xcm: [
          XcmV4Instruction.BuyExecution({
            fees: {
              id: reanchorLocation(transferAssetLocation),
              fun: XcmV3MultiassetFungibility.Fungible(1n),
            },
            weight_limit: XcmV3WeightLimit.Unlimited(),
          }),
          XcmV4Instruction.DepositAsset({
            assets: XcmV4AssetAssetFilter.Wild(
              XcmV4AssetWildAsset.AllCounted(1)
            ),
            beneficiary: {
              parents: 0,
              interior: XcmV3Junctions.X1(account),
            },
          }),
          XcmV4Instruction.SetTopic(topic),
        ],
      }),
      XcmV4Instruction.SetTopic(topic),
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
  const erc20KeyObj = multiloc.findNestedKey(assetLocation, 'key');

  if (erc20KeyObj) {
    return {
      parents: 0,
      interior: XcmV3Junctions.X1(
        XcmV3Junction.AccountKey20({ key: erc20KeyObj.key })
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
  transactFeeLocation: { parents: number; interior: XcmV3Junctions },
  transactFeeAmount: any,
  transactCall: Binary,
  transactWeight: TxWeight
) => {
  return {
    type: version,
    value: [
      XcmV4Instruction.WithdrawAsset([
        {
          id: transactFeeLocation,
          fun: XcmV3MultiassetFungibility.Fungible(transactFeeAmount),
        },
      ]),
      XcmV4Instruction.BuyExecution({
        fees: {
          id: transactFeeLocation,
          fun: XcmV3MultiassetFungibility.Fungible(transactFeeAmount),
        },
        weight_limit: XcmV3WeightLimit.Unlimited(),
      }),
      XcmV4Instruction.Transact({
        origin_kind: XcmV2OriginKind.SovereignAccount(),
        require_weight_at_most: {
          ref_time: transactWeight.refTime,
          proof_size: transactWeight.proofSize,
        },
        call: transactCall,
      }),
      XcmV4Instruction.RefundSurplus(),
      XcmV4Instruction.DepositAsset({
        assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
        beneficiary: {
          parents: 0,
          interior: XcmV3Junctions.X1(account),
        },
      }),
    ],
  };
};

export const toTransferMessage = (
  version: XcmVersion,
  account: any,
  transferAssetLocation: { parents: number; interior: XcmV3Junctions },
  transferAssetAmount: any,
  transferFeeAmount: any,
  receiver: any
) => {
  return {
    type: version,
    value: [
      XcmV4Instruction.WithdrawAsset([
        {
          id: transferAssetLocation,
          fun: XcmV3MultiassetFungibility.Fungible(transferFeeAmount),
        },
      ]),
      XcmV4Instruction.BuyExecution({
        fees: {
          id: transferAssetLocation,
          fun: XcmV3MultiassetFungibility.Fungible(transferFeeAmount),
        },
        weight_limit: XcmV3WeightLimit.Unlimited(),
      }),
      XcmV4Instruction.TransferAsset({
        assets: [
          {
            id: transferAssetLocation,
            fun: XcmV3MultiassetFungibility.Fungible(transferAssetAmount),
          },
        ],
        beneficiary: {
          parents: 0,
          interior: XcmV3Junctions.X1(receiver),
        },
      }),
      XcmV4Instruction.RefundSurplus(),
      XcmV4Instruction.DepositAsset({
        assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
        beneficiary: {
          parents: 0,
          interior: XcmV3Junctions.X1(account),
        },
      }),
    ],
  };
};
