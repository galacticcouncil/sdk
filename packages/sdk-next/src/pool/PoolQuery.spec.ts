import { NEVER } from 'rxjs';

import { SYSTEM_ASSET_ID } from '../consts';
import { EvmClient } from '../evm';
import { PoolQuery } from './PoolQuery';

const AT = '0x01';
const TOKEN_ID = 5;
const ERC20_ID = 222;
const UNREGISTERED_ID = 999;

class TestQuery extends PoolQuery {}

const account = (free: bigint) => ({
  free,
  reserved: 0n,
  frozen: 0n,
});

/**
 * A query over a fake chain that records every read it serves.
 *
 * - Native balances: `free = 1`, token balances `free = 2`, runtime `free = 3`
 */
function setup() {
  const calls = {
    system: [] as unknown[][],
    tokens: [] as unknown[][],
    runtime: [] as unknown[][],
  };

  const api = {
    query: {
      AssetRegistry: {
        Assets: {
          getEntries: async () => [
            { keyArgs: [TOKEN_ID], value: { asset_type: { type: 'Token' } } },
            { keyArgs: [ERC20_ID], value: { asset_type: { type: 'Erc20' } } },
          ],
        },
      },
      System: {
        Account: {
          getValues: async (keys: unknown[]) => {
            calls.system.push(keys);
            return keys.map(() => ({ data: account(1n) }));
          },
        },
      },
      Tokens: {
        Accounts: {
          getValues: async (keys: unknown[]) => {
            calls.tokens.push(keys);
            return keys.map(() => account(2n));
          },
        },
      },
    },
    apis: {
      CurrenciesApi: {
        account: async (id: number, who: string) => {
          calls.runtime.push([who, id]);
          return account(3n);
        },
      },
    },
  };

  const client = {
    getTypedApi: () => api,
    getUnsafeApi: () => ({
      query: { System: { Number: { watchValue: () => NEVER } } },
    }),
    finalizedBlock$: NEVER,
  };

  const query = new TestQuery(client as any, {} as EvmClient);
  const read = (who: string, id: number) =>
    query.assetBalance.get(AT, who, id).then((b) => b.free);
  return { calls, read };
}

describe('PoolQuery assetBalance', () => {
  it('reads each balance from the source that holds it', async () => {
    const { read } = setup();

    const values = await Promise.all([
      read('pool', SYSTEM_ASSET_ID),
      read('pool', TOKEN_ID),
      read('pool', ERC20_ID),
      read('pool', UNREGISTERED_ID),
    ]);

    expect(values).toEqual([1n, 2n, 3n, 3n]);
  });

  it('reads native and token balances issued together in one batch each', async () => {
    const { calls, read } = setup();

    await Promise.all([
      read('a', SYSTEM_ASSET_ID),
      read('b', SYSTEM_ASSET_ID),
      read('a', TOKEN_ID),
      read('b', TOKEN_ID),
    ]);

    expect(calls.system).toEqual([[['a'], ['b']]]);
    expect(calls.tokens).toEqual([
      [
        ['a', TOKEN_ID],
        ['b', TOKEN_ID],
      ],
    ]);
    expect(calls.runtime).toEqual([]);
  });

  it('reads an erc20 or unregistered asset through the runtime', async () => {
    const { calls, read } = setup();

    await Promise.all([read('pool', ERC20_ID), read('pool', UNREGISTERED_ID)]);

    expect(calls.runtime).toEqual([
      ['pool', ERC20_ID],
      ['pool', UNREGISTERED_ID],
    ]);
    expect(calls.tokens).toEqual([]);
  });
});
