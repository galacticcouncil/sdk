import { Binary } from 'polkadot-api';
import { decodeEventLog } from 'viem';

import { DIA_ORACLE_ABI, MANAGED_ORACLE_ABI } from './abi';
import { TEvmPayload, MmOracleEvent } from './types';

export class MmOracleLog {
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
