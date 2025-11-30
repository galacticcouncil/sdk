import { TransferConfig } from '@galacticcouncil/xc-core';

import { PlatformAdapter } from '../platforms';

import { DataProcessor } from './DataProcessor';

export class DataReverseProcessor extends DataProcessor {
  constructor(adapter: PlatformAdapter, config: TransferConfig) {
    super(adapter, config);
  }
}
