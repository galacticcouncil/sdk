import {
  ChainEcosystem as Ecosystem,
  EvmChain,
  EvmBalanceType,
} from '@galacticcouncil/xc-core';

import { hype, whype } from '../../assets';
import { hyperEvm as evmChain } from 'viem/chains';

/**
 * HyperEVM, Hyperliquid's evm.
 *
 * - Native HYPE and WHYPE, its wrapped erc20
 * - The ntt manager locks WHYPE: a native transfer wraps on the way in and
 *   unwraps on the way out
 */
export const hyperevm = new EvmChain({
  id: 999,
  key: 'hyperevm',
  name: 'HyperEVM',
  assetsData: [
    {
      asset: hype,
      decimals: 18,
      id: '0x5555555555555555555555555555555555555555',
    },
    {
      asset: whype,
      decimals: 18,
      id: '0x5555555555555555555555555555555555555555',
    },
  ],
  balance: EvmBalanceType.Erc20,
  balanceOverrides: {
    [hype.key]: EvmBalanceType.Native,
  },
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://hyperevmscan.io/',
  rpcs: ['https://rpc.hyperliquid.xyz/evm'],
  wormhole: {
    id: 47,
    coreBridge: '0x7C0faFc4384551f063e05aee704ab943b8B53aB3',
    executor: '0xd7717899cc4381033Bc200431286D0AC14265F78',
    nttExecutor: '0xBc275e094e031e990b060134AbbDa00132f9A163',
    // Locking manager - whype is escrowed here, minted on hydration.
    ntt: {
      // Native hype shares the whype deployment - the manager only ever
      // locks the erc20, so a native source is wrapped upfront
      // (ContractConfig.wrapNative). Registered first so a vaa emitted by
      // the shared transceiver resolves to hydration's key.
      [hype.key]: {
        token: '0x5555555555555555555555555555555555555555',
        manager: '0xdcDd08BFB7b3B9381149A852Ba5F69Bd5d87676f',
        transceiver: {
          wormhole: '0xe3eD8E1217AB419123D54E2F0850BC736b595D68',
        },
      },
      [whype.key]: {
        token: '0x5555555555555555555555555555555555555555',
        manager: '0xdcDd08BFB7b3B9381149A852Ba5F69Bd5d87676f',
        transceiver: {
          wormhole: '0xe3eD8E1217AB419123D54E2F0850BC736b595D68',
        },
      },
    },
  },
});
