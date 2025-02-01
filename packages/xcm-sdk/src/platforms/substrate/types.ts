import { Call } from '../types';

export interface SubstrateCall extends Call {
  txOptions?: {
    asset?: any;
  };
}
