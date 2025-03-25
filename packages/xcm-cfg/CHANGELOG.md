# @galacticcouncil/xcm-cfg

## 8.0.0

### Major Changes

- ee2fd63: Xcm builder instructions (fee est)
- 0beee5c: Set topics for erc20/native snowbridge outbound transfers
- 11b8565: Dynamic snowbridge fee estimations
- d6084e7: Native eth transfer config (Hydration <-> Ethereum)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@7.0.0

## 7.10.0

### Minor Changes

- 331ac1f: Update bifrost RPC list

## 7.9.0

### Minor Changes

- Support getQuote fallback price for hydration DEX
- Add native ETH token config

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.6.0

## 7.8.0

### Minor Changes

- 460bcdd: Integrate Energy Web X parachain

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.4.0

## 7.7.0

### Minor Changes

- 3e4ae6b: Add LAOS parachain

## 7.6.2

### Patch Changes

- Bump mythos fees

## 7.6.1

### Patch Changes

- 80e5e70: Upgrade solana rpc's

## 7.6.0

### Minor Changes

- Use most liquid route in hydration DEX to prevent fee swaps in low liquid pools

### Patch Changes

- Updated dependencies
  - @galacticcouncil/sdk@5.6.0

## 7.5.2

### Patch Changes

- Remove temp XYK from DEX hydration routing

## 7.5.1

### Patch Changes

- Bump kusama ecosystem fees

## 7.5.0

### Minor Changes

- Support hydration dex XYK routing
- Update KSM min deposit on pah

## 7.4.1

### Patch Changes

- Fix ah -> hydration KSM dest fee

## 7.4.0

### Minor Changes

- Add pah <-> hydration KSM transfer
- Add pah <-> kah KSM transfer
- Support polkadotXcm.transferAssets

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.3.0

## 7.3.2

### Patch Changes

- cccd9cd: Remove snowbridge weth config

## 7.3.1

### Patch Changes

- Bump sdk & core dependecies

## 7.3.0

### Minor Changes

- 2da6a6b: Add solana <-> moonbeam SOL transfer
- 2da6a6b: Add ethereum <-> hydration tBTC transfer

## 7.2.0

### Minor Changes

- Use transfer multiasset for hydration assethub sufficient assets (cex)

## 7.1.2

### Patch Changes

- Fix mda account gen if dest relay
- Updated dependencies
  - @galacticcouncil/xcm-core@6.1.1

## 7.1.1

### Patch Changes

- Fix xTokens.transferMulticurrencies mda derivative acc

## 7.1.0

### Minor Changes

- CEX configurations for hub & relay

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.1.0

## 7.0.0

### Major Changes

- Peer deps to @galacticcouncil/sdk (router)

- Add chain swaps
- Add solana chain & route configs
- Move external asset config to HydrationConfigService

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.0.0

## 6.0.1

### Patch Changes

- Bump hyddration -> hub DOT destination fee

## 6.0.0

### Major Changes

- Add missing asset xcm locations
- Switch extrinsic builders to use multilocation
- Add dynamic v4 location support

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.5.0

## 5.7.1

### Patch Changes

- be231d1: Fix dest fee for bifrost & astar

## 5.7.0

### Minor Changes

- Enable hydration <-> ethereum WETH (snowbridge)

- Add astar <-> hydration BNC
- Add astar <-> hydration GLMR
- Add astar <-> hydration iBTC
- Add astar <-> hydration INTR
- Add astar <-> hydration PHA
- Add astar <-> hydration vDOT
- Add astar <-> hydration vASTR
- Add bifrost <-> hydration BNC
- Add bifrost <-> hydration GLMR
- Add bifrost <-> hydration iBTC
- Add centrifuge <-> hydration DOT
- Add centrifuge <-> hydration GLMR
- Add interlay <-> hydration vDOT

- Add moonbeam & hub xcm locations

## 5.6.0

### Minor Changes

- Bump hub -> moonbeam fees
- Bump hydration -> moonbeam hdx fee
- Normalize hub x1 interior

## 5.5.1

### Patch Changes

- Fix snowbridge dest fee balance config

## 5.5.0

### Minor Changes

- 9319ac9: Add AAVE & sUSDe snowbridge support

### Patch Changes

- Updated dependencies [c879417]
  - @galacticcouncil/xcm-core@5.4.0

## 5.4.2

### Patch Changes

- 84ef243: Fix assethub foreign balance location (v3 -> v4)
- Updated dependencies
  - @galacticcouncil/xcm-core@5.3.1

## 5.4.1

### Patch Changes

- Fix zeitgeist
- Bump Hub -> Moonbeam DOT fees

## 5.4.0

### Minor Changes

- Custom ethereum rpcs (fallback)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.3.0

## 5.3.2

### Patch Changes

- Disable snowbridge until tags ready

## 5.3.1

### Patch Changes

- Fix mrl validation

## 5.3.0

### Minor Changes

- Add Snowbridge WETH transfer
- Add Snowbridge fee builders

### Patch Changes

- Fix hydration balance config
- Updated dependencies
  - @galacticcouncil/xcm-core@5.2.0

## 5.2.0

### Minor Changes

- Snowbridge config & builders
- ExtrinsicBuilderv4 support (transferAssetsUsingTypeAndThen) plus xcmLocations
- Add Assethub <-> Mythos Myth transfer

## 5.1.1

### Patch Changes

- Fix Astar -> Hydration DOT transfer balance cfg

## 5.1.0

### Minor Changes

- Add Assethub <-> Hydration DOT transfer (new DOT reserve)

## 5.0.1

### Patch Changes

- Fix hub frozen validation

## 5.0.0

### Major Changes

- New config/route setup, HydrationConfigService

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.0.0

## 4.1.2

### Patch Changes

- Fix hydration <-> zeitgeist glmr transfer (no need for multicurrencies)

## 4.1.1

### Patch Changes

- Fix mda account fn
- Fix hub ed validation

## 4.1.0

### Minor Changes

- Customizable xcm swap slippage

## 4.0.1

### Patch Changes

- Fix ethereum dest fee config (free redeem)

## 4.0.0

### Major Changes

- Support xchain swaps
- Support transfer validations

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@4.0.0

## 3.5.1

### Patch Changes

- Bump gasLimit & mrl fees (tmp) to fix ethereum transfer

## 3.5.0

### Minor Changes

- 58343be: Added WUD static XCM config

### Patch Changes

- Fix WUD configuration (sufficient asset)

## 3.4.3

### Patch Changes

- Fix moonbeam weth transfer

## 3.4.2

### Patch Changes

- Bump moonbeam dest fees & ethereum transact gasLimit

## 3.4.1

### Patch Changes

- Fix moonbeam dest fee

## 3.4.0

### Minor Changes

- Bump core deps (cjs support)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@3.0.0

## 3.3.0

### Minor Changes

- Fill missing minimal deposits for polkadot eco

## 3.2.1

### Patch Changes

- Remove NCTR static config

## 3.2.0

### Minor Changes

- Configure Parachain explorers
- Suport NCTR asset

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@2.2.0

## 3.1.1

### Patch Changes

- Fix myth fees

## 3.1.0

### Minor Changes

- Mythos & vASTR support
- Upgrade to latest core

## 3.0.1

### Patch Changes

- Add multiple hydration & zeitgeist endpoints

## 3.0.0

### Major Changes

- Upgrage pjs to 12.x

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@2.0.0

## 2.8.1

### Patch Changes

- Use ACA fee for lDOT

## 2.8.0

### Minor Changes

- Upgrade xcm-core deps

## 2.7.0

### Minor Changes

- Darwinia is EVM, vDOT decimals fix

## 2.6.1

### Patch Changes

- Fix general index ordering for x.transferAssets extrinsic

## 2.6.0

### Minor Changes

- External config, templates, viem upgrade

## 2.5.1

### Patch Changes

- Ring support

## 2.5.0

### Minor Changes

- Change HydraDX to Hydration

## 2.4.0

### Minor Changes

- Upgrade core deps

## 2.3.0

### Minor Changes

- Upgrade core, fix comp errors

## 2.2.0

### Minor Changes

- Upgrade xcm-core deps

## 2.1.1

### Patch Changes

- Fix dst fee decimals (norm asset)

## 2.1.0

### Minor Changes

- Add WBTC/USDC/USDT Ethereum <-> HydraDX transfers

## 2.0.3

### Patch Changes

- Adjust AssetHub USDT destination fee to 0.07

## 2.0.2

### Patch Changes

- H160 pnly for acala evm

## 2.0.1

### Patch Changes

- Temp acala evm chain

## 2.0.0

### Major Changes

- Introducing MRL & Wormhole support (refactoring)

- Updated dependencies
  - @galacticcouncil/xcm-core@1.0.0

## 1.11.8

### Patch Changes

- Enable pendulum, fixed imports

## 1.11.7

### Patch Changes

- Suspend pendulum

## 1.11.6

### Patch Changes

- KILT & PEN config

## 1.11.5

### Patch Changes

- Update Nodle RPC (fix)

## 1.11.4

### Patch Changes

- Update Nodle RPC

## 1.11.3

### Patch Changes

- Fix DOTA hydradx decimals

## 1.11.2

### Patch Changes

- Add DOTA support

## 1.11.1

### Patch Changes

- Fix hdx to interlay balance

## 1.11.0

### Minor Changes

- Bundle size down (polkadeps as external)

## 1.10.14

### Patch Changes

- Bump PINK/DED fees to avoid trapping if no acc

## 1.10.13

### Patch Changes

- Enable DED

## 1.10.12

### Patch Changes

- Add PINK, USDT & USDC to AH<>Bifrost #36

## 1.10.11

### Patch Changes

- USDC/USDT Moonbeam <-> AH

## 1.10.10

### Patch Changes

- Disable DED transfer

## 1.10.9

### Patch Changes

- Pink Moonbeam <-> AH support

## 1.10.8

### Patch Changes

- Fix pink balance ids

## 1.10.7

### Patch Changes

- Memecoins goes xchain

## 1.10.6

### Patch Changes

- Multiple transfer assets support

## 1.10.5

### Patch Changes

- Assethub XCM delivery fees

## 1.10.4

### Patch Changes

- Fix integritee imports

## 1.10.3

### Patch Changes

- TEER (Integritee) support

## 1.10.2

### Patch Changes

- Temp disable Basilisk <-> Karura (KSM) transfer

## 1.10.1

### Patch Changes

- Integritee chain config

## 1.10.0

### Minor Changes

- Kusama xcm configs support

## 1.9.0

### Minor Changes

- Set xcm delivery fees for relay DOT transfers

## 1.8.2

### Patch Changes

- Fix DOT fee to 0.1

## 1.8.1

### Patch Changes

- Fix DOT fees

## 1.8.0

### Minor Changes

- Added CRU support (temp disable AH transfers)

## 1.7.0

### Minor Changes

- Support orml tokens balance

## 1.6.1

### Patch Changes

- Fee USDT/DOT transfer fixes

## 1.6.0

### Minor Changes

- Support USDT & DOT in major liquidity routes

## 1.5.0

### Minor Changes

- Zeitgeist usesChainDecimals flag, fix usdc_mwh decimals

## 1.4.1

### Patch Changes

- Zeitgeist chain decimals for all assets

## 1.4.0

### Minor Changes

- Zeitgeist USDC support (market)

## 1.3.0

### Minor Changes

- Upgrade of base moonbeams xcm packages

## 1.2.2

### Patch Changes

- Add DOT for Polkadot<->Bifrost

## 1.2.1

### Patch Changes

- Added DOT for Bifrost<->HydraDX

## 1.2.0

### Minor Changes

- unique support
- nodle support

## 1.1.1

### Patch Changes

- Fix bifrost to hydradx xcm, extrinsic account support

## 1.1.0

### Minor Changes

- phala added

## 1.0.11

### Patch Changes

- bnc as fee payment asset

## 1.0.10

### Patch Changes

- subsocial transfer fixed

## 1.0.9

### Patch Changes

- vDOT decimals corrected

## 1.0.8

### Patch Changes

- fix hydradx -> polkadot xtokens

## 1.0.7

### Patch Changes

- support moonbeam wh usdt & usdc

## 1.0.6

### Patch Changes

- move evm config to sdk

## 1.0.5

### Patch Changes

- drop acala aca config

## 1.0.4

### Patch Changes

- acala aca config

## 1.0.3

### Patch Changes

- Fix interlay iBTC config

## 1.0.2

### Patch Changes

- Revisited chains configs

## 1.0.1

### Patch Changes

- Fix polkadot & subsocial configs, hydra evm mainnet config

## 1.0.0

- Initial xcm cfg release

## 0.0.5

### Patch Changes

- Added subsocial

## 0.0.4

### Patch Changes

- Fix decimals, missing configurations

## 0.0.3

### Patch Changes

- Fix wormhole asset keys

## 0.0.2

### Patch Changes

- Fix missing acala configs
