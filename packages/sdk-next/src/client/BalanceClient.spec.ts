import { BalanceClient } from './BalanceClient';

type Data = { free: bigint; reserved: bigint; frozen: bigint };

const AT = '0x01';
const ZERO: Data = { free: 0n, reserved: 0n, frozen: 0n };
const TOKEN_ID = 5;
const ERC20_ID = 222;
const ERC20_EVM_FREE = 777n;

/**
 * A chain that answers `CurrenciesApi.account` by the runtime's rules.
 *
 * - Native reads `System.Account`, any other asset `Tokens.Accounts`
 * - An Erc20 asset's free balance comes from the EVM, not from storage
 * - A missing entry reads as zero
 */
function chain() {
  const system = new Map<string, Data>([
    ['alice', { free: 100n, reserved: 10n, frozen: 30n }],
  ]);
  const tokens = new Map<string, Data>([
    [`alice:${TOKEN_ID}`, { free: 50n, reserved: 20n, frozen: 5n }],
    [`pool:${TOKEN_ID}`, { free: 7n, reserved: 0n, frozen: 9n }],
    [`pool:${ERC20_ID}`, { free: 1n, reserved: 2n, frozen: 3n }],
  ]);
  const types = new Map<number, string>([
    [TOKEN_ID, 'Token'],
    [ERC20_ID, 'Erc20'],
  ]);
  const calls = { runtime: 0, registry: 0, system: 0, tokens: 0 };

  const api = {
    apis: {
      CurrenciesApi: {
        account: async (id: number, who: string) => {
          calls.runtime++;
          if (id === 0) return system.get(who) ?? ZERO;
          const data = tokens.get(`${who}:${id}`) ?? ZERO;
          return types.get(id) === 'Erc20'
            ? { ...data, free: ERC20_EVM_FREE }
            : data;
        },
      },
    },
    query: {
      AssetRegistry: {
        Assets: {
          getValues: async (keys: [number][]) => {
            calls.registry++;
            return keys.map(([id]) =>
              types.has(id)
                ? { asset_type: { type: types.get(id) } }
                : undefined
            );
          },
        },
      },
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
          getValues: async (keys: [string, number][]) => {
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
  const pairs: [string, number][] = [
    ['pool', ERC20_ID],
    ['alice', 0],
    ['pool', TOKEN_ID],
    ['nobody', 0],
    ['alice', TOKEN_ID],
    ['alice', 10],
    ['pool', 0],
  ];

  it('returns what getBalanceAt returns, pair by pair', async () => {
    const { client } = chain();

    const batched = await client.getBalancesAt(pairs, AT);
    const single = await Promise.all(
      pairs.map(([who, id]) => client.getBalanceAt(who, id, AT))
    );

    expect(batched).toEqual(single);
  });

  it('keeps the free balance the EVM reports for an erc20', async () => {
    const { client } = chain();

    const [balance] = await client.getBalancesAt([['pool', ERC20_ID]], AT);

    expect(balance.free).toBe(ERC20_EVM_FREE);
  });

  it('reads native and token balances in one storage read each', async () => {
    const { client, calls } = chain();

    await client.getBalancesAt(pairs, AT);

    expect(calls).toEqual({ runtime: 1, registry: 1, system: 1, tokens: 1 });
  });

  it('skips the reads a set does not need', async () => {
    const { client, calls } = chain();

    await client.getBalancesAt([['alice', 0]], AT);

    expect(calls).toEqual({ runtime: 0, registry: 0, system: 1, tokens: 0 });
  });
});
