const {
  chainsConfigMap,
  chainsMap,
  assetsMap,
} = require('@galacticcouncil/xcm-cfg');
const { ConfigService } = require('@galacticcouncil/xcm-core');
const { Wallet } = require('@galacticcouncil/xcm-sdk');

const main = async () => {
  // Inialialize config
  const configService = new ConfigService({
    assets: assetsMap,
    chains: chainsMap,
    chainsConfig: chainsConfigMap,
  });

  // Inialialize wallet
  const wallet = new Wallet({
    config: configService,
  });

  // Define transfer
  const srcChain = configService.getChain('hydradx');
  const destChain = configService.getChain('polkadot');
  const asset = configService.getAsset('dot');

  // Define source & dest accounts
  const srcAddr = 'INSERT_ADDRESS';
  const destAddr = 'INSERT_ADDRESS';

  // Get transfer input data (dialog)
  const xTransfer = await wallet.transfer(
    asset,
    srcAddr,
    srcChain,
    destAddr,
    destChain
  );
  console.log(xTransfer);

  // Construct calldata with transfer amount
  const call = await xTransfer.buildCall('0.1');
  console.log(call);
};

main()
  .then(() => console.log('XTransfer complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
