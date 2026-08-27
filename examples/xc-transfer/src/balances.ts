import { xc } from './setup';

const { wallet } = xc;

const CHAINS = [
  'hydration',
  'bifrost',
  'assethub',
  'ethereum',
  'base',
  'solana',
  'sui',
];

const ADDRESSES = [
  '135yiujiLFfogvTwbfr3yoqGK7zAu3f5SD5y1q8PMokYeSuc', // substrate address
  '0x72D405a0EC9bc7FD73b9ceA9fb514601f344681f', // evm address
  'GiaSoAk1jEbMr5jEYxXbQKYhWFY7TmxvepcM5DDmuVRH', // solana address
  '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf', // sui address
];

for (const address of ADDRESSES) {
  const eligible = wallet
    .getChainsForAddress(address, CHAINS)
    .map((c) => c.key);
  console.log(`${address} is eligible on: ${eligible.join(', ')}`);

  const chainBalances = await wallet.getAllBalances(address, CHAINS);

  const rows = chainBalances.flatMap(({ chainKey, balances, error }) => {
    if (error) {
      return [{ chain: chainKey, symbol: '-', amount: error.message }];
    }
    return balances
      .filter((b) => b.amount > 0n)
      .map((b) => ({
        chain: chainKey,
        symbol: b.originSymbol,
        amount: b.toDecimal(),
        decimals: b.decimals,
      }));
  });

  console.table(rows);
}
