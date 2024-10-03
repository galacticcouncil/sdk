import {
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xcm-core';

import { assetConversion } from './extrinsics/assetConversion';
import { ethereumXcm } from './extrinsics/ethereumXcm';
import { polkadotXcm } from './extrinsics/polkadotXcm';
import { router } from './extrinsics/router';
import { utility } from './extrinsics/utility';
import { xcmPallet } from './extrinsics/xcmPallet';
import { xTokens } from './extrinsics/xTokens';
import { xTransfer } from './extrinsics/xTransfer';

export function ExtrinsicBuilder() {
  return {
    assetConversion,
    ethereumXcm,
    polkadotXcm,
    router,
    utility,
    xTokens,
    xTransfer,
    xcmPallet,
  };
}

export function ExtrinsicInstruction(
  predicate: (params: ExtrinsicConfigBuilderParams) => boolean,
  instruction: ExtrinsicConfigBuilder
) {
  return {
    prior: function (config: ExtrinsicConfigBuilder): ExtrinsicConfigBuilder {
      return {
        build: (params) => {
          if (predicate(params)) {
            return ExtrinsicBuilder()
              .utility()
              .batchAll([instruction, config])
              .build(params);
          }
          return config.build(params);
        },
      };
    },
    priorMulti: function (
      configs: ExtrinsicConfigBuilder[]
    ): ExtrinsicConfigBuilder {
      return {
        build: (params) => {
          if (predicate(params)) {
            return ExtrinsicBuilder()
              .utility()
              .batchAll([instruction, ...configs])
              .build(params);
          }
          return ExtrinsicBuilder()
            .utility()
            .batchAll([...configs])
            .build(params);
        },
      };
    },
  };
}
