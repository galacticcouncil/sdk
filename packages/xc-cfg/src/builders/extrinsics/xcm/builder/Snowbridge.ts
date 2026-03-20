import {
  ExtrinsicConfigBuilderParams,
  multiloc,
  Parachain,
} from '@galacticcouncil/xc-core';

import {
  XcmV3MultiassetFungibility,
  XcmV5AssetFilter,
  XcmV5Instruction,
  XcmV5Junctions,
  XcmV5Junction,
  XcmV5NetworkId,
  XcmV5WildAsset,
  XcmVersionedXcm,
} from '@galacticcouncil/descriptors';

import { FixedSizeBinary } from 'polkadot-api';
import { getSs58AddressInfo } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

import { DOT_LOCATION, ASSET_HUB_ID, ETHEREUM_CHAIN_ID } from './const';

const ETHER_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Location helpers for Snowbridge V2 XCM
 */
export const etherLocation = (ethChainId: number) => ({
  parents: 2,
  interior: XcmV5Junctions.X1(
    XcmV5Junction.GlobalConsensus(
      XcmV5NetworkId.Ethereum({ chain_id: BigInt(ethChainId) })
    )
  ),
});

export const erc20Location = (ethChainId: number, tokenAddress: string) => ({
  parents: 2,
  interior: XcmV5Junctions.X2([
    XcmV5Junction.GlobalConsensus(
      XcmV5NetworkId.Ethereum({ chain_id: BigInt(ethChainId) })
    ),
    XcmV5Junction.AccountKey20({
      key: FixedSizeBinary.fromHex(tokenAddress),
      network: undefined,
    }),
  ]),
});

// ---------------------------------------------------------------------------
// Inbound: Ethereum → Polkadot (used by Snowbridge Gateway v2_sendMessage)
// ---------------------------------------------------------------------------

export type SnowbridgeInboundXcmParams = {
  ethChainId: number;
  destinationParaId: number;
  tokenAddress: string;
  beneficiaryHex: string;
  tokenAmount: bigint;
  remoteEtherFeeAmount: bigint;
  remoteDotFeeAmount?: bigint;
  topic: string;
};

/**
 * Builds the XCM V5 program passed to `v2_sendMessage` for
 * transferring ERC20/ETH from Ethereum to a Polkadot parachain.
 *
 * If `remoteDotFeeAmount` is provided, an ExchangeAsset instruction
 * is prepended to swap Ether for DOT on AssetHub (for parachains
 * that require DOT as the fee asset).
 *
 * Flow:
 * 1. (Optional) ExchangeAsset: swap Ether for DOT on AssetHub
 * 2. InitiateTransfer to destination parachain
 *    - remote_fees: ReserveDeposit(ether or DOT) for destination execution
 *    - assets: ReserveDeposit(token) for the actual transfer
 *    - remote_xcm: RefundSurplus + DepositAsset to beneficiary
 * 3. RefundSurplus (reclaim unused ether on Asset Hub)
 * 4. DepositAsset remaining ether to beneficiary on Asset Hub
 * 5. SetTopic for tracking
 */
export function buildSnowbridgeInboundXcm(
  params: SnowbridgeInboundXcmParams
): XcmV5Instruction[] {
  const {
    ethChainId,
    destinationParaId,
    tokenAddress,
    beneficiaryHex,
    tokenAmount,
    remoteEtherFeeAmount,
    remoteDotFeeAmount,
    topic,
  } = params;

  const ether = etherLocation(ethChainId);
  const token =
    tokenAddress === ETHER_TOKEN_ADDRESS
      ? ether
      : erc20Location(ethChainId, tokenAddress);

  const isEthAddress =
    beneficiaryHex.length === 42 && beneficiaryHex.startsWith('0x');
  const beneficiaryJunction = isEthAddress
    ? XcmV5Junction.AccountKey20({
        key: FixedSizeBinary.fromHex(beneficiaryHex),
        network: undefined,
      })
    : XcmV5Junction.AccountId32({
        id: FixedSizeBinary.fromHex(beneficiaryHex),
        network: undefined,
      });

  const beneficiary = {
    parents: 0,
    interior: XcmV5Junctions.X1(beneficiaryJunction),
  };

  const useDotFees =
    remoteDotFeeAmount !== undefined && remoteDotFeeAmount > 0n;

  const remoteFeeFilter = useDotFees
    ? XcmV5AssetFilter.Wild(
        XcmV5WildAsset.AllOf({
          id: DOT_LOCATION,
          fun: { type: 'Fungible' as const, value: undefined },
        })
      )
    : XcmV5AssetFilter.Definite([
        {
          id: ether,
          fun: XcmV3MultiassetFungibility.Fungible(remoteEtherFeeAmount),
        },
      ]);

  const instructions: XcmV5Instruction[] = [];

  // Swap Ether for DOT on AssetHub if destination needs DOT fees
  if (useDotFees) {
    instructions.push(
      XcmV5Instruction.ExchangeAsset({
        give: XcmV5AssetFilter.Definite([
          {
            id: ether,
            fun: XcmV3MultiassetFungibility.Fungible(remoteEtherFeeAmount),
          },
        ]),
        want: [
          {
            id: DOT_LOCATION,
            fun: XcmV3MultiassetFungibility.Fungible(remoteDotFeeAmount),
          },
        ],
        maximal: true,
      })
    );
  }

  instructions.push(
    XcmV5Instruction.InitiateTransfer({
      destination: {
        parents: 1,
        interior: XcmV5Junctions.X1(XcmV5Junction.Parachain(destinationParaId)),
      },
      remote_fees: {
        type: 'ReserveDeposit',
        value: remoteFeeFilter,
      },
      preserve_origin: false,
      assets: [
        {
          type: 'ReserveDeposit',
          value: XcmV5AssetFilter.Definite([
            {
              id: token,
              fun: XcmV3MultiassetFungibility.Fungible(tokenAmount),
            },
          ]),
        },
      ],
      remote_xcm: [
        XcmV5Instruction.RefundSurplus(),
        XcmV5Instruction.DepositAsset({
          assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.AllCounted(3)),
          beneficiary,
        }),
        XcmV5Instruction.SetTopic(FixedSizeBinary.fromHex(topic)),
      ],
    }),
    XcmV5Instruction.RefundSurplus(),
    XcmV5Instruction.DepositAsset({
      assets: XcmV5AssetFilter.Wild(
        XcmV5WildAsset.AllOf({
          id: ether,
          fun: { type: 'Fungible' as const, value: undefined },
        })
      ),
      beneficiary,
    }),
    XcmV5Instruction.SetTopic(FixedSizeBinary.fromHex(topic))
  );

  return instructions;
}

// ---------------------------------------------------------------------------
// Outbound: Polkadot → Ethereum (used by polkadotXcm.execute)
// ---------------------------------------------------------------------------

export type SnowbridgeOutboundXcmParams = {
  tokenAddress: string;
  senderPubKey: string;
  beneficiaryHex: string;
  tokenAmount: bigint;
  sourceExecutionFee: bigint;
  dotRemoteFee: bigint;
  dotToEtherSwapAmount: bigint;
  etherFeeAmount: bigint;
  topic: string;
};

/**
 * Builds the V5 XCM program for `polkadotXcm.execute` to transfer
 * ERC20/ETH from a Polkadot parachain to Ethereum via Snowbridge V2.
 *
 * 3-leg program:
 *
 * Leg 1 — Source parachain:
 *   WithdrawAsset, PayFees, SetAppendix (error recovery), InitiateTransfer → AssetHub
 *
 * Leg 2 — AssetHub (remote_xcm):
 *   SetAppendix (error recovery), ExchangeAsset (DOT→Ether), InitiateTransfer → Ethereum
 *
 * Leg 3 — Ethereum (innermost remote_xcm):
 *   DepositAsset to beneficiary, SetTopic
 */
export function buildSnowbridgeOutboundXcm(
  params: SnowbridgeOutboundXcmParams
): XcmV5Instruction[] {
  const {
    tokenAddress,
    senderPubKey,
    beneficiaryHex,
    tokenAmount,
    sourceExecutionFee,
    dotRemoteFee,
    dotToEtherSwapAmount,
    etherFeeAmount,
    topic,
  } = params;

  const ether = etherLocation(ETHEREUM_CHAIN_ID);
  const isNativeEther = tokenAddress === ETHER_TOKEN_ADDRESS;
  const token = isNativeEther
    ? ether
    : erc20Location(ETHEREUM_CHAIN_ID, tokenAddress);

  const topicBin = FixedSizeBinary.fromHex(topic);

  const sender = {
    parents: 0,
    interior: XcmV5Junctions.X1(
      XcmV5Junction.AccountId32({
        id: FixedSizeBinary.fromHex(senderPubKey),
        network: undefined,
      })
    ),
  };

  const ethBeneficiary = {
    parents: 0,
    interior: XcmV5Junctions.X1(
      XcmV5Junction.AccountKey20({
        key: FixedSizeBinary.fromHex(beneficiaryHex),
        network: undefined,
      })
    ),
  };

  const ethereumDest = {
    parents: 2,
    interior: XcmV5Junctions.X1(
      XcmV5Junction.GlobalConsensus(
        XcmV5NetworkId.Ethereum({ chain_id: BigInt(ETHEREUM_CHAIN_ID) })
      )
    ),
  };

  // --- Leg 3: Ethereum ---
  const ethereumXcm = [
    XcmV5Instruction.DepositAsset({
      assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.AllCounted(3)),
      beneficiary: ethBeneficiary,
    }),
    XcmV5Instruction.SetTopic(topicBin),
  ];

  // --- Leg 2: AssetHub ---
  const assetHubXcm: XcmV5Instruction[] = [
    // Error recovery on AssetHub: return assets to sender
    XcmV5Instruction.SetAppendix([
      XcmV5Instruction.SetHints({
        hints: [{ type: 'AssetClaimer', value: { location: sender } }],
      }),
      XcmV5Instruction.RefundSurplus(),
      XcmV5Instruction.DepositAsset({
        assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.All()),
        beneficiary: sender,
      }),
    ]),
  ];

  // Swap DOT for Ether on AssetHub DEX
  if (!isNativeEther) {
    assetHubXcm.push(
      XcmV5Instruction.ExchangeAsset({
        give: XcmV5AssetFilter.Definite([
          {
            id: DOT_LOCATION,
            fun: XcmV3MultiassetFungibility.Fungible(dotToEtherSwapAmount),
          },
        ]),
        want: [
          {
            id: ether,
            fun: XcmV3MultiassetFungibility.Fungible(etherFeeAmount),
          },
        ],
        maximal: false,
      })
    );
  }

  const bridgeAssets = isNativeEther
    ? [
        {
          type: 'ReserveWithdraw' as const,
          value: XcmV5AssetFilter.Wild(
            XcmV5WildAsset.AllOf({
              id: ether,
              fun: { type: 'Fungible' as const, value: undefined },
            })
          ),
        },
      ]
    : [
        {
          type: 'ReserveWithdraw' as const,
          value: XcmV5AssetFilter.Wild(
            XcmV5WildAsset.AllOf({
              id: token,
              fun: { type: 'Fungible' as const, value: undefined },
            })
          ),
        },
      ];

  const bridgeRemoteFees = isNativeEther
    ? XcmV5AssetFilter.Definite([
        {
          id: ether,
          fun: XcmV3MultiassetFungibility.Fungible(etherFeeAmount),
        },
      ])
    : XcmV5AssetFilter.Wild(
        XcmV5WildAsset.AllOf({
          id: ether,
          fun: { type: 'Fungible' as const, value: undefined },
        })
      );

  assetHubXcm.push(
    // Bridge to Ethereum
    XcmV5Instruction.InitiateTransfer({
      destination: ethereumDest,
      remote_fees: {
        type: 'ReserveWithdraw',
        value: bridgeRemoteFees,
      },
      preserve_origin: true,
      assets: bridgeAssets,
      remote_xcm: ethereumXcm,
    }),
    XcmV5Instruction.SetTopic(topicBin)
  );

  // Total DOT withdrawn: PayFees budget + remote_fees on AH + swap DOT
  const totalDot = sourceExecutionFee + dotRemoteFee + dotToEtherSwapAmount;

  const withdrawAssets = [
    {
      id: DOT_LOCATION,
      fun: XcmV3MultiassetFungibility.Fungible(totalDot),
    },
    {
      id: token,
      fun: XcmV3MultiassetFungibility.Fungible(tokenAmount),
    },
  ];

  const sourceXcmFeeAssets: typeof withdrawAssets = [
    {
      id: DOT_LOCATION,
      fun: XcmV3MultiassetFungibility.Fungible(sourceExecutionFee),
    },
  ];

  // Assets forwarded to AssetHub via InitiateTransfer:
  const tokenAsset = {
    type: 'ReserveWithdraw' as const,
    value: XcmV5AssetFilter.Wild(
      XcmV5WildAsset.AllOf({
        id: token,
        fun: { type: 'Fungible' as const, value: undefined },
      })
    ),
  };

  // For ERC20 transfers, include DOT for the swap as a separate asset.
  // This DOT lands in holding on AssetHub (not the fee register),
  // so ExchangeAsset can swap it for Ether.
  const initiateAssets =
    !isNativeEther && dotToEtherSwapAmount > 0n
      ? [
          {
            type: 'ReserveWithdraw' as const,
            value: XcmV5AssetFilter.Definite([
              {
                id: DOT_LOCATION,
                fun: XcmV3MultiassetFungibility.Fungible(dotToEtherSwapAmount),
              },
            ]),
          },
          tokenAsset,
        ]
      : [tokenAsset];

  return [
    XcmV5Instruction.WithdrawAsset(withdrawAssets),
    XcmV5Instruction.PayFees({
      asset: sourceXcmFeeAssets[0],
    }),
    // Error recovery on source: return assets to sender
    XcmV5Instruction.SetAppendix([
      XcmV5Instruction.SetHints({
        hints: [{ type: 'AssetClaimer', value: { location: sender } }],
      }),
      XcmV5Instruction.RefundSurplus(),
      XcmV5Instruction.DepositAsset({
        assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.All()),
        beneficiary: sender,
      }),
    ]),
    // Transfer to AssetHub
    XcmV5Instruction.InitiateTransfer({
      destination: {
        parents: 1,
        interior: XcmV5Junctions.X1(XcmV5Junction.Parachain(ASSET_HUB_ID)),
      },
      remote_fees: {
        type: 'ReserveWithdraw',
        value: XcmV5AssetFilter.Definite([
          {
            id: DOT_LOCATION,
            fun: XcmV3MultiassetFungibility.Fungible(dotRemoteFee),
          },
        ]),
      },
      preserve_origin: true,
      assets: initiateAssets,
      remote_xcm: assetHubXcm,
    }),
    XcmV5Instruction.SetTopic(topicBin),
  ];
}

// ---------------------------------------------------------------------------
// Message builder for polkadotXcm.execute (used in route templates)
// ---------------------------------------------------------------------------

export function snowbridgeOutboundMessage(
  params: ExtrinsicConfigBuilderParams
) {
  const { address, amount, asset, sender, source, destination, messageId } =
    params;
  const ctx = source.chain as Parachain;

  const senderInfo = getSs58AddressInfo(sender);
  if (!senderInfo.isValid) {
    throw new Error(`Invalid SS58 address: ${sender}`);
  }
  const senderPubKey = toHex(senderInfo.publicKey);

  const assetLocation = ctx.getAssetXcmLocation(asset);
  const erc20KeyObj = assetLocation
    ? multiloc.findNestedKey(assetLocation, 'key')
    : undefined;
  const tokenAddress = erc20KeyObj
    ? (erc20KeyObj.key as string)
    : ETHER_TOKEN_ADDRESS;

  const feeBreakdown = destination.feeBreakdown;
  const sourceExecutionFee = feeBreakdown['sourceExecutionFee'] ?? 0n;
  const dotRemoteFee = feeBreakdown['dotRemoteFee'] ?? 0n;
  const dotToEtherSwapAmount = feeBreakdown['dotToEtherSwapAmount'] ?? 0n;
  const etherFeeAmount = feeBreakdown['etherFeeAmount'] ?? 0n;

  const topic =
    messageId ??
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  const xcmInstructions = buildSnowbridgeOutboundXcm({
    tokenAddress,
    senderPubKey,
    beneficiaryHex: address,
    tokenAmount: amount,
    sourceExecutionFee,
    dotRemoteFee,
    dotToEtherSwapAmount,
    etherFeeAmount,
    topic,
  });

  return XcmVersionedXcm.V5(xcmInstructions);
}
