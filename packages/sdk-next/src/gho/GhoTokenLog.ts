import { Binary } from 'polkadot-api';
import { decodeEventLog, toEventSelector } from 'viem';

import { GHO_TOKEN_ABI } from './abi';
import { TEvmPayload, GhoTokenEvent } from './types';

const EVENT_SELECTORS = new Map<string, string>(
  GHO_TOKEN_ABI.flatMap((x) =>
    x.type === 'event' ? [[toEventSelector(x), x.name] as const] : []
  )
);

export class GhoTokenLog {
  static eventName(payload: TEvmPayload): string {
    const [topic0] = payload.log.topics;
    return EVENT_SELECTORS.get(String(topic0)) ?? '';
  }

  static parse(payload: TEvmPayload): GhoTokenEvent | undefined {
    const { topics, data } = payload.log;
    const dataHex = Binary.toHex(data);

    try {
      const { eventName, args } = decodeEventLog({
        abi: GHO_TOKEN_ABI,
        topics: topics as any,
        data: dataHex as any,
      });

      const facilitator = args.facilitatorAddress.toLowerCase();

      return {
        eventName,
        facilitator,
        key: `${eventName}:${facilitator}`,
      };
    } catch {
      return undefined;
    }
  }
}
