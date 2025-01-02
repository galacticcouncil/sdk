import { TransferConfig } from '@galacticcouncil/xcm-core';

import { PlatformAdapter } from '../platforms';

import { TransferData } from './TransferData';

export class TransferDstData extends TransferData {
  constructor(adapter: PlatformAdapter, config: TransferConfig) {
    super(adapter, config);
  }
}
