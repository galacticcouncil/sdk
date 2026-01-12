const {
  assetsMap,
  chainsMap,
  routesMap,
  dex,
} = require('@galacticcouncil/xcm-cfg');
const { ConfigService } = require('@galacticcouncil/xcm-core');
const { Wallet } = require('@galacticcouncil/xcm-sdk');
const { createSdkContext } = require('@galacticcouncil/sdk');

const main = async () => {
  // Initialize config
  const configService = new ConfigService({
    assets: assetsMap,
    chains: chainsMap,
    routes: routesMap,
  });

  const hydration = configService.getChain('hydration');
  const hydrationApi = await hydration.api;
  const hydrationSdk = createSdkContext(hydrationApi);

  const { ctx } = hydrationSdk;

  // Initialize wallet
  const wallet = new Wallet({
    configService: configService,
  });

  // Register dexes
  const hydrationDex = new dex.HydrationDex(hydration, ctx.pool);
  wallet.registerDex(hydrationDex);

  // Define transfer
  const srcChain = configService.getChain('hydration');
  const destChain = configService.getChain('assethub');
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
