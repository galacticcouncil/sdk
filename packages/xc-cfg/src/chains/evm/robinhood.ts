import {
  ChainEcosystem as Ecosystem,
  EvmChain,
  EvmBalanceType,
} from '@galacticcouncil/xc-core';

import { eth, hdx, hollar, weth } from '../../assets';
import { robinhood as evmChain } from 'viem/chains';

export const robinhood = new EvmChain({
  id: 4663,
  key: 'robinhood',
  name: 'Robinhood',
  assetsData: [
    {
      asset: eth,
      decimals: 18,
      id: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
    },
    {
      asset: weth,
      decimals: 18,
      id: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
    },
    {
      asset: hdx,
      decimals: 12,
      id: '0xb423C0B59C615793b0903668dc414e4fA3A64A33',
    },
    {
      asset: hollar,
      decimals: 18,
      id: '0xD1dc3517732c98502b5c1ba2389AcA9E9016d89a',
    },
  ],
  balance: EvmBalanceType.Erc20,
  balanceOverrides: {
    [eth.key]: EvmBalanceType.Native,
  },
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://robinhoodchain.blockscout.com/',
  rpcs: ['https://rpc.mainnet.chain.robinhood.com'],
  wormhole: {
    id: 72,
    coreBridge: '0x141fBa8AD5D61bdaB45A047cF60b5Ad9784987FB',
    executor: '0xd19aAd5a69F7D35Cee169D9D90e1BbCB795ABB38',
    nttExecutor: '0x0AdA5f1289Ee5EC07e397Ee86dB6bc861ce0A728',
    ntt: {
      // Burning managers - hydration is the hub.
      [hdx.key]: {
        token: '0xb423C0B59C615793b0903668dc414e4fA3A64A33',
        manager: '0xf1a5fE4252D9a1C39b0Fb9DE1F19049ee57ED188',
        transceiver: {
          wormhole: '0x97Cd0d08c376005d09afcC47fa9ce0C384fbA406',
        },
      },
      [hollar.key]: {
        token: '0xD1dc3517732c98502b5c1ba2389AcA9E9016d89a',
        manager: '0xE58D508743DD36368946D5A72A7dcD7cE960cE12',
        transceiver: {
          wormhole: '0x27afd50e83379a53458446E9d5F4a557B5f55c19',
        },
      },
      [weth.key]: {
        token: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
        manager: '0xB1A2ABCbC1FA276212f6eD239645161DeeA9861a',
        transceiver: {
          wormhole: '0x1352881a04cb9f9f5fB8442bc925e99EC15D3642',
        },
      },
      [eth.key]: {
        token: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
        manager: '0xB1A2ABCbC1FA276212f6eD239645161DeeA9861a',
        transceiver: {
          wormhole: '0x1352881a04cb9f9f5fB8442bc925e99EC15D3642',
        },
      },
    },
  },
});
