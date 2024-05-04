import {
  AssetAmount,
  ConfigService,
  ConfigBuilder,
  Abi,
  Precompile,
  EvmChain,
} from '@galacticcouncil/xcm-core';
import {
  chainsConfigMap,
  chainsMap,
  assetsMap,
} from '@galacticcouncil/xcm-cfg';

import { Wallet, XCall, XCallEvm } from '@galacticcouncil/xcm-sdk';

import { decodeFunctionData, encodeFunctionData } from 'viem';

import { logAssets, logSrcChains, logDestChains } from './utils';
import { signAndSendEvm } from './signers';
import { WormholeClient } from 'wormhole';

// Inialialize config
const configService = new ConfigService({
  assets: assetsMap,
  chains: chainsMap,
  chainsConfig: chainsConfigMap,
});

// Inialialize wallet
const wallet: Wallet = new Wallet({
  config: configService,
});

// Define transfer
const asset = configService.getAsset('dai_awh');
const srcChain = configService.getChain('acala-evm');
const destChain = configService.getChain('hydradx');

const configBuilder = ConfigBuilder(configService);
const { sourceChains } = configBuilder.assets().asset(asset);
const { destinationChains } = configBuilder
  .assets()
  .asset(asset)
  .source(srcChain);

// Dump transfer info
logAssets(srcChain);
logDestChains(asset.key, destinationChains);
logSrcChains(asset.key, sourceChains);

// Define source & dest accounts
const srcAddr = '0x26f5C2370e563e9f4dDA435f03A63D7C109D8D04';
const destAddr = '7KATdGamwo5s8P31iNxKbKStR4SmprTjkwzeSnSbQuQJsgym';

// Subscribe source chain token balance
const balanceObserver = (balances: AssetAmount[]) => console.log(balances);
const balanceSubscription = await wallet.subscribeBalance(
  srcAddr,
  srcChain,
  balanceObserver
);

// Get transfer input data (dialog)
const xTransfer = await wallet.transfer(
  asset,
  srcAddr,
  srcChain,
  destAddr,
  destChain
);

// Construct calldata with transfer amount
const call: XCall = await xTransfer.buildCall('1');

// Dump transfer info
console.log(xTransfer);
console.log(call);

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();

///////////////////////////////////////
// Signers & Wormhole specific code //
/////////////////////////////////////

/* signAndSendEvm(
  srcChain,
  srcAddr,
  call,
  (hash) => {
    console.log('TxHash: ' + hash);
  },
  (receipt) => {
    console.log(receipt);
  },
  (error) => {
    console.error(error);
  }
); */

////////////////////////
// [Wormhole client] //
//////////////////////

const wh = new WormholeClient();

///////////////////
// [VAA Status] //
/////////////////

// const vaa = await wh.getVaa('0x...');
// const isTransferComplete = await wh.isTransferCompleted(vaa);
// console.log('Transfer completed: ' + isTransferComplete);

////////////////////////
// [Redeem transfer] //
//////////////////////

// wh.redeem(vaa, destAddr, (tx) => {
//   const { chainId, ...call } = tx.transaction;
//   console.log(call);
//
//   signAndSendEvm(
//     destChain,
//     destAddr,
//     call,
//     (hash) => {
//       console.log('TxHash: ' + hash);
//     },
//     (receipt) => {
//       console.log(receipt);
//     },
//     (error) => {
//       console.error(error);
//     }
//   );
//   console.log(tx);
// });

//////////////////////////////
// [Redeem transfer - GMP] //
////////////////////////////

// wh.redeem(vaa, srcAddr, (tx) => {
//   const { chainId, ...call } = tx.transaction;
//   console.log(call);

//   const { data } = tx.transaction;
//   const { args } = decodeFunctionData({
//     abi: Abi.TokenBridge,
//     data: data,
//   });

//   const xData = encodeFunctionData({
//     abi: Abi.Gmp,
//     functionName: 'wormholeTransferERC20',
//     args: args,
//   });

//   const xCall = {
//     from: '0x...' as `0x${string}`,
//     data: xData as `0x${string}`,
//     abi: JSON.stringify(Abi.Gmp),
//     to: Precompile.Bridge,
//   } as XCall;

//   signAndSendEvm(
//     configService.getChain('moonbeam'),
//     srcAddr,
//     xCall,
//     (hash) => {
//       console.log('TxHash: ' + hash);
//     },
//     (receipt) => {
//       console.log(receipt);
//     },
//     (error) => {
//       console.error(error);
//     }
//   );
// });
