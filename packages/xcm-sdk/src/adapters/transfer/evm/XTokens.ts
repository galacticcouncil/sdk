import { Abi, Precompile } from '@galacticcouncil/xcm-core';
import { EvmTransfer } from './EvmTransfer';

export class XTokens extends EvmTransfer {
  _abi() {
    return Abi.XTokens;
  }
  _precompile(): string {
    return Precompile.XTokens;
  }
}
