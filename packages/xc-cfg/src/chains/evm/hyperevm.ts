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
 * - No ntt legs yet: registered ahead of the HYPE deployment
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
  },
});
