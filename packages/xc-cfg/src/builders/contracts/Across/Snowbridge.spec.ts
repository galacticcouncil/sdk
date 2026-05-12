import { ContractConfigBuilderParams } from '@galacticcouncil/xc-core';
import { h160 } from '@galacticcouncil/common';

import { usdc } from '../../../assets';
import { base } from '../../../chains/evm/base';
import { hydration } from '../../../chains/polkadot/hydration';

import { Across } from './index';

const { H160 } = h160;

type FeeBreakdown = ConstructorParameters<typeof Map<string, bigint>>[0];

const buildCtx = (
  address: string,
  feeBreakdown?: FeeBreakdown
): ContractConfigBuilderParams => {
  const breakdown: { [k: string]: bigint } = {};
  if (feeBreakdown) for (const [k, v] of feeBreakdown) breakdown[k] = v;
  return {
    address,
    amount: 1000000n,
    asset: usdc,
    sender: '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0',
    source: { chain: base },
    destination: { chain: hydration, feeBreakdown: breakdown },
  } as unknown as ContractConfigBuilderParams;
};

describe('Across.Snowbridge contract builder', () => {
  describe('sendTokenAndCall', () => {
    it('produces a ContractConfig targeting Snowfork L2 adaptor on Base', async () => {
      const ctx = buildCtx('0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0');
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);

      expect(config.func).toBe('sendTokenAndCall');
      expect(config.module).toBe('AcrossSnowbridge');
      // SnowbridgeL2Adaptor on Base mainnet
      expect(config.address.toLowerCase()).toBe(
        '0x07fe4e7340976fc873b74bafe3c3e5b0e01f3665'
      );
      expect(config.args).toHaveLength(5);
    });

    it('encodes DepositParams with destinationChainId=Ethereum and same input/output token', async () => {
      const ctx = buildCtx('0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0');
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
      expect(deposit.inputToken).toBe(deposit.outputToken);
      expect(deposit.inputAmount).toBe(1000000n);
    });

    it('subtracts acrossRelayerFee from outputAmount', async () => {
      const ctx = buildCtx(
        '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0',
        new Map([['acrossRelayerFee', 5000n]])
      );
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const deposit = config.args[0] as { outputAmount: bigint };
      expect(deposit.outputAmount).toBe(995000n);
    });

    it('reads Snowbridge fees from feeBreakdown into SendParams', async () => {
      const ctx = buildCtx(
        '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0',
        new Map([
          ['snowbridgeExecutionFee', 1234n],
          ['snowbridgeRelayerFee', 5678n],
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

    it('uses the H160 recipient verbatim when given an EVM address', async () => {
      const evm = '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0';
      const ctx = buildCtx(evm);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      expect((config.args[3] as string).toLowerCase()).toBe(evm.toLowerCase());
    });

    it('converts a Hydration SS58 EVM-mapped address back to its H160', async () => {
      const evm = '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0';
      const ss58 = H160.toAccount(evm);
      const ctx = buildCtx(ss58);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      expect((config.args[3] as string).toLowerCase()).toBe(evm.toLowerCase());
    });

    it('throws when source chain has no SnowbridgeL2Adaptor configured', async () => {
      const noAcrossCtx = {
        ...buildCtx('0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0'),
        source: { chain: hydration }, // hydration has no Across config
      } as unknown as ContractConfigBuilderParams;
      await expect(
        Across().Snowbridge().sendTokenAndCall().build(noAcrossCtx)
      ).rejects.toThrow();
    });
  });

  describe('claimer (SendParams) encoding', () => {
    it('encodes H160 as AccountKey20 with parents=0, X1 interior', async () => {
      const evm = '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0';
      const ctx = buildCtx(evm);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const send = config.args[2] as { claimer: string };
      // 0x00 0x0101 0x03 <20 bytes> 0x00
      expect(send.claimer.toLowerCase()).toBe(
        '0x000103' + evm.slice(2).toLowerCase() + '00'
      );
    });

    it('encodes a native SS58 substrate account as AccountId32', async () => {
      const alice = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const ctx = buildCtx(alice);
      const config = await Across().Snowbridge().sendTokenAndCall().build(ctx);
      const send = config.args[2] as { claimer: string };
      // 0x00 0x0100 <32 bytes Alice raw> 0x00
      expect(send.claimer.toLowerCase()).toBe(
        '0x000100' +
          'd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d' +
          '00'
      );
    });
  });
});
