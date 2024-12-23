import { TokenBridge } from './TokenBridge';
import { Buffer } from 'buffer';

window.Buffer = Buffer;

export function Wormhole() {
  return {
    TokenBridge,
  };
}
