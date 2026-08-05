import {
  ContractConfig,
  ContractConfigBuilder,
  ContractConfigBuilderParams,
  ExtrinsicConfigBuilder,
} from '@galacticcouncil/xc-core';

import { Batch } from './contracts/Batch';
import { Erc20 } from './contracts/Erc20';
import { Basejump } from './contracts/Basejump';
import { PolkadotXcm } from './contracts/PolkadotXcm';
import { Snowbridge } from './contracts/snowbridge';
import { Wormhole } from './contracts/Wormhole';

export function ContractBuilder() {
  return {
    Batch,
    Erc20,
    Basejump,
    PolkadotXcm,
    Snowbridge,
    Wormhole,
  };
}

/**
 * Contract counterpart of {@link ExtrinsicDecorator} - attaches an extrinsic
 * to run ahead of the call.
 *
 * Where the extrinsic decorator can wrap both sides in `Utility.batch_all`
 * itself, a contract call is not a substrate call: the batching happens later,
 * once the platform knows the origin is ss58 and has wrapped the call in
 * `EVM.call`. So this only carries the extrinsic on the config and leaves the
 * assembly to {@link SubstrateEvm}.
 */
export function ContractDecorator(
  predicate: (params: ContractConfigBuilderParams) => boolean,
  extrinsic: ExtrinsicConfigBuilder
) {
  return {
    prior: function (config: ContractConfigBuilder): ContractConfigBuilder {
      return {
        build: async (params) => {
          const contract = await config.build(params);
          if (!predicate(params)) {
            return contract;
          }
          return new ContractConfig({
            ...contract,
            prior: await extrinsic.build(params),
          });
        },
      };
    },
  };
}
