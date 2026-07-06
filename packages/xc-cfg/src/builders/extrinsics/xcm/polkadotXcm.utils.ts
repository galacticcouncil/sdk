import {
  multiloc,
  Asset,
  ChainEcosystem,
  Parachain,
  TxWeight,
} from '@galacticcouncil/xc-core';

import { SizedHex } from 'polkadot-api';

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
import { instr, locationOrError } from './utils';
import { XcmTransferType, XcmVersion } from './types';

const BRIDGE_CONSENSUS = [ChainEcosystem.Polkadot, ChainEcosystem.Kusama];
const DOT_RESERVE_LOCATION = {
  parents: 1,
  interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(1000)),
};

const isDot = (assetLocation: any) => {
  const { parents, interior } = assetLocation;
  if (parents !== 1) return false;
  return interior === 'Here' || interior?.type === 'Here';
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
  const { interior } = assetLocation;

  // Native ETH: X1(GlobalConsensus(Ethereum))
  if (interior.type === 'X1' && interior.value.type === 'GlobalConsensus') {
    return interior.value.value.type === 'Ethereum';
  }

  // ERC20 tokens: X2([GlobalConsensus(Ethereum), AccountKey20])
  if (interior.type === 'X2' && Array.isArray(interior.value)) {
    const first = interior.value[0];
    return (
      first.type === 'GlobalConsensus' && first.value.type === 'Ethereum'
    );
  }

  return false;
};

export const toDest = (
  version: XcmVersion,
  source: Parachain,
  destination: Parachain
) => {
  if (isBridgeHubTransfer(source, destination)) {
    return {
      type: version,
      value: toBridgeLocation(destination.ecosystem, destination.parachainId),
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

const networkIdOf = (ecosystem?: ChainEcosystem) =>
  ecosystem === ChainEcosystem.Kusama
    ? XcmV3JunctionNetworkId.Kusama()
    : XcmV3JunctionNetworkId.Polkadot();

/**
 * Location of a chain on the far side of the Polkadot<>Kusama bridge:
 * parents:2 + GlobalConsensus(peer) + Parachain(id).
 */
const toBridgeLocation = (
  ecosystem: ChainEcosystem | undefined,
  parachainId: number
) => ({
  parents: 2,
  interior: XcmV3Junctions.X2([
    XcmV3Junction.GlobalConsensus(networkIdOf(ecosystem)),
    XcmV3Junction.Parachain(parachainId),
  ]),
});

/**
 * Onward-hop shape for a bridge transfer (see `toReserveXcmOnDest`). The
 * 'bridge-*' suffix names the reserve instruction used to cross the bridge:
 *  - 'onward'          DepositReserveAsset to a sibling parachain (gateway -> final para)
 *  - 'bridge-deposit'  DepositReserveAsset across the bridge (destination is not the reserve)
 *  - 'bridge-withdraw' InitiateReserveWithdraw across the bridge (destination is the reserve)
 */
export type BridgeHopMode = 'onward' | 'bridge-deposit' | 'bridge-withdraw';

export interface BridgeRoute {
  dest: object;
  mode: BridgeHopMode;
}

/**
 * Resolve first-hop destination + onward-hop mode for a Polkadot<>Kusama
 * bridge transfer, or undefined for non-bridge / plain AssetHub<>AssetHub
 * transfers (which route via `toDest` with no custom onward XCM).
 *
 * An AssetHub is always the gateway on each side:
 *  - parachain source  -> sibling AssetHub, cross the bridge in custom XCM
 *    (reserve-withdraw if the destination consensus is the asset's reserve,
 *     else reserve-deposit)
 *  - AssetHub source, final dest beyond the peer -> peer AssetHub, then hop
 *    onward to the final parachain
 */
export const resolveBridgeRoute = (
  version: XcmVersion,
  source: Parachain,
  destination: Parachain,
  asset: Asset
): BridgeRoute | undefined => {
  if (!isBridgeHubTransfer(source, destination)) {
    return undefined;
  }

  // parachain source: hop to the local sibling AssetHub first
  if (source.parachainId !== ASSET_HUB_ID) {
    // The asset's reserve consensus (e.g. KSM -> 'Kusama'); undefined for
    // relay-native assets like DOT (parents:1/Here, no GlobalConsensus).
    // Polkadot/Kusama store it as a plain string, so guard on that: an
    // object-shaped consensus (e.g. Ethereum) is never a P<>K bridge asset
    // and must fall through to the safe reserve-deposit path.
    const reserveConsensus = multiloc.findGlobalConsensus(
      locationOrError(source, asset)
    );
    const isDestinationReserve =
      typeof reserveConsensus === 'string' &&
      reserveConsensus === destination.ecosystem;
    return {
      // first hop targets the local sibling AssetHub (parents:1)
      dest: {
        type: version,
        value: {
          parents: 1,
          interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(ASSET_HUB_ID)),
        },
      },
      mode: isDestinationReserve ? 'bridge-withdraw' : 'bridge-deposit',
    };
  }

  // AssetHub source, final destination beyond the peer AssetHub
  if (destination.parachainId !== ASSET_HUB_ID) {
    return {
      // first hop targets the peer AssetHub across the bridge (parents:2)
      dest: {
        type: version,
        value: toBridgeLocation(destination.ecosystem, ASSET_HUB_ID),
      },
      mode: 'onward',
    };
  }

  // plain AssetHub <-> AssetHub bridge transfer: no gateway hop
  return undefined;
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
  const topic = messageId as SizedHex<32>;
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
        reserve: instr.ethereumLocation(ETHEREUM_CHAIN_ID),
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
 * Custom XCM executed on a gateway AssetHub to move the held asset one hop
 * further, then buy execution there and deposit to the receiver. A leading
 * SetAppendix refunds to the receiver on the gateway if a later instruction
 * fails (assets are otherwise trapped).
 *
 * Covers every bridge hop shape via `mode`:
 *  - 'onward'          peer AssetHub -> final parachain    (KAH -> AH -> Hydration)
 *  - 'bridge-deposit'  sibling AssetHub -> peer AssetHub    (Hydration -> AH -> KAH, DOT)
 *  - 'bridge-withdraw' sibling AssetHub -> peer AssetHub    (Hydration -> AH -> KAH, KSM)
 *
 * @param version - XCM version
 * @param account - destination account (receiver)
 * @param destination - next hop chain (final parachain, or the peer AssetHub)
 * @param mode - hop shape (target location + reserve instruction)
 * @param feeAssetLocation - transfer asset location from the next hop's perspective
 * @param feeAmount - execution fee allotment on the next hop (surplus is refunded)
 * @returns xcm bridge hop instructions
 */
export const toReserveXcmOnDest = (
  version: XcmVersion,
  account: any,
  destination: Parachain,
  mode: BridgeHopMode,
  feeAssetLocation: any,
  feeAmount: any
) => {
  // 'onward' targets a sibling parachain; bridge hops target the peer AssetHub
  // across a consensus boundary (parents 2 + GlobalConsensus).
  const target =
    mode === 'onward'
      ? {
          parents: 1,
          interior: XcmV3Junctions.X1(
            XcmV3Junction.Parachain(destination.parachainId)
          ),
        }
      : toBridgeLocation(destination.ecosystem, destination.parachainId);

  const beneficiary = {
    parents: 0,
    interior: XcmV3Junctions.X1(account),
  };
  const heldAssets = XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1));

  const onArrival = [
    XcmV4Instruction.BuyExecution({
      fees: {
        id: feeAssetLocation,
        fun: XcmV3MultiassetFungibility.Fungible(feeAmount),
      },
      weight_limit: XcmV3WeightLimit.Unlimited(),
    }),
    XcmV4Instruction.DepositAsset({ assets: heldAssets, beneficiary }),
  ];

  // When the destination consensus is the asset's reserve, the real asset
  // must be withdrawn from reserve; everything else is a reserve deposit onward.
  const hop =
    mode === 'bridge-withdraw'
      ? XcmV4Instruction.InitiateReserveWithdraw({
          assets: heldAssets,
          reserve: target,
          xcm: onArrival,
        })
      : XcmV4Instruction.DepositReserveAsset({
          assets: heldAssets,
          dest: target,
          xcm: onArrival,
        });

  return {
    type: version,
    value: [
      // refund to the receiver on the gateway if the hop below fails
      XcmV4Instruction.SetAppendix([
        XcmV4Instruction.DepositAsset({
          assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.All()),
          beneficiary,
        }),
      ]),
      hop,
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
  transactCall: Uint8Array,
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
