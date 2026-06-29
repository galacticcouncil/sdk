# Chain-native Balance Reads

A chain reads its own balances. Any asset's balance, minimum and existential
deposit can be read directly from a chain — no `Wallet`, `ConfigService`,
route or `PlatformAdapter`:

```ts
import { chainsMap } from '@galacticcouncil/xc-cfg';

const hydration = chainsMap.get('hydration')!;
const amount = await hydration.getBalance(usdc, address); // AssetAmount
```

This makes a chain a reusable read surface (e.g. for `xc-swap` or UIs) and lets
a new chain be added by **declaring data only**, with no transfer-oriented
platform coding.

## Declarative model

A chain declares *how* each asset's balance is stored, using the storage-type
enum for its platform. There is one enum per platform and `BalanceType` is their
union:

| Platform | Enum | Members |
|---|---|---|
| Substrate | `SubstrateBalanceType` | `System`, `Tokens`, `OrmlTokens`, `Assets`, `ForeignAssets` |
| EVM | `EvmBalanceType` | `Native`, `Erc20` |
| Solana | `SolanaBalanceType` | `Native`, `Token` |
| Sui | `SuiBalanceType` | `Native` |

Chains register a default type plus per-asset overrides:

```ts
new Parachain({
  balance: SubstrateBalanceType.Assets,            // default
  balanceOverrides: {                              // per-asset outliers
    [dot.key]: SubstrateBalanceType.System,
    [ksm.key]: SubstrateBalanceType.ForeignAssets,
  },
  min: SubstrateMinType.Assets,                    // dynamic on-chain min (optional)
  ...
});
```

`getBalanceType(asset)` resolves the override or the default. The substrate
dynamic minimum is declared the same way via `SubstrateMinType`; chains without
one fall back to the static `assetsData[*].min`.

### Per-platform typing

Each concrete chain binds its own enum, so a chain can only declare storage
types its client supports (`new SuiChain({ balance: EvmBalanceType.Erc20 })` is
a compile error):

- `EvmChain` → `EvmBalanceType`, `SolanaChain` → `SolanaBalanceType`,
  `SuiChain` → `SuiBalanceType`.
- `Parachain` → `SubstrateBalanceType` (a `NoInfer` guard keeps `new Parachain`
  from accepting non-substrate types).
- `EvmParachain extends Parachain<SubstrateBalanceType | EvmBalanceType>` — the
  one chain that reads from two clients (e.g. Moonbeam: GLMR from `System`,
  ERC20 tokens from the EVM client). It remains substitutable for `Parachain`;
  slots that legitimately accept either kind are typed `AnyParachain`.

## Reading

Each chain owns a per-platform balance client under
[`xc-core/src/chain/balance`](../../xc-core/src/chain/balance) (`substrate.ts`,
`evm.ts`, `solana.ts`, `sui.ts`) and implements the read API polymorphically:

```ts
chain.getBalance(asset, address): Promise<AssetAmount>
chain.subscribeBalance(asset, address): Observable<AssetAmount>
chain.subscribeBalances(assets, address): Observable<AssetAmount[]>  // merged stream
```

The substrate client maps a `SubstrateBalanceType` to a storage **entry**
(`{ module, func, args, extract }`) and runs it through one papi query path;
`minEntry` does the same for `SubstrateMinType`. It also reads the existential
deposit. `Parachain` surfaces these as `getMin(asset)` and `getEd()`.
`EvmParachain` overrides `getBalance`/`subscribeBalance` to route EVM storage
types to its EVM client and substrate types to the substrate client.

`subscribeBalances` merges the per-asset streams (`combineLatest`), so
multi-token — and, by merging chains, multi-chain — feeds compose from plain
observables:

```ts
combineLatest([
  hydration.subscribeBalances(hydrationAssets, addr),
  assethub.subscribeBalances(hubAssets, addr),
]).pipe(map((sets) => sets.flat()));
```

`rxjs` is an `xc-core` peer dependency.

## xc-sdk

The platform layer no longer reads balances — `getBalance`/`subscribeBalance`
are gone from the `Platform` interface, `PlatformAdapter` and every `*Platform`,
and the `platforms/*/balance` factories are deleted. `Platform` classes keep
only transfer concerns (`buildCall`, `estimateFee`).

`DataProcessor` is the shared base for both `DataOriginProcessor` and
`DataDestinationProcessor`: it resolves `(chain, asset)` → balance / min / ed
straight off the chain (the origin sources `(chain, asset)` from its
`TransferConfig`, the destination receives them directly, which is what lets
one-way routes resolve destination data without a reverse config).
`Wallet.subscribeBalance` delegates to `chain.subscribeBalances`.

## Adding a chain

Declare `balance` (+ `balanceOverrides`, and `min` for an AssetHub-style dynamic
minimum) on the chain definition in `xc-cfg`. No platform/transfer code is
required to read balances.
