import { jest } from '@jest/globals';

import { SolanaChain } from '@galacticcouncil/xc-core';

import { sol } from '../../assets';
import { base, ethereum, hydration, solana, sui_chain } from '../../chains';

import { nttClient } from './index';

/** Recipient the ata is derived for; only its existence is read. */
const RECIPIENT = '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T';

const mockSolana = (ataExists: boolean) => {
  jest.spyOn(SolanaChain.prototype, 'connection', 'get').mockReturnValue({
    // First read is the mint (its owner picks the token program), second is
    // the ata itself.
    getAccountInfo: jest
      .fn<any>()
      .mockResolvedValueOnce({ owner: undefined })
      .mockResolvedValueOnce(ataExists ? {} : null),
    getMinimumBalanceForRentExemption: async () => 2_039_280,
  } as any);
};

describe('nttClient.getRedeemBudget', () => {
  afterEach(() => jest.restoreAllMocks());

  // An evm redeem holds nothing, so budgeting a msgValue would only inflate
  // the quote the source pays.
  describe('evm destination', () => {
    it.each([
      ['ethereum', ethereum],
      ['base', base],
      ['hydration', hydration],
    ])('should budget no value for %s', async (_, chain) => {
      const budget = await nttClient(chain).getRedeemBudget();
      expect(budget.msgValue).toBe(0n);
      expect(budget.gasLimit).toBe(500_000n);
    });
  });

  // Sui budgets in MIST, so the evm number is meaningless here - live redeems
  // settle at ~6.48M against a 7_556_176 budget.
  describe('sui destination', () => {
    it('should clear the observed redeem budget', async () => {
      const { gasLimit } = await nttClient(sui_chain).getRedeemBudget();
      expect(gasLimit).toBeGreaterThan(7_556_176n);
    });

    it('should stay under sui advertised maxGasLimit', async () => {
      const { gasLimit } = await nttClient(sui_chain).getRedeemBudget();
      expect(gasLimit).toBeLessThan(1_000_000_000n);
    });

    it('should budget no value', async () => {
      const { msgValue } = await nttClient(sui_chain).getRedeemBudget();
      expect(msgValue).toBe(0n);
    });
  });

  describe('solana destination', () => {
    // A redeem is four transactions and permanently creates the transceiver
    // message & inbox pdas - measured at 9_292_040 lamports with the ata open.
    it('should clear the measured redeem cost when the ata exists', async () => {
      mockSolana(true);
      const { msgValue } = await nttClient(solana, sol).getRedeemBudget(
        RECIPIENT
      );
      expect(msgValue).toBeGreaterThan(9_292_040n);
    });

    // The relayer opens the ata when missing and is only reimbursed what the
    // quote budgeted, so its rent has to be in there too.
    it('should add ata rent when the recipient has none', async () => {
      mockSolana(false);
      const { msgValue } = await nttClient(solana, sol).getRedeemBudget(
        RECIPIENT
      );
      expect(msgValue).toBeGreaterThan(9_292_040n + 2_039_280n);
    });

    // Charging rent nobody spends is paid for by the sender in source native.
    it('should not charge ata rent when the ata is already open', async () => {
      mockSolana(true);
      const open = await nttClient(solana, sol).getRedeemBudget(RECIPIENT);
      mockSolana(false);
      const missing = await nttClient(solana, sol).getRedeemBudget(RECIPIENT);
      expect(missing.msgValue - open.msgValue).toBe(2_039_280n);
    });

    // No recipient means the ata cannot be read; over-quoting delays nothing,
    // under-quoting aborts the relay.
    it('should assume a missing ata when the recipient is unknown', async () => {
      const { msgValue } = await nttClient(solana).getRedeemBudget();
      expect(msgValue).toBeGreaterThan(9_292_040n + 2_039_280n);
    });

    it('should stay under solana advertised maxMsgValue', async () => {
      mockSolana(false);
      const { msgValue } = await nttClient(solana, sol).getRedeemBudget(
        RECIPIENT
      );
      expect(msgValue).toBeLessThan(30_000_000n);
    });
  });
});
