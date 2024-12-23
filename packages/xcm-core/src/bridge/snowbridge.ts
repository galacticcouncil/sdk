import { AnyChain } from 'chain';

export type SnowbridgeDef = {
  id: number;
  gateway: string;
  bridgeFee: bigint;
};

export class Snowbridge {
  readonly id: number;
  readonly gateway: string;
  readonly bridgeFee: bigint;

  constructor({ id, gateway, bridgeFee }: SnowbridgeDef) {
    this.id = id;
    this.gateway = gateway;
    this.bridgeFee = bridgeFee;
  }

  static fromChain(chain: AnyChain): Snowbridge {
    if ('snowbridge' in chain && !!chain['snowbridge']) {
      return chain.snowbridge as Snowbridge;
    }
    throw new Error(chain.name + ' is not supported in Snowbridge.');
  }

  static isKnown(chain: AnyChain): boolean {
    return 'snowbridge' in chain && !!chain['snowbridge'];
  }

  getConsensusId(): number {
    return this.id;
  }

  getGateway(): string {
    return this.gateway;
  }

  getBridgeFee(): bigint {
    return this.bridgeFee;
  }
}
