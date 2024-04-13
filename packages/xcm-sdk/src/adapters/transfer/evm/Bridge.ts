import { Abi, Precompile } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class Bridge extends EvmTransfer {
  _abi() {
    return Abi.Bridge;
  }
  _precompile(): string {
    return Precompile.Bridge;
  }
}
