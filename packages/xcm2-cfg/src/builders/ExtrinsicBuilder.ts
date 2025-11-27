import {
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xcm2-core';

import { assetConversion } from './extrinsics/assetConversion';
import { assets } from './extrinsics/assets';
import { balances } from './extrinsics/balances';
import { router } from './extrinsics/router';
import { utility } from './extrinsics/utility';

import {
  ethereumXcm,
  polkadotXcm,
  xcmPallet,
  xTokens,
  xTransfer,
} from './extrinsics/xcm';

export function ExtrinsicBuilder() {
  return {
    assetConversion,
    assets,
    balances,
    ethereumXcm,
    polkadotXcm,
    router,
    utility,
    xTokens,
    xTransfer,
    xcmPallet,
  };
}

export function ExtrinsicDecorator(
  predicate: (params: ExtrinsicConfigBuilderParams) => boolean,
  extrinsic: ExtrinsicConfigBuilder
) {
  return {
    prior: function (config: ExtrinsicConfigBuilder): ExtrinsicConfigBuilder {
      return {
        build: (params) => {
          if (predicate(params)) {
            return ExtrinsicBuilder()
              .utility()
              .batchAll([extrinsic, config])
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
              .batchAll([extrinsic, ...configs])
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
