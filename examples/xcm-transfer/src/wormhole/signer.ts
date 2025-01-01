import {
  Chain,
  ChainAddress,
  ChainContext,
  Network,
  Signer,
  Wormhole,
} from '@wormhole-foundation/sdk-connect';
import { amount } from '@wormhole-foundation/sdk-base';

import { evm, solana } from './setup';

export interface SignerStuff<N extends Network, C extends Chain = Chain> {
  chain: ChainContext<N, C>;
  signer: Signer<N, C>;
  address: ChainAddress<C>;
}

export async function getSigner<N extends Network, C extends Chain>(
  chain: ChainContext<N, C>,
  privateKey: string
): Promise<SignerStuff<N, C>> {
  let signer: Signer;
  const platform = chain.platform.utils()._platform;
  switch (platform) {
    case 'Solana':
      signer = await solana.getSigner(await chain.getRpc(), privateKey, {
        debug: true,
        retries: 1,
        sendOpts: {
          maxRetries: 1,
        },
        priorityFee: {
          // take the middle priority fee
          percentile: 0.5,
          // juice the base fee taken from priority fee percentile
          percentileMultiple: 2,
          // at least 1 lamport/compute unit
          min: 1,
          // at most 1000 lamport/compute unit
          max: 1000,
        },
      });
      break;
    case 'Evm':
      signer = await evm.getSigner(await chain.getRpc(), privateKey, {
        debug: true,
        maxGasLimit: amount.units(amount.parse('0.01', 18)),
      });
      break;
    default:
      throw new Error('Unrecognized platform: ' + platform);
  }

  console.log(signer);

  return {
    chain,
    signer: signer as Signer<N, C>,
    address: Wormhole.chainAddress(chain.chain, signer.address()),
  };
}
