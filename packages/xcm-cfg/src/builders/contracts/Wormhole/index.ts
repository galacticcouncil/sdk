import { TokenBridge } from './TokenBridge';
import { TokenRelayer } from './TokenRelayer';

export function Wormhole() {
  return {
    TokenBridge,
    TokenRelayer,
  };
}
