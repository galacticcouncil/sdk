import { Sdk } from '@moonbeam-network/xcm-sdk';
import { ConfigService } from '@moonbeam-network/xcm-config';
import { assetsMap, chainsMap, chainsConfigMap } from '@galacticcouncil/xcm';

import { moonbeamWalletClient } from './client';
import { createPolkadotSigner } from './signers';
import { logAssets, logDestChains, logSrcChains } from './utils';

const configService = new ConfigService({
  assets: assetsMap,
  chains: chainsMap,
  chainsConfig: chainsConfigMap,
});

async function transfer(srcChain: string, destChain: string, asset: string) {
  const sourceChain = configService.getChain(srcChain);
  logAssets(sourceChain);

  const { sourceChains } = sdkBuilder.assets().asset(asset);
  logSrcChains(asset, sourceChains);

  const { destinationChains } = sdkBuilder
    .assets()
    .asset(asset)
    .source(srcChain);
  logDestChains(asset, destinationChains);

  const polkaSigner = await createPolkadotSigner();

  const SRC_ADDR = 'INSERT_ADDRESS';
  const DST_ADDR = 'INSERT_ADDRESS';

  const data = await sdkBuilder
    .assets()
    .asset(asset)
    .source(srcChain)
    .destination(destChain)
    .accounts(SRC_ADDR, DST_ADDR, {
      polkadotSigner: polkaSigner.signer,
      evmSigner: moonbeamWalletClient,
    });
  //data.transfer(0.1);
  console.log(data.source);
  console.log(data.destination);
}

const sdkBuilder = Sdk({ configService: configService });
await transfer('hydradx', 'moonbeam', 'wbtc_mwh');
