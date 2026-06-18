import { XcSwapClient } from './client';
import type { XcSwapOpts } from './types';

export function createXcSwap(opts: XcSwapOpts): XcSwapClient {
  return new XcSwapClient(opts);
}
