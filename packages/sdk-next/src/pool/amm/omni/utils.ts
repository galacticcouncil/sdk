import { HUB_ASSET_ID, SYSTEM_ASSET_ID } from '../../../consts';

import { TEmaPair } from '../../../oracle';

export const getEmaPair = (asset: number): TEmaPair => {
  return asset === SYSTEM_ASSET_ID
    ? [SYSTEM_ASSET_ID, HUB_ASSET_ID]
    : [HUB_ASSET_ID, asset];
};

export const getEmaKey = (asset: number): string => {
  return getEmaPair(asset).join(':');
};
