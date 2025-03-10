import { AssetAmount, ConfigBuilder } from '@galacticcouncil/xcm-core';
import { Call, DryRunResult, SubstrateCall } from '@galacticcouncil/xcm-sdk';

import {
  getWormholeChainById,
  logAssets,
  logSrcChains,
  logDestChains,
} from './utils';
import { evm, solana, substrate, substrateV2 } from './signers';
import { configService, wallet, whClient, whScan } from './setup';

// Define transfer constraints
const srcChain = configService.getChain('ethereum');
const destChain = configService.getChain('hydration');
const asset = configService.getAsset('eth');

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
const transfer = await wallet.transfer(
  asset,
  srcAddr,
  srcChain,
  destAddr,
  destChain
);

// Validate transfer
const status = await transfer.validate();

// Construct calldata with transfer amount
const transferAmount = '0.1';

const [call, fee] = await Promise.all([
  transfer.buildCall(transferAmount),
  transfer.estimateFee(transferAmount),
]);

// Dump transfer info
console.log(transfer);
console.log(status);
console.log(
  'Estimated fee:',
  [fee.toDecimal(fee.decimals), fee.originSymbol].join(' ')
);
console.log(call);
console.log('Dry run:', await call.dryRun());

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();

/***************************/
/**** Helper functions *****/
/***************************/

/**
 * Sign substrate transaction
 *
 * @param address - signer address
 */
async function sign(address: string) {
  const { txOptions } = call as SubstrateCall;

  // Using papi signer as txOptions not working in 14.x pjs
  if (txOptions) {
    substrateV2.signAndSend(address, call, srcChain, (event) => {
      console.log(event);
    });
  } else {
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
