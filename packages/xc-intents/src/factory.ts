import { XcIntentsClient } from './client';
import type { XcIntentsOpts } from './types';

export function createXcIntents(opts: XcIntentsOpts): XcIntentsClient {
  return new XcIntentsClient(opts);
}
