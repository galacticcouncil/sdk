import { Parachain } from './Parachain';
import { EvmParachain } from './EvmParachain';
import { EvmChain } from './EvmChain';
import { SolanaChain } from './SolanaChain';
import { SuiChain } from './SuiChain';
import { NearChain } from './NearChain';
import { ZecChain } from './ZecChain';

export type AnyChain =
  | Parachain
  | EvmParachain
  | EvmChain
  | SolanaChain
  | SuiChain
  | NearChain
  | ZecChain;

export type AnyParachain = Parachain | EvmParachain;
export type AnyEvmChain = EvmChain | EvmParachain;
