import { Binary } from 'polkadot-api';
import { decodeEventLog, toEventSelector } from 'viem';

import { AAVE_POOL_ABI } from './abi';
import { AaveEvent, TEvmPayload } from './types';

const EVENT_SELECTORS = new Map<string, string>(
  AAVE_POOL_ABI.flatMap((x) =>
    x.type === 'event' ? [[toEventSelector(x), x.name] as const] : []
  )
);

export class AaveLog {
  static eventName(payload: TEvmPayload): string {
    const [topic0] = payload.log.topics;
    return EVENT_SELECTORS.get(String(topic0)) ?? '';
  }

  static parse(payload: TEvmPayload): AaveEvent | undefined {
    const { topics, data } = payload.log;
    const dataHex = Binary.toHex(data);

    try {
      const { eventName, args } = decodeEventLog({
        abi: AAVE_POOL_ABI,
        topics: topics as any,
        data: dataHex as any,
      });

      const reserve = args.reserve.toLowerCase();

      return {
        eventName,
        reserve,
        key: `${eventName}:${reserve}`,
      };
    } catch {
      return undefined;
    }
  }
}
