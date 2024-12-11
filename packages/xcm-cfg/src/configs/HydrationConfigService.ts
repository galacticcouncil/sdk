import { ChainAssetData, ConfigService } from '@galacticcouncil/xcm-core';

import { toHydrationExtTemplate } from './polkadot/assethub/templates';
import { toHubExtTemplate } from './polkadot/hydration/templates';

export class HydrationConfigService extends ConfigService {
  addExternalHubRoute(
    hubAsset: ChainAssetData,
    parachainAsset: ChainAssetData
  ) {
    const { asset } = hubAsset;

    const assethub = this.getChain('assethub');
    const hydration = this.getChain('hydration');

    assethub.updateAsset(hubAsset);
    hydration.updateAsset(parachainAsset);

    this.updateAsset(asset);
    this.updateChainRoute(assethub, toHydrationExtTemplate(asset));
    this.updateChainRoute(hydration, toHubExtTemplate(asset));
  }
}
