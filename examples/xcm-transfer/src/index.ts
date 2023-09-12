//import { Sdk } from '@moonbeam-network/xcm-sdk';
import { Sdk } from '@galacticcouncil/xcm-sdk';
import { ConfigService } from '@moonbeam-network/xcm-config';
import { assetsMap, chainsMap, chainsConfigMap } from '@galacticcouncil/xcm';

import { createEtherSigner, createPolkadotSigner } from './signers';
import { logAssets, logDestChains, logSrcChains } from './utils';

const configService = new ConfigService({assets: assetsMap, chains: chainsMap, chainsConfig: chainsConfigMap})

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
    .accounts('7MHE9BUBEWU88cEto6P1XNNb66foSwAZPKhfL8GHW9exnuH1', "14gfrgMn2BNLHukfjYxWjbcpNXfGzPVmW4oPa4kKLHCF4YMj", {
      polkadotSigner: polkaSigner.signer,
      //evmSigner: etherSigner,
    });
   
  data.transfer(1);  

  console.log(data.source);
  console.log(data.destination);
}

const sdkBuilder = Sdk({ configService: configService });
await transfer('hydradx', 'zeitgeist', 'ztg');