import { Binary } from 'polkadot-api';
import { decodeEventLog } from 'viem';

import { AAVE_POOL_ABI } from './abi';
import { AaveEvent, TEvmPayload } from './types';

export class AaveLog {
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
