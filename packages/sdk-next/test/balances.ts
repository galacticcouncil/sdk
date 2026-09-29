import { AccountAsset, Balance } from '../src/types';

/**
 * A fake `assetBalance` scope serving transferable balances by key.
 *
 * - Each `getMany` call is recorded
 * - Reading a key without a balance throws, so a misaddressed read fails loudly
 *
 * @param balances - transferable balance by `account:assetId`
 */
export function fakeAssetBalance(balances: Record<string, bigint>) {
  const reads: AccountAsset[][] = [];

  const getMany = async (_at: string, keys: AccountAsset[]) => {
    reads.push(keys);
    return keys.map(([who, id]) => {
      const transferable = balances[`${who}:${id}`];
      if (transferable === undefined) {
        throw new Error(`no balance for ${who}:${id}`);
      }
      return { transferable } as Balance;
    });
  };

  return { assetBalance: { getMany }, reads };
}
