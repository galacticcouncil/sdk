import {
  AssetAmount,
  ConfigService,
  ConfigBuilder,
} from '@galacticcouncil/xcm-core';
import {
  chainsConfigMap,
  chainsMap,
  assetsMap,
} from '@galacticcouncil/xcm-cfg';
import {
  Wallet,
  XCall,
  WormholeScan,
  WormholeClient,
} from '@galacticcouncil/xcm-sdk';

import { configureExternal, externals } from './externals';
import {
  getWormholeChainById,
  logAssets,
  logSrcChains,
  logDestChains,
} from './utils';
import { signAndSendEvm, signAndSend } from './signers';

// Inialialize config
let configService = new ConfigService({
  assets: assetsMap,
  chains: chainsMap,
  chainsConfig: chainsConfigMap,
});

// Inialialize wallet & clients
const whScan = new WormholeScan();
const whClient = new WormholeClient();
const wallet: Wallet = new Wallet({
  config: configService,
});

// Dynamically add external asset to xcm
configureExternal(externals, configService);

// Define transfer
const srcChain = configService.getChain('hydradx');
const destChain = configService.getChain('assethub');
const asset = configService.getAsset('usdt');

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
const srcAddr = 'INSERT_ADDRESS';
const destAddr = 'INSERT_ADDRESS';

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
const call: XCall = await xTransfer.buildCall('0.1');

// Dump transfer info
console.log(xTransfer);
console.log(call);

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();

/***************************/
/**** Helper functions *****/
/***************************/

/**
 * Sign transaction
 *
 * @param address - signer address
 */
async function sign(address: string) {
  signAndSend(
    srcChain,
    address,
    call,
    ({ status }) => {
      console.log(status.toHuman());
    },
    (error) => {
      console.error(error);
    }
  );
}

/**
 * Sign EVM transaction
 *
 * @param address - signer address
 */
async function signEvm(address: string) {
  signAndSendEvm(
    srcChain,
    address,
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
  );
}

/**
 * Check transfer status & redeem the funds if VAA emitted
 *
 * @param txHash - wormhole transaction hash
 * @param address - signer address
 */
async function checkAndRedeem(txHash: string, address: string) {
  const { id, vaa } = await whScan.getVaaByTxHash(txHash);
  const { content } = await whScan.getOperation(id);
  const { payload } = content;
  const chain = getWormholeChainById(payload.toChain)!;
  const isCompleted = await whClient.isTransferCompleted(chain, vaa);
  console.log('Transfer completed: ' + isCompleted);

  // Call redeem if transfer not completed
  if (!isCompleted) {
    const call = whScan.isMrlTransfer(payload)
      ? whClient.redeemMrl(address, vaa)
      : whClient.redeem(chain, address, vaa);
    signAndSendEvm(
      chain,
      address,
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
    );
  }
}
