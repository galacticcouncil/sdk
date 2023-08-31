import { Sdk } from '@galacticcouncil/xcm-sdk';
import { MutableConfigService } from '@galacticcouncil/xcm-config';
import { assets, chains, chainsConfig } from '@galacticcouncil/xcm';

import { createEtherSigner, createPolkadotSigner } from './signers';
import { logAssets, logDestChains, logSrcChains } from './utils';

function configure(configService: MutableConfigService) {
  assets.forEach((asset) => {
    configService.updateAssets(asset);
  });

  chains.forEach((chain) => {
    configService.updateChains(chain);
  });

  chainsConfig.forEach((config) => {
    configService.updateChainConfig(config);
  });
}

async function transfer(srcChain: string, destChain: string, asset: string) {
  const sourceChain = configService.getChain(srcChain);
  logAssets(sourceChain);

  const { sourceChains } = sdkBuilder.assets().asset(asset);
  logSrcChains(asset, sourceChains);

  const { destinationChains } = sdkBuilder.assets().asset(asset).source(srcChain);
  logDestChains(asset, destinationChains);

  const polkaSigner = await createPolkadotSigner();
  const etherSigner = await createEtherSigner();
  const ethAddress = await etherSigner.getAddress();
  // const acalaEvm = '0x616dfd307fd95942a74212c904942d3c9d3f219e';

  const data = await sdkBuilder
    .assets()
    .asset(asset)
    .source(srcChain)
    .destination(destChain)
    .accounts('7MHE9BUBEWU88cEto6P1XNNb66foSwAZPKhfL8GHW9exnuH1', ethAddress, {
      polkadotSigner: polkaSigner.signer,
      ethersSigner: etherSigner,
    });

  console.log(data.source);
  console.log(data.destination);
}

const configService = new MutableConfigService();
const sdkBuilder = Sdk({ configService: configService });

configure(configService);
await transfer('hydradx', 'moonbeam', 'dai-moonbeam');
