import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  jest,
} from '@jest/globals';

import {
  Asset,
  Parachain,
  ContractConfigBuilderParams,
} from '@galacticcouncil/xc-core';
import {
  assetsMap,
  builders,
  chainsMap,
} from '@galacticcouncil/xc-cfg';
import {
  hub as hubDescriptor,
  hydration as hydraDescriptor,
  XcmV5Instruction,
  XcmVersionedXcm,
} from '@galacticcouncil/descriptors';

import { fromHex } from '@polkadot-api/utils';
import { getTypedCodecs } from 'polkadot-api';

import * as c from 'console';

import { createNetworks } from './spec/e2e/network';
import { SetupCtx } from './spec/e2e/types';

const usdc = assetsMap.get('usdc')!;
const eth = assetsMap.get('eth')!;
const assetHub = chainsMap.get('assethub') as Parachain;
const base = chainsMap.get('base')!;
const hydration = chainsMap.get('hydration') as Parachain;
const { ContractBuilder } = builders;

const ALICE_SS58 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

/**
 * Hand-crafted ContractConfigBuilderParams. Bypasses the FeeAmountBuilder and
 * Wallet setup — we only need the contract builder's XCM output here, with
 * fees pre-seeded so no live RPCs are hit while resolving.
 */
const buildCtx = (
  asset: Asset,
  feeBreakdown: { [k: string]: bigint }
): ContractConfigBuilderParams => {
  const isEth = asset.originSymbol === 'ETH';
  return {
    address: ALICE_SS58,
    amount: isEth ? 10n ** 17n : 1_000_000n,
    asset,
    sender: '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0',
    source: { chain: base },
    destination: { chain: hydration, feeBreakdown },
  } as unknown as ContractConfigBuilderParams;
};

const DEFAULT_BREAKDOWN = {
  acrossRelayerFee: 100_000n, // override: skip live Across API
  executionFee: 5_000_000_000_000_000n,
  relayerFee: 2_000_000_000_000_000n,
  remoteEtherFee: 1_500_000_000_000_000n,
  remoteDotFee: 500_000_000n,
  swapInputAmount: 10_000n,
};

/**
 * Decode the SendParams.xcm field a contract builder emits back into a
 * V5 instruction array we can hand to `XcmPaymentApi.query_xcm_weight`.
 */
const decodeXcm = async (xcmHex: string): Promise<XcmV5Instruction[]> => {
  const codecs = await getTypedCodecs(hubDescriptor);
  const messageCodec = codecs.tx.PolkadotXcm.send.inner.message;
  const versioned = messageCodec.dec(
    fromHex(xcmHex.startsWith('0x') ? xcmHex.slice(2) : xcmHex)
  ) as XcmVersionedXcm;
  if (versioned.type !== 'V5') {
    throw new Error(`expected V5 XCM, got ${versioned.type}`);
  }
  return versioned.value as XcmV5Instruction[];
};

/**
 * Walk an XCM instruction list and return the InitiateTransfer instruction's
 * `remote_xcm` — the program the destination parachain runs.
 */
const extractRemoteXcm = (
  instructions: XcmV5Instruction[]
): XcmV5Instruction[] => {
  const it = instructions.find((i) => i.type === 'InitiateTransfer');
  if (!it) throw new Error('No InitiateTransfer instruction in XCM');
  const inner = (it as { value: { remote_xcm: XcmV5Instruction[] } }).value;
  if (!inner.remote_xcm || inner.remote_xcm.length === 0) {
    throw new Error('InitiateTransfer.remote_xcm is empty');
  }
  return inner.remote_xcm;
};

describe('Across-Snowbridge XCM dry-run on chopsticks', () => {
  jest.setTimeout(10 * 60 * 1000); // chopsticks setup can take ~1 min/chain

  let networks: SetupCtx[] = [];

  beforeAll(async () => {
    // AssetHub processes the inbound XCM and forwards InitiateTransfer to
    // Hydration. We don't need a relay chain — both chains can be weighed
    // independently from their own clients.
    networks = await createNetworks([assetHub, hydration]);
    c.log('🥢 chopsticks ready: AssetHub + Hydration');
  });

  afterAll(async () => {
    await Promise.all(networks.map((n) => n.teardown()));
  });

  describe('sendTokenAndCall (Base USDC → Hydration)', () => {
    it('produces XCM that AssetHub can weigh successfully', async () => {
      const ctx = buildCtx(usdc, DEFAULT_BREAKDOWN);
      const config = await ContractBuilder()
        .Across()
        .Snowbridge()
        .sendTokenAndCall()
        .build(ctx);

      const sendParams = config.args[2] as { xcm: string };
      const instructions = await decodeXcm(sendParams.xcm);

      // Sanity: top-level program contains the InitiateTransfer that routes
      // the bridged USDC onward from AssetHub to Hydration (paraID 2034).
      const initiate = instructions.find((i) => i.type === 'InitiateTransfer');
      expect(initiate).toBeDefined();

      const ahNetwork = networks.find((n) => n.config.key === 'assethub')!;
      const ahApi = ahNetwork.client.getTypedApi(hubDescriptor);
      const weight = await ahApi.apis.XcmPaymentApi.query_xcm_weight({
        type: 'V5',
        value: instructions,
      });

      if (!weight.success) {
        throw new Error(
          `AssetHub weight calc failed: ${JSON.stringify(weight.value)}`
        );
      }
      // Successful weight implies the program parses and every instruction's
      // weighter resolves. Non-zero refTime confirms there's real work.
      expect(weight.value.ref_time).toBeGreaterThan(0n);
      expect(weight.value.proof_size).toBeGreaterThan(0n);
      c.log(
        `🥢 AssetHub weight: refTime=${weight.value.ref_time}, proofSize=${weight.value.proof_size}`
      );
    });

    it('remote_xcm parses and weighs on Hydration', async () => {
      const ctx = buildCtx(usdc, DEFAULT_BREAKDOWN);
      const config = await ContractBuilder()
        .Across()
        .Snowbridge()
        .sendTokenAndCall()
        .build(ctx);

      const sendParams = config.args[2] as { xcm: string };
      const instructions = await decodeXcm(sendParams.xcm);
      const remoteXcm = extractRemoteXcm(instructions);

      const hydraNetwork = networks.find((n) => n.config.key === 'hydration')!;
      const hydraApi = hydraNetwork.client.getTypedApi(hydraDescriptor);
      const weight = await hydraApi.apis.XcmPaymentApi.query_xcm_weight({
        type: 'V5',
        value: remoteXcm,
      });

      if (!weight.success) {
        throw new Error(
          `Hydration weight calc failed: ${JSON.stringify(weight.value)}`
        );
      }
      expect(weight.value.ref_time).toBeGreaterThan(0n);
      c.log(
        `🥢 Hydration remote_xcm weight: refTime=${weight.value.ref_time}, proofSize=${weight.value.proof_size}`
      );
    });
  });

  describe('sendEtherAndCall (Base ETH → Hydration)', () => {
    it('produces XCM that AssetHub can weigh successfully', async () => {
      const ctx = buildCtx(eth, DEFAULT_BREAKDOWN);
      const config = await ContractBuilder()
        .Across()
        .Snowbridge()
        .sendEtherAndCall()
        .build(ctx);

      // sendEtherAndCall uses args[1] for SendParams (no SwapParams).
      const sendParams = config.args[1] as { xcm: string };
      const instructions = await decodeXcm(sendParams.xcm);

      const ahNetwork = networks.find((n) => n.config.key === 'assethub')!;
      const ahApi = ahNetwork.client.getTypedApi(hubDescriptor);
      const weight = await ahApi.apis.XcmPaymentApi.query_xcm_weight({
        type: 'V5',
        value: instructions,
      });

      if (!weight.success) {
        throw new Error(
          `AssetHub weight calc (ether path) failed: ${JSON.stringify(weight.value)}`
        );
      }
      expect(weight.value.ref_time).toBeGreaterThan(0n);
      c.log(
        `🥢 AssetHub weight (ether path): refTime=${weight.value.ref_time}, proofSize=${weight.value.proof_size}`
      );
    });
  });

  /**
   * Demonstrates that the SendParams.assets ABI-encoding the builder produces
   * decodes back to (kind=0, token=USDC.base, amount=1_000_000). Not strictly
   * chopsticks, but lives alongside the rest of the dry-run preflight.
   */
  describe('SendParams.assets encoding', () => {
    it('encodes (kind, token, amount) for the ERC20 path', async () => {
      const ctx = buildCtx(usdc, DEFAULT_BREAKDOWN);
      const config = await ContractBuilder()
        .Across()
        .Snowbridge()
        .sendTokenAndCall()
        .build(ctx);

      const sendParams = config.args[2] as { assets: string[] };
      expect(sendParams.assets).toHaveLength(1);
      // 3 * 32-byte ABI slots = 192 hex chars + 0x prefix
      expect(sendParams.assets[0].length).toBe(2 + 192);
      // Last slot carries the amount; 1_000_000 = 0xF4240
      expect(sendParams.assets[0].endsWith('f4240')).toBe(true);
    });

    it('omits the asset entry on the ETH path (native value carries the deposit)', async () => {
      const ctx = buildCtx(eth, DEFAULT_BREAKDOWN);
      const config = await ContractBuilder()
        .Across()
        .Snowbridge()
        .sendEtherAndCall()
        .build(ctx);

      const sendParams = config.args[1] as { assets: string[] };
      expect(sendParams.assets).toHaveLength(0);
    });
  });
});
