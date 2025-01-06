import { ExternalAsset } from '@galacticcouncil/sdk';
import { ConfigService, Parachain } from '@galacticcouncil/xcm-core';

import { toHydrationExtTemplate } from './polkadot/assethub/templates';
import { toHubExtTemplate } from './polkadot/hydration/templates';

import {
  toAsset,
  toHubAsset,
  toHydrationAsset,
} from './HydrationConfigService.utils';

export class HydrationConfigService extends ConfigService {
  registerExternal(external: ExternalAsset[]) {
    const hydration = this.getChain('hydration') as Parachain;
    const assethub = this.getChain('assethub') as Parachain;

    const isRegistered = (ext: ExternalAsset): boolean => {
      return !!hydration.findAssetById(ext.internalId);
    };

    external
      .filter((ext) => {
        return !isRegistered(ext) && ext.origin === 1000;
      })
      .forEach((ext) => {
        const asset = toAsset(ext);
        const hubAsset = toHubAsset(ext);
        const hydrationAsset = toHydrationAsset(ext);

        console.log('💀 Registering ' + asset.key);

        assethub.updateAsset(hubAsset);
        hydration.updateAsset(hydrationAsset);

        this.updateChainRoute(assethub, toHydrationExtTemplate(asset));
        this.updateChainRoute(hydration, toHubExtTemplate(asset));
      });
  }
}
