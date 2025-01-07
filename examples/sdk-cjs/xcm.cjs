const {
  assetsMap,
  chainsMap,
  routesMap,
  swaps,
} = require('@galacticcouncil/xcm-cfg');
const { ConfigService, Parachain } = require('@galacticcouncil/xcm-core');
const { Wallet } = require('@galacticcouncil/xcm-sdk');

const main = async () => {
  // Initialize config
  const configService = new ConfigService({
    assets: assetsMap,
    chains: chainsMap,
    routes: routesMap,
  });

  // Initialize wallet
  const wallet = new Wallet({
    configService: configService,
  });

  // Register chain swaps
  const hydration = configService.getChain('hydration');
  const assethub = configService.getChain('assethub');

  wallet.registerSwaps(
    new swaps.HydrationSwap(hydration),
    new swaps.AssethubSwap(assethub)
  );

  // Define transfer
  const srcChain = configService.getChain('hydration');
  const destChain = configService.getChain('polkadot');
  const asset = configService.getAsset('dot');

  // Define source & dest accounts
  const srcAddr = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const destAddr = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

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
