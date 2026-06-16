import { ContractConfigBuilderParams } from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

import { eth, usdc } from '../../../assets';
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

    it('maps outputToken to the L1 equivalent of the L2 input token', async () => {
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
      expect(deposit.inputAmount).toBe(1000000n);
      // Base USDC → Ethereum USDC via Across swap registry
      expect(deposit.inputToken.toLowerCase()).toBe(
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
      );
      expect(deposit.outputToken.toLowerCase()).toBe(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      );
    });

    it('subtracts acrossRelayerFee and swapInputAmount from outputAmount', async () => {
      const ctx = buildCtx(
        ALICE_SS58,
        new Map([
          ['acrossRelayerFee', 5000n],
          ['swapInputAmount', 2000n],
        ])
      );
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const deposit = config.args[0] as { outputAmount: bigint };
      // amount(1_000_000) - acrossFee(5_000) - swapInput(2_000) = 993_000
      expect(deposit.outputAmount).toBe(993000n);
    });

    it('produces non-empty Uniswap exactOutputSingle calldata in SwapParams', async () => {
      const ctx = buildCtx(
        ALICE_SS58,
        new Map([
          ['executionFee', 1234n],
          ['relayerFee', 5678n],
          ['swapInputAmount', 10000n],
        ])
      );
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const swap = config.args[1] as {
        inputAmount: bigint;
        router: string;
        callData: string;
      };
      expect(swap.inputAmount).toBe(10000n);
      // Uniswap V3 SwapRouter on Ethereum mainnet
      expect(swap.router.toLowerCase()).toBe(
        '0xe592427a0aece92de3edee1f18e0157c05861564'
      );
      // exactOutputSingle selector + a tuple of 8 32-byte slots
      expect(swap.callData.length).toBe(2 + 8 + 8 * 64);
      // Function selector for SwapRouter.exactOutputSingle
      expect(swap.callData.slice(0, 10)).toBe('0xdb3e2198');
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

  describe('sendEtherAndCall (WETH/ETH path)', () => {
    const buildEthCtx = (
      address: string,
      feeBreakdown?: Iterable<[string, bigint]>
    ): ContractConfigBuilderParams => {
      const breakdown: { [k: string]: bigint } = {};
      if (feeBreakdown) for (const [k, v] of feeBreakdown) breakdown[k] = v;
      return {
        address,
        amount: 10n ** 17n, // 0.1 ETH
        asset: eth,
        sender: EVM_USER,
        source: { chain: base },
        destination: { chain: hydration, feeBreakdown: breakdown },
      } as unknown as ContractConfigBuilderParams;
    };

    it('targets sendEtherAndCall with outputToken = WETH on Ethereum', async () => {
      const ctx = buildEthCtx(ALICE_SS58);
      const config = await Across().Snowbridge().sendEtherAndCall().build(ctx);

      expect(config.func).toBe('sendEtherAndCall');
      expect(config.module).toBe('AcrossSnowbridge');
      const deposit = config.args[0] as { outputToken: string };
      expect(deposit.outputToken.toLowerCase()).toBe(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      );
    });

    it('omits SwapParams entirely (4 args, not 5)', async () => {
      const ctx = buildEthCtx(ALICE_SS58);
      const config = await Across().Snowbridge().sendEtherAndCall().build(ctx);
      expect(config.args).toHaveLength(4);
    });

    it('subtracts Snowbridge fees from outputAmount instead of routing them through SwapParams', async () => {
      const ctx = buildEthCtx(
        ALICE_SS58,
        new Map([
          ['executionFee', 1000n],
          ['relayerFee', 2000n],
          ['acrossRelayerFee', 500n],
        ])
      );
      const config = await Across().Snowbridge().sendEtherAndCall().build(ctx);
      const deposit = config.args[0] as { outputAmount: bigint };
      // 0.1 ETH - 500 - 1000 - 2000
      expect(deposit.outputAmount).toBe(10n ** 17n - 3500n);
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
