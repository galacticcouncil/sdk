import { Call, SubstrateCall, WhStatus } from '@galacticcouncil/xcm-sdk';
import { Parachain } from '@galacticcouncil/xcm-core';
import { H160 } from '@galacticcouncil/sdk';

import { configService, wallet, whTransfers } from './setup';
import { evm } from './signers';

const account = 'INSERT_ADDRESS';

const deposits = await whTransfers.getDeposits(account);
const withdraws = await whTransfers.getWithdraws(account);

console.log(deposits);
console.log(withdraws);

const srcChain = configService.getChain('hydration') as Parachain;
const destChain = configService.getChain('moonbeam') as Parachain;

const feeAsset = srcChain.findAssetById('10'); // default to system

const redeemableDeposits = deposits.filter(
  (d) => d.status === WhStatus.VaaEmitted && d.redeem
);

if (redeemableDeposits.length > 0) {
  const [first] = redeemableDeposits;
  if (first.redeem) {
    const tx = await first.redeem(account);
    const remoteTx = await wallet.remoteXcm(
      account,
      srcChain,
      destChain,
      tx as SubstrateCall,
      { srcFeeAsset: feeAsset?.asset }
    );

    console.log(tx);
    console.log(remoteTx);
    // signEvm(account, remoteTx);
  }
}

/**
 * Sign EVM transaction
 *
 * @param address - signer address
 */
async function signEvm(address: string, call: Call) {
  const evmAddress = H160.fromAny(address);
  evm.signAndSend(
    evmAddress,
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
