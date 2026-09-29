import { SYSTEM_ASSET_ID } from '../consts';
import { AccountAsset } from '../types';
import { BalanceClient } from './BalanceClient';

const AT = '0x01';
const TOKEN_ID = 5;

/**
 * A chain holding free balances in storage, recording each multi-key read.
 *
 * - Native balances live in `System.Account`, tokens in `Tokens.Accounts`
 */
function chain() {
  const system = new Map([
    ['alice', 100n],
    ['pool', 3n],
  ]);
  const tokens = new Map([[`pool:${TOKEN_ID}`, 7n]]);
  const data = (free = 0n) => ({ free, reserved: 0n, frozen: 0n });
  const reads = { system: [] as string[][], tokens: [] as AccountAsset[][] };

  const api = {
    query: {
      System: {
        Account: {
          getValues: async (keys: [string][]) => {
            reads.system.push(keys.map(([who]) => who));
            return keys.map(([who]) => ({ data: data(system.get(who)) }));
          },
        },
      },
      Tokens: {
        Accounts: {
          getValues: async (keys: AccountAsset[]) => {
            reads.tokens.push(keys);
            return keys.map(([who, id]) => data(tokens.get(`${who}:${id}`)));
          },
        },
      },
    },
  };

  const client: BalanceClient = Object.assign(
    Object.create(BalanceClient.prototype),
    { api }
  );
  return { client, reads };
}

describe('BalanceClient getBalancesAt', () => {
  const accountAssets: AccountAsset[] = [
    ['alice', SYSTEM_ASSET_ID],
    ['pool', TOKEN_ID],
    ['pool', SYSTEM_ASSET_ID],
  ];

  it('returns balances in input order', async () => {
    const { client } = chain();

    const balances = await client.getBalancesAt(accountAssets, AT);

    expect(balances.map((b) => b.free)).toEqual([100n, 7n, 3n]);
  });

  it('reads native and token balances in one storage read each', async () => {
    const { client, reads } = chain();

    await client.getBalancesAt(accountAssets, AT);

    expect(reads.system).toEqual([['alice', 'pool']]);
    expect(reads.tokens).toEqual([[['pool', TOKEN_ID]]]);
  });

  it('makes no token read for a native-only list', async () => {
    const { client, reads } = chain();

    await client.getBalancesAt([['alice', SYSTEM_ASSET_ID]], AT);

    expect(reads.tokens).toEqual([]);
  });
});
