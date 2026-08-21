import { Binary } from 'polkadot-api';
import { decodeEventLog, toEventSelector } from 'viem';

import { DIA_ORACLE_ABI, MANAGED_ORACLE_ABI } from './abi';
import { TEvmPayload, MmOracleEvent } from './types';

const EVENT_SELECTORS = new Map<string, string>([
  ...MANAGED_ORACLE_ABI.flatMap((x) =>
    x.type === 'event'
      ? [[toEventSelector(x), `ManagedOracle.${x.name}`] as const]
      : []
  ),
  ...DIA_ORACLE_ABI.flatMap((x) =>
    x.type === 'event' ? [[toEventSelector(x), `DIA.${x.name}`] as const] : []
  ),
]);

export class MmOracleLog {
  static eventName(payload: TEvmPayload): string {
    const [topic0] = payload.log.topics;
    return EVENT_SELECTORS.get(String(topic0)) ?? '';
  }

  static parse(payload: TEvmPayload): MmOracleEvent | undefined {
    const { address, topics, data } = payload.log;
    const emitter = address.toLowerCase();
    const dataHex = Binary.toHex(data);

    try {
      const { eventName, args } = decodeEventLog({
        abi: MANAGED_ORACLE_ABI,
        topics: topics as any,
        data: dataHex as any,
      });
      return {
        eventName: `ManagedOracle.${eventName}`,
        emitter,
        value: args.answer,
        timestamp: args.timestamp,
      };
    } catch {}

    try {
      const { eventName, args } = decodeEventLog({
        abi: DIA_ORACLE_ABI,
        topics: topics as any,
        data: dataHex as any,
      });
      return {
        eventName: `DIA.${eventName}`,
        emitter,
        key: args.key,
        value: args.value,
        timestamp: args.timestamp,
      };
    } catch {}

    return undefined;
  }
}
