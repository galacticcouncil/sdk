import { PoolService } from '@galacticcouncil/sdk';
import {
  AssetAmount,
  ConfigBuilder,
  EvmParachain,
} from '@galacticcouncil/xcm-core';
import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';
import {
  XCall,
  Wallet,
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
import { evm, solana, substrate } from './signers';

// Inialialize config
const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

// Initialize hydration API
const hydration = configService.getChain('hydration') as EvmParachain;
const hydrationApi = await hydration.api;

// Initialize pool service
const poolService = new PoolService(hydrationApi);

// Inialialize wallet & clients
const whScan = new WormholeScan();
const whClient = new WormholeClient();
const wallet = new Wallet({
  configService: configService,
  poolService: poolService,
  transferValidations: validations,
});

// Dynamically add external assets to xcm
configureExternal(externals, configService);

// Define transfer constraints
const srcChain = configService.getChain('ethereum');
const destChain = configService.getChain('hydration');
const asset = configService.getAsset('weth');

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

// Validate transfer
const status = await xTransfer.validate();

// Construct calldata with transfer amount
const fee: AssetAmount = await xTransfer.estimateFee('0.1');
const feeInfo = [
  'Estimated fee:',
  fee.toDecimal(fee.decimals),
  fee.originSymbol,
].join(' ');
const call: XCall = await xTransfer.buildCall('0.1');

// Dump transfer info
console.log(xTransfer);
console.log(status);
console.log(feeInfo);
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
  substrate.signAndSend(
    address,
    call,
    srcChain,
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
  evm.signAndSend(
    address,
    call,
    srcChain,
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
 * Sign solana transaction
 *
 * @param address - signer address
 */
async function signSolana() {
  solana.signAndSend(
    call,
    srcChain,
    (hash) => {
      console.log('TxHash: ' + hash);
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
    evm.signAndSend(
      address,
      call,
      chain,
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
