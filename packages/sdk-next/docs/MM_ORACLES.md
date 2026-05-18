# Hydration MM Oracle breakdown

All 7 `mmAddress`-es referenced from `Stableswap.PoolPegs` (kind = `MMOracle`),
cross-referenced against
[`galacticcouncil/aave-v3-deploy`](https://github.com/galacticcouncil/aave-v3-deploy)
on the `hydration` branch (`deployments/hydration/`).

## Summary

| Kind | Count | Update signal |
| --- | :-: | --- |
| **Managed** — Chainlink-compatible, pushed by a keeper | 3 | `PriceUpdated(uint80,int256,uint256)` event on the emitter |
| **DIA wrapper** — Chainlink-compatible facade over a DIA feed | 3 | `OracleUpdate(string,uint128,uint128)` event on the underlying DIA contract |
| **Hybrid aggregator** — composes Managed × substrate-asset price | 1 | None — derived; read `latestRoundData().updatedAt` directly |

## The 7 `mmAddress`-es

### 1. PRIME/USD — Managed

| Field | Value |
| --- | --- |
| `mmAddress` | `0xdee587cc569bf1fcbdcd6d1472031d225f34c307` |
| Pair | PRIME/USD |
| File | [`PRIMEoracle.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/PRIMEoracle.json) |
| Update signal | `PriceUpdated` event from this address |

### 2. jitoSOL/SOL — Managed

| Field | Value |
| --- | --- |
| `mmAddress` | `0x5b29bceacbd1c37fd4a2c32a052b63813ed0d4b8` |
| Pair | jitoSOL/SOL |
| File | [`jitoSOLOracle.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/jitoSOLOracle.json) |
| Update signal | `PriceUpdated` event from this address |

### 3. wstETH/ETH — Managed

| Field | Value |
| --- | --- |
| `mmAddress` | `0x11c1e47aaecdc47dba8b9b9419b05903e53f3b4f` |
| Pair | wstETH/ETH |
| File | [`wstETHOracle.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/wstETHOracle.json) |
| Update signal | `PriceUpdated` event from this address |

### 4. EUR/USD — DIA wrapper

| Field | Value |
| --- | --- |
| `mmAddress` | `0xaa47a5662269270d3df33ae08f806e383611575c` |
| Pair | EUR/USD |
| File | **not in `deployments/hydration/`** |
| Wraps | DIA oracle `0xbf727e7a9104844653e2d2661849236de0ab1787` (key `EUR/USD`) |
| Referenced by | [`2-POOL-HEURC-USDOracleAdapter.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/2-POOL-HEURC-USDOracleAdapter.json) `args[1]` |
| Update signal | `OracleUpdate(string,uint128,uint128)` on the DIA contract with `key == "EUR/USD"` |

### 5. sUSDe/USD — DIA wrapper

| Field | Value |
| --- | --- |
| `mmAddress` | `0x22cdea305cee63d082e79f8c5db939eecd0265d0` |
| Pair | sUSDe/USD |
| File | **not in `deployments/hydration/`** |
| Wraps | DIA oracle `0x48ae7803cd09c48434e3fc5629f15fb76f0b5ce5` (key `sUSDe/USD`) |
| Update signal | `OracleUpdate` on the DIA contract with `key == "sUSDe/USD"` |

### 6. sUSDs/USD — DIA wrapper

| Field | Value |
| --- | --- |
| `mmAddress` | `0x4b32bffc6acd751446e79e8687ef3815fd7924fd` |
| Pair | sUSDs/USD |
| File | **not in `deployments/hydration/`** |
| Wraps | DIA oracle `0x48ae7803cd09c48434e3fc5629f15fb76f0b5ce5` (key `sUSDs/USD`) |
| Update signal | `OracleUpdate` on the DIA contract with `key == "sUSDs/USD"` |

### 7. vDOT-Discount Hybrid — Hybrid aggregator

| Field | Value |
| --- | --- |
| `mmAddress` | `0xaafd758688cefd0a7b7770a825f1aad551e16185` |
| Role | composes `discount × baseAssetPrice` |
| File | [`vDOT-Discount-HybridOracleAggregator.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/vDOT-Discount-HybridOracleAggregator.json) |
| Constructor `args[0]` | `0xCfAB6a4031C70Da0F0cf6F31A252c16119DB3611` → [`vDOT-DiscountOracle.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/vDOT-DiscountOracle.json) (ManagedOracle, "vDOT discount") |
| Constructor `args[1]` | `0x00000100626966726f73746f000000050000000f` → Bifrost substrate AssetId (vDOT) |
| Update signal | **derived — emits nothing.** Three ways to detect: (a) watch `PriceUpdated` on the wrapped Managed discount feed `0xCfAB…3611`; (b) poll `latestRoundData()` on the hybrid; (c) watch substrate storage for the Bifrost asset. (a) misses base-price changes; (c) is the only way to catch them as events |

## Adjacent oracle inventory (not in pegs)

Additional Managed feeds present in `deployments/hydration/` but not currently
referenced by any `PoolPegs` entry:

| Address | Pair | File |
| --- | --- | --- |
| `0xe50AA7afa36A5E04C0b0D0892D0b173c924b662F` | SIGIL/USD | [`SIGILoracle.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/SIGILoracle.json) |
| `0xCfAB6a4031C70Da0F0cf6F31A252c16119DB3611` | vDOT discount factor | [`vDOT-DiscountOracle.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/vDOT-DiscountOracle.json) — feeds #7 |
| `0x82022F77ae239Ad99bB1F2aC0d8DaFF6Cc976a07` | PRIME/USD (MRL) | [`PRIMEoracleMRL.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/PRIMEoracleMRL.json) |
| `0x3928A0C729819B3999006D9fd0eB8e2562006384` | SOL/USD (MRL) | [`SOLoracleMRL.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/SOLoracleMRL.json) |
| `0x58469121FeD2F06183e7cF741a1219b6A20923eE` | jitoSOL/SOL (MRL) | [`jitoSOLoracleMRL.json`](https://github.com/galacticcouncil/aave-v3-deploy/blob/hydration/deployments/hydration/jitoSOLoracleMRL.json) |

Asset-to-X-to-USD adapters (not themselves MM oracles, but built on top of MM
addresses — included for completeness):

| Address | Role | File |
| --- | --- | --- |
| `0xea63e594ee00590938E856F2134E6C792bA92d13` | HDX → USD | `HDX-USDOracleAdapter.json` |
| `0xc94c414E8eBF7EA928D9bE555A8eAb719B89bBcE` | BNC → USD | `BNC-USDOracleAdapter.json` |
| `0x2fFa376E0a84606e4Ccb3738071312A34Cebad6C` | VDOT → USD | `VDOT-USDOracleAdapter.json` |
| `0xedbD21F476039C6019d2EC3e97f949af98a5c121` | GDOT → USD | `GDOT-USDOracleAdapter.json` |
| `0x32CC29cA6924B16077056A7B049663AF153D9E90` | 2-pool GETH/USD | `2-POOL-GETH-USDOracleAdapter.json` |
| `0xCD3648A48378cBDa915f6be0A30073b76593Ed9A` | 2-pool GSOL/USD | `2-POOL-GSOL-USDOracleAdapter.json` |
| `0x71691b7EE575a2842b242cE8E0AEcdB0e031B725` | 2-pool HEURC/USD | `2-POOL-HEURC-USDOracleAdapter.json` (uses #4 as `args[1]`) |
| `0xFbD6F083b9e8683fe62B21cF5849f362238610AF` | 3-pool / USD | `3-POOL-USDOracleAdapter.json` |
| `0xA317cEbdE7F948e132fDD177E5002A1DD2C2cB21` | wstETH/ETH aggregator | `WSTETH_ETH-OraclesAggregator.json` |