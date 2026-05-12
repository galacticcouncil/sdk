import { ContractConfigBuilderParams } from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

import { usdc } from '../../../assets';
import { base } from '../../../chains/evm/base';
import { hydration } from '../../../chains/polkadot/hydration';

import { Across } from './index';

const { H160 } = h160;

const ALICE_SS58 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const ALICE_H160 = '0xD43593c715Fdd31C61141Abd04a99FD6822c8558';
const EVM_USER = '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0';

const buildCtx = (
  address: string,
  feeBreakdown?: Iterable<[string, bigint]>
): ContractConfigBuilderParams => {
  const breakdown: { [k: string]: bigint } = {};
  if (feeBreakdown) for (const [k, v] of feeBreakdown) breakdown[k] = v;
  return {
    address,
    amount: 1000000n,
    asset: usdc,
    sender: EVM_USER,
    source: { chain: base },
    destination: { chain: hydration, feeBreakdown: breakdown },
  } as unknown as ContractConfigBuilderParams;
};

describe('Across.Snowbridge contract builder', () => {
  describe('sendTokenAndCall', () => {
    it('targets the Snowfork L2 adaptor on Base', async () => {
      const ctx = buildCtx(ALICE_SS58);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);

      expect(config.func).toBe('sendTokenAndCall');
      expect(config.module).toBe('AcrossSnowbridge');
      expect(config.address.toLowerCase()).toBe(
        '0x07fe4e7340976fc873b74bafe3c3e5b0e01f3665'
      );
      expect(config.args).toHaveLength(5);
    });

    it('encodes DepositParams with destinationChainId=Ethereum and same input/output token', async () => {
      const ctx = buildCtx(ALICE_SS58);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const deposit = config.args[0] as {
        inputToken: string;
        outputToken: string;
        inputAmount: bigint;
        outputAmount: bigint;
        destinationChainId: bigint;
        fillDeadlineBuffer: number;
      };

      expect(deposit.destinationChainId).toBe(1n);
      expect(deposit.fillDeadlineBuffer).toBe(600);
      expect(deposit.inputToken.toLowerCase()).toBe(deposit.outputToken.toLowerCase());
      expect(deposit.inputAmount).toBe(1000000n);
    });

    it('subtracts acrossRelayerFee from outputAmount', async () => {
      const ctx = buildCtx(
        ALICE_SS58,
        new Map([['acrossRelayerFee', 5000n]])
      );
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const deposit = config.args[0] as { outputAmount: bigint };
      expect(deposit.outputAmount).toBe(995000n);
    });

    it('reads Snowbridge fees from feeBreakdown into SendParams', async () => {
      const ctx = buildCtx(
        ALICE_SS58,
        new Map([
          ['executionFee', 1234n],
          ['relayerFee', 5678n],
        ])
      );
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const send = config.args[2] as {
        executionFee: bigint;
        relayerFee: bigint;
      };
      expect(send.executionFee).toBe(1234n);
      expect(send.relayerFee).toBe(5678n);
    });

    it('uses the H160 recipient verbatim when given an EVM address as L2 adaptor fallback', async () => {
      const ctx = buildCtx(ALICE_H160);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      expect((config.args[3] as string).toLowerCase()).toBe(
        ALICE_H160.toLowerCase()
      );
    });

    it('converts a Hydration SS58 EVM-mapped address back to its H160 for the L2 adaptor fallback', async () => {
      const ss58 = H160.toAccount(ALICE_H160);
      const ctx = buildCtx(ss58);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      expect((config.args[3] as string).toLowerCase()).toBe(
        ALICE_H160.toLowerCase()
      );
    });

    it('throws when source chain has no SnowbridgeL2Adaptor configured', async () => {
      const noAcrossCtx = {
        ...buildCtx(ALICE_SS58),
        source: { chain: hydration }, // hydration has no Across config
      } as unknown as ContractConfigBuilderParams;
      await expect(
        Across().Snowbridge().sendTokenAndCall().build(noAcrossCtx)
      ).rejects.toThrow();
    });
  });

  describe('SendParams encoding', () => {
    it('produces non-empty SCALE-encoded XCM bytes via the hub codec', async () => {
      const ctx = buildCtx(ALICE_SS58);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const send = config.args[2] as { xcm: string };
      // V5 versioned XCM with InitiateTransfer + RefundSurplus + DepositAsset
      // + SetTopic is at least 100 bytes; we just sanity-check non-trivial size.
      expect(send.xcm.startsWith('0x')).toBe(true);
      expect(send.xcm.length).toBeGreaterThan(200);
    });

    it('ABI-encodes a single asset entry with kind=0 and the ERC20 amount', async () => {
      const ctx = buildCtx(ALICE_SS58);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const send = config.args[2] as { assets: string[] };
      expect(send.assets).toHaveLength(1);
      // ABI-encoded (uint8, address, uint128) = 3 * 32 bytes = 0x + 192 hex chars
      expect(send.assets[0].length).toBe(2 + 192);
      // Last bytes encode the amount = 1000000 = 0xF4240
      expect(send.assets[0].endsWith('f4240')).toBe(true);
    });

    it('encodes the claimer as a V5 AccountId32 location (no versioning prefix)', async () => {
      const ctx = buildCtx(ALICE_SS58);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const send = config.args[2] as { claimer: string };
      // codec.location.enc(VersionedLocation.V5(...)) → slice(1) drops version byte
      expect(send.claimer.startsWith('0x')).toBe(true);
      expect(send.claimer.length).toBeGreaterThan(2);
      // Alice's raw AccountId32 should appear inside
      expect(send.claimer.toLowerCase()).toContain(
        'd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
      );
    });
  });
});
