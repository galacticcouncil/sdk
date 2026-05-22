import { Binary } from 'polkadot-api';
import { decodeEventLog } from 'viem';

import { GHO_TOKEN_ABI } from './abi';
import { TEvmPayload, GhoTokenEvent } from './types';

export class GhoTokenLog {
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
