import {
  acc,
  addr,
  Abi,
  AnyEvmChain,
  CallType,
  Precompile,
} from '@galacticcouncil/xc-core';
import { EvmCall } from '@galacticcouncil/xc-sdk';
import { encodeFunctionData } from 'viem';

import { XCM_TRANSACTOR_ABI, XCM_TRANSACTOR_V3 } from './abi';
import { sign } from './signers';
import { ctx } from './setup';
import { encodeParachainJunction } from './utils';

const { config } = ctx;

// Define transfer constraints
const srcChain = config.getChain('moonbeam') as AnyEvmChain;

const HYDRATION_PARACHAIN_ID = 2034;
const MOONBEAM_PARACHAIN_ID = 2004;

// Define source & dest accounts
const srcAddr = '0x03F067F5174DF6E4E49285D32d9Ce1615711BCe9';
// 7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh

// HDX XC-20 address on Moonbeam
const HDX_XC20 = '0xffffffff345dc44ddae98df024eb494321e73fcc' as `0x${string}`;

// Compute derived origin account on Hydration
const derivedAccount = acc.getMultilocationDerivatedAccount(
  MOONBEAM_PARACHAIN_ID,
  srcAddr,
  1, // parents = 1 (sibling parachain)
  false
);
const derivedPubKey = addr.Ss58Addr.getPubKey(derivedAccount) as `0x${string}`;

console.log('Moonbeam sender:', srcAddr);
console.log('Derived origin account on Hydration:', derivedAccount);

// Subcall 1: Fund derived account via PolkadotXcm.transferAssetsToPara32
// Sends HDX from Moonbeam to the derived account on Hydration.
// HDX is used as fee asset on Hydration for the subsequent transact call.
const fundCallData = encodeFunctionData({
  abi: Abi.PolkadotXcm,
  functionName: 'transferAssetsToPara32',
  args: [
    HYDRATION_PARACHAIN_ID,
    derivedPubKey,
    [{ asset: HDX_XC20, amount: 10_000_000_000_000n }], // 10 HDX (12 decimals)
    0, // feeAssetItem
  ],
});

// Subcall 2: Remote transact via XcmTransactor precompile
// Executes balances.transferKeepAlive on Hydration from the derived account.
// Fees are paid in HDX (funded by subcall 1).

// Pre-encoded Hydration call: Balances.transfer_keep_alive(dest, 100000)
// Encoded via Polkadot.js Apps, can be replaced with any Hydration extrinsic
const encodedHydrationCall =
  '0x070382fb02afe02fe5d6c793145a75e6860c4e206682c3ab395a9d2a941eb7c0d30d0b00a0724e1809';

const transactCallData = encodeFunctionData({
  abi: XCM_TRANSACTOR_ABI,
  functionName: 'transactThroughSigned',
  args: [
    // dest: Hydration (parachain 2034)
    { parents: 1, interior: [encodeParachainJunction(HYDRATION_PARACHAIN_ID)] },
    // feeLocationAddress: HDX XC-20 on Moonbeam
    HDX_XC20,
    // transactRequiredWeightAtMost
    { refTime: 1_000_000_000n, proofSize: 50_000n },
    // call (SCALE-encoded Hydration extrinsic)
    encodedHydrationCall as `0x${string}`,
    // feeAmount: 5 HDX (pays XCM execution fees on Hydration, 12 decimals)
    5_000_000_000_000n,
    // overallWeight: overall weight for full XCM program
    { refTime: 2_000_000_000n, proofSize: 100_000n },
    // refund surplus
    true,
  ],
});

// Batch both subcalls via Moonbeam Batch precompile (0x0808)
const batchCallData = encodeFunctionData({
  abi: Abi.Batch,
  functionName: 'batchAll',
  args: [
    [Precompile.PolkadotXcm, XCM_TRANSACTOR_V3],
    [0n, 0n],
    [fundCallData, transactCallData],
    [],
  ],
});

// Dump call info
console.log('Encoded Hydration call:', encodedHydrationCall);
console.log('Batched calldata:', batchCallData);

const call: EvmCall = {
  from: srcAddr,
  data: batchCallData,
  type: CallType.Evm,
  to: Precompile.Batch as `0x${string}`,
  dryRun: async () => undefined,
};

console.log(call);

// Sign & send
await sign(call, srcChain);
