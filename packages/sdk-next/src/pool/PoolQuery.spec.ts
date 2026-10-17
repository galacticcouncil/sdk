import { SYSTEM_ASSET_ID } from '../consts';
import { AccountAsset } from '../types';
import { PoolQuery } from './PoolQuery';

const AT = '0x01';
const TOKEN_ID = 5;
const ERC20_ID = 222;
const UNREGISTERED_ID = 999;

/**
 * A query whose balance reads name the source that served them.
 *
 * - Storage reads come back as `storage:account:id`, runtime calls as
 *   `runtime:account:id`
 */
function setup() {
  const calls = {
    storage: [] as AccountAsset[][],
    runtime: [] as AccountAsset[],
  };
  const registry = new Map(
    [
      [TOKEN_ID, 'Token'],
      [ERC20_ID, 'Erc20'],
    ].map(([id, type]) => [id, { asset_type: { type } }])
  );

  const query: PoolQuery = Object.assign(Object.create(PoolQuery.prototype), {
    assets: { get: async () => registry },
    balance: {
      getBalancesAt: async (list: AccountAsset[]) => {
        calls.storage.push(list);
        return list.map(([who, id]) => `storage:${who}:${id}`);
      },
      getBalanceAt: async (who: string, id: number) => {
        calls.runtime.push([who, id]);
        return `runtime:${who}:${id}`;
      },
    },
  });

  const read = (list: AccountAsset[]) => query['readBalances'](AT, list);
  return { calls, read };
}

describe('PoolQuery readBalances', () => {
  const accountAssets: AccountAsset[] = [
    ['pool', ERC20_ID],
    ['pool', SYSTEM_ASSET_ID],
    ['pool', TOKEN_ID],
    ['pool', UNREGISTERED_ID],
  ];

  it('returns balances in input order across both sources', async () => {
    const { read } = setup();

    const values = await read(accountAssets);

    expect(values).toEqual([
      `runtime:pool:${ERC20_ID}`,
      `storage:pool:${SYSTEM_ASSET_ID}`,
      `storage:pool:${TOKEN_ID}`,
      `runtime:pool:${UNREGISTERED_ID}`,
    ]);
  });

  it('reads native and token balances in one storage batch', async () => {
    const { calls, read } = setup();

    await read(accountAssets);

    expect(calls.storage).toEqual([
      [
        ['pool', SYSTEM_ASSET_ID],
        ['pool', TOKEN_ID],
      ],
    ]);
  });

  it('reads an erc20 or unregistered asset through the runtime', async () => {
    const { calls, read } = setup();

    await read(accountAssets);

    expect(calls.runtime).toEqual([
      ['pool', ERC20_ID],
      ['pool', UNREGISTERED_ID],
    ]);
  });
});
