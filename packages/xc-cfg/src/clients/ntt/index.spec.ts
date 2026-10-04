import { jest } from '@jest/globals';

import {
  EvmChain,
  NearChain,
  SolanaChain,
  SuiChain,
} from '@galacticcouncil/xc-core';

import { PublicKey } from '@solana/web3.js';

import { eth, sol, sui, wnear } from '../../assets';
import {
  base,
  ethereum,
  hydration,
  hyperevm,
  near_testnet,
  robinhood,
  solana,
  sui_chain,
} from '../../chains';

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
      ['hyperevm', hyperevm],
      ['robinhood', robinhood],
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
  // Nothing relays to NEAR - the recipient completes the transfer itself.
  describe('near destination', () => {
    it('should refuse an executor budget', async () => {
      await expect(
        nttClient(near_testnet, wnear).getRedeemBudget()
      ).rejects.toThrow('No executor');
    });
  });
});

describe('nttClient.getCustody', () => {
  afterEach(() => jest.restoreAllMocks());

  const mockEvm = (results: unknown[]) => {
    const readContract = jest.fn<any>();
    results.forEach((r) => readContract.mockResolvedValueOnce(r));
    jest.spyOn(EvmChain.prototype, 'evmClient', 'get').mockReturnValue({
      getProvider: () => ({ readContract }),
    } as any);
    return readContract;
  };

  // Custody of an evm locking manager is its own token balance.
  describe('evm destination', () => {
    it('should read the manager token balance of a locking manager', async () => {
      const readContract = mockEvm([0, 5_635_000_000_000_000n]);
      await expect(nttClient(ethereum, eth).getCustody()).resolves.toBe(
        5_635_000_000_000_000n
      );
      expect(readContract).toHaveBeenLastCalledWith(
        expect.objectContaining({ functionName: 'balanceOf' })
      );
    });

    it('should not read custody of a burning manager', async () => {
      const readContract = mockEvm([1]);
      await expect(
        nttClient(ethereum, eth).getCustody()
      ).resolves.toBeUndefined();
      expect(readContract).toHaveBeenCalledTimes(1);
    });
  });

  // Config account of the sol manager, as laid out on mainnet with no
  // pending owner: mode at 106, custody at 128.
  describe('solana destination', () => {
    const custody = new PublicKey(
      '4Z2n3D6szuyPkg2uRbm6NwvjpXzKifKQ8HvxhykknyvF'
    );

    const configData = (mode: number) => {
      const data = new Uint8Array(160);
      let offset = 8 + 1 + 32 + 1 + 32 + 32;
      data[offset] = mode;
      offset += 1 + 2 + 1 + 1 + 16 + 1;
      data.set(custody.toBytes(), offset);
      return data;
    };

    const mockSolanaConfig = (mode: number) =>
      jest.spyOn(SolanaChain.prototype, 'connection', 'get').mockReturnValue({
        getAccountInfo: async () => ({ data: configData(mode) }),
        getTokenAccountBalance: async (account: PublicKey) => ({
          value: { amount: account.equals(custody) ? '7174284500550' : '0' },
        }),
      } as any);

    it('should read the custody account of a locking manager', async () => {
      mockSolanaConfig(0);
      await expect(nttClient(solana, sol).getCustody()).resolves.toBe(
        7_174_284_500_550n
      );
    });

    it('should not read custody of a burning manager', async () => {
      mockSolanaConfig(1);
      await expect(
        nttClient(solana, sol).getCustody()
      ).resolves.toBeUndefined();
    });
  });

  describe('sui destination', () => {
    const mockSui = (variant: string, balance: string) =>
      jest.spyOn(SuiChain.prototype, 'client', 'get').mockReturnValue({
        getObject: async () => ({
          data: {
            type: 'State',
            content: { fields: { mode: { variant }, balance } },
          },
        }),
      } as any);

    it('should read the state balance of a locking manager', async () => {
      mockSui('Locking', '15998416600490');
      await expect(nttClient(sui_chain, sui).getCustody()).resolves.toBe(
        15_998_416_600_490n
      );
    });

    it('should not read custody of a burning manager', async () => {
      mockSui('Burning', '15998416600490');
      await expect(
        nttClient(sui_chain, sui).getCustody()
      ).resolves.toBeUndefined();
    });
  });
  // The contract always locks - custody is its own token balance.
  describe('near destination', () => {
    it('should read the contract token balance', async () => {
      const view = jest.fn<any>().mockResolvedValue('500000000000000000000000');
      jest
        .spyOn(NearChain.prototype, 'client', 'get')
        .mockReturnValue({ view } as any);

      await expect(nttClient(near_testnet, wnear).getCustody()).resolves.toBe(
        500_000_000_000_000_000_000_000n
      );
      expect(view).toHaveBeenCalledWith('wrap.testnet', 'ft_balance_of', {
        account_id: 'ntt-near.whm-ntt-0bugdc.testnet',
      });
    });
  });
});

/**
 * Storage of the whm near-ntt testnet contract, as `view_state` served it:
 * 0.5 wNEAR sent to hydration against 100 wNEAR limits both ways.
 */
describe('nttClient near rate limits', () => {
  const STATE = Buffer.from(
    'FgAAAHdobS1udHQtMGJ1Z2RjLnRlc3RuZXQADAAAAHdyYXAudGVzdG5ldBgAAEhWNxk8w0MAAAAAAAAAGQAAAHdvcm1ob2xlLndvcm1ob2xlLnRlc3RuZXQBAAAAAAAAAAEAAAAAAAAA5NIMyNzSt1IAAAAAAAAAgBNcpuDO8U1SAAAAAAA4obVqAAAAAAEAAAABAQAAAAIBAAAAAwEAAAAE',
    'base64'
  );
  const INBOUND = Buffer.from(
    '000000e4d20cc8dcd2b7520000000000000000e4d20cc8dcd2b752000000000038a1b56a00000000',
    'hex'
  );

  const LIMIT = 100n * 10n ** 24n;
  const SENT = 5n * 10n ** 23n;
  const LAST_TX_MS = 1_790_288_184_000;

  const mockState = () => {
    const viewState = jest.fn(async (_contract: string, key: Uint8Array) => {
      const id = Buffer.from(key).toString('hex');
      if (id === Buffer.from('STATE').toString('hex')) {
        return [{ key, value: STATE }];
      }
      // StorageKey::Inbound, then chain 73 as u16 le.
      if (id === '014900') {
        return [{ key, value: INBOUND }];
      }
      return [];
    });
    jest
      .spyOn(NearChain.prototype, 'client', 'get')
      .mockReturnValue({ viewState } as any);
    return viewState;
  };

  afterEach(() => jest.restoreAllMocks());

  // Walks owner, paused, token, decimals, registration, core, seq & peers.
  it('should read the outbound limit out of the contract state', async () => {
    mockState();
    jest.spyOn(Date, 'now').mockReturnValue(LAST_TX_MS);

    await expect(
      nttClient(near_testnet, wnear).getOutboundLimit()
    ).resolves.toEqual({
      capacity: LIMIT - SENT,
      limit: LIMIT,
      windowMs: 24 * 60 * 60 * 1000,
      capacityAtLastTx: LIMIT - SENT,
      lastTxMs: LAST_TX_MS,
    });
  });

  // Linear over 24h - rate_limit::capacity.
  it('should refill the outbound capacity as the contract does', async () => {
    mockState();
    jest.spyOn(Date, 'now').mockReturnValue(LAST_TX_MS + 60 * 1000);

    const { capacity } = await nttClient(
      near_testnet,
      wnear
    ).getOutboundLimit();
    expect(capacity).toBe(LIMIT - SENT + (LIMIT * 60n) / 86_400n);
  });

  it('should cap the refilled capacity at the limit', async () => {
    mockState();
    jest.spyOn(Date, 'now').mockReturnValue(LAST_TX_MS + 60 * 60 * 1000);

    const { capacity } = await nttClient(
      near_testnet,
      wnear
    ).getOutboundLimit();
    expect(capacity).toBe(LIMIT);
  });

  it('should read the inbound limit of the source chain', async () => {
    const viewState = mockState();
    jest.spyOn(Date, 'now').mockReturnValue(LAST_TX_MS);

    const inbound = await nttClient(near_testnet, wnear).getInboundLimit(
      hydration
    );
    expect(inbound.limit).toBe(LIMIT);
    expect(inbound.capacity).toBe(LIMIT);
    expect(viewState).toHaveBeenCalledWith(
      'ntt-near.whm-ntt-0bugdc.testnet',
      Uint8Array.of(1, 73, 0)
    );
  });

  it('should not meter a chain the contract has no peer on', async () => {
    mockState();
    const inbound = await nttClient(near_testnet, wnear).getInboundLimit(
      ethereum
    );
    expect(inbound.windowMs).toBe(0);
  });
});
