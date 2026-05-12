---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
---

Add Across-Snowbridge route: bridge ERC20 / ETH from Across-supported L2s (Base, Arbitrum, Optimism) to Hydration via Snowfork's SnowbridgeL2Adaptor.

- `xc-core`: new `Across` bridge primitive, `SnowbridgeL2Adaptor` / `SnowbridgeL1Adaptor` ABIs, `UniswapV3Quoter` / `UniswapV3SwapRouter` ABIs, Across attached to Ethereum/Base/Arbitrum/Optimism chain configs (with Snowfork's deployed mainnet adaptors); Arbitrum and Optimism added as EVM chains.
- `xc-cfg`: `Tag.Across_Snowbridge`, `ContractBuilder.Across.Snowbridge.{sendTokenAndCall, sendEtherAndCall}` builders producing real SCALE-encoded XCM via the native Snowbridge V2 helpers, Uniswap V3 `exactOutputSingle` swap calldata for the ERC20 path, dynamic Across `/suggested-fees` lookup at build time, and `FeeAmountBuilder.AcrossSnowbridge.calculateFee` composing Snowbridge inbound fees + Uniswap V3 Quoter. Two routes wired: Base USDC → Hydration and Base ETH → Hydration.
