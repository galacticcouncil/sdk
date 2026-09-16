import { AccountAsset } from '../types';
import { BalanceClient } from './BalanceClient';

type Data = { free: bigint; reserved: bigint; frozen: bigint };

const AT = '0x01';
const ZERO: Data = { free: 0n, reserved: 0n, frozen: 0n };
const TOKEN_ID = 5;

/**
 * A chain that answers `CurrenciesApi.account` by the runtime's rules.
 *
 * - Native reads `System.Account`, any other asset `Tokens.Accounts`
 * - A missing entry reads as zero
 */
function chain() {
  const system = new Map<string, Data>([
    ['alice', { free: 100n, reserved: 10n, frozen: 30n }],
  ]);
  const tokens = new Map<string, Data>([
    [`alice:${TOKEN_ID}`, { free: 50n, reserved: 20n, frozen: 5n }],
    [`pool:${TOKEN_ID}`, { free: 7n, reserved: 0n, frozen: 9n }],
  ]);
  const calls = { runtime: 0, system: 0, tokens: 0 };

  const api = {
    apis: {
      CurrenciesApi: {
        account: async (id: number, who: string) => {
          calls.runtime++;
          return id === 0
            ? (system.get(who) ?? ZERO)
            : (tokens.get(`${who}:${id}`) ?? ZERO);
        },
      },
    },
    query: {
      System: {
        Account: {
          getValues: async (keys: [string][]) => {
            calls.system++;
            return keys.map(([who]) => ({ data: system.get(who) ?? ZERO }));
          },
        },
      },
      Tokens: {
        Accounts: {
          getValues: async (keys: AccountAsset[]) => {
            calls.tokens++;
            return keys.map(([who, id]) => tokens.get(`${who}:${id}`) ?? ZERO);
          },
        },
      },
    },
  };

  const client: BalanceClient = Object.assign(
    Object.create(BalanceClient.prototype),
    { api }
  );
  return { client, calls };
}

describe('BalanceClient getBalancesAt', () => {
  const accountAssets: AccountAsset[] = [
    ['alice', 0],
    ['pool', TOKEN_ID],
    ['nobody', 0],
    ['alice', TOKEN_ID],
    ['alice', 10],
    ['pool', 0],
  ];

  it('returns what getBalanceAt returns, in input order', async () => {
    const { client } = chain();

    const batched = await client.getBalancesAt(accountAssets, AT);
    const single = await Promise.all(
      accountAssets.map(([who, id]) => client.getBalanceAt(who, id, AT))
    );

    expect(batched).toEqual(single);
  });

  it('reads native and token balances in one storage read each', async () => {
    const { client, calls } = chain();

    await client.getBalancesAt(accountAssets, AT);

    expect(calls).toEqual({ runtime: 0, system: 1, tokens: 1 });
  });

  it('skips the reads a set does not need', async () => {
    const { client, calls } = chain();

    await client.getBalancesAt([['alice', 0]], AT);

    expect(calls).toEqual({ runtime: 0, system: 1, tokens: 0 });
  });
});
