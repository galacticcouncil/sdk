import { Balance } from 'types';

export class MultiCurrencyContainer {
  result = new Map<string, bigint>();

  getKey(asset: number, accountId: string): string {
    return [accountId, asset.toString()].join(',');
  }

  constructor(keys: [string, number][], values: Balance[]) {
    for (let i = 0; i < keys.length; ++i) {
      const [accountId, asset] = keys[i];
      this.result.set(this.getKey(asset, accountId), values[i].free);
    }
  }

  freeBalance(asset: number, accountId: string): bigint {
    // TODO: use existential amounts as a placeholder
    const result = this.result.get(this.getKey(asset, accountId)) ?? 0n;
    return result;
  }

  transfer(
    asset: number,
    sourceAccount: string,
    targetAccount: string,
    amount: bigint
  ) {
    const sourceKey = this.getKey(asset, sourceAccount);
    const targetKey = this.getKey(asset, targetAccount);

    const sourceValue = this.result.get(sourceKey) ?? 0n;
    const targetValue = this.result.get(targetKey) ?? 0n;

    if (sourceValue < amount)
      throw new Error('Attempting to transfer more than is present');

    this.result.set(sourceKey, sourceValue + amount);
    this.result.set(targetKey, targetValue + amount);
  }
}
