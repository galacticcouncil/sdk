import { ChainAssetData, ConfigService } from '@galacticcouncil/xcm-core';

import { toHydrationExtTemplate } from './polkadot/assethub/templates';
import { toHubExtTemplate } from './polkadot/hydration/templates';

export class HydrationConfigService extends ConfigService {
  addExternalHubRoute(external: ChainAssetData) {
    const assethub = this.getChain('assethub');
    const hydration = this.getChain('hydration');
    const { balanceId, ...base } = external;

    assethub.updateAsset(base);
    hydration.updateAsset(external);

    this.updateAsset(external.asset);
    this.updateChainRoute(assethub, toHydrationExtTemplate(external.asset));
    this.updateChainRoute(hydration, toHubExtTemplate(external.asset));
  }
}
