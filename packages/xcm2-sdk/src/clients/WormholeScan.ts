import { Precompile } from '@galacticcouncil/xcm2-core';

const DEFAULT_URL = 'https://api.wormholescan.io';

export interface Vaa {
  sequence: number;
  id: string;
  version: number;
  emitterChain: number;
  emitterAddr: string;
  emitterNativeAddr: string;
  guardianSetIndex: number;
  vaa: string;
  timestamp: string;
  updatedAt: string;
  indexedAt: string;
  txHash: string;
}

export interface VaaBytes {
  vaaBytes: string;
}

export interface Operation {
  id: string;
  content: {
    payload: OperationPayload;
    standarizedProperties: OperationProperties;
  };
  data: {
    symbol: string;
    tokenAmount: string;
  };
  emitterChain: number;
  emitterAddress: {
    hex: string;
    native: string;
  };
  sequence: string;
  sourceChain: {
    chainId: number;
    from: string;
    status: string;
    timestamp: string;
    transaction: {
      txHash: string;
    };
  };
  targetChain?: {
    status: string;
  };
  vaa?: {
    guardianSetIndex: number;
    isDuplicated: boolean;
    raw: string;
  };
}

export interface OperationParsedPayload {
  targetRecipient: string;
  targetRelayerFee: bigint;
  toNativeTokenAmount: bigint;
}

export interface OperationPayload {
  amount: string;
  fee: string;
  fromAddress: string;
  parsedPayload: OperationParsedPayload;
  payload: string;
  payloadType: number;
  toAddress: string;
  toChain: number;
  tokenAddress: string;
  tokenChain: number;
}

export interface OperationProperties {
  fromChain: number;
  fromAddress: string;
  toChain: number;
  toAddress: string;
  tokenChain: number;
  tokenAddress: string;
}

export class WormholeScan {
  private _baseUrl: string;

  public constructor(baseUrl?: string) {
    this._baseUrl = baseUrl || DEFAULT_URL;
  }

  private buildApi(api: string, params: Record<string, string>): string {
    return (
      [this._baseUrl, api, '?'].join('') +
      new URLSearchParams(params).toString()
    );
  }

  async getVaaBytes(wormholeId: string): Promise<VaaBytes> {
    const url = this.buildApi('/v1/signed_vaa/' + wormholeId, {});
    const vaa = await fetch(url);
    const resp = await vaa.json();
    return resp as VaaBytes;
  }

  async getVaa(wormholeId: string): Promise<Vaa> {
    const url = this.buildApi('/api/v1/vaas/' + wormholeId, {});
    const vaa = await fetch(url);
    const resp = await vaa.json();
    return resp.data as Vaa;
  }

  async getVaaByTxHash(txHash: string): Promise<Vaa> {
    const url = this.buildApi('/api/v1/vaas/', { txHash: txHash });
    const vaa = await fetch(url);
    const resp = await vaa.json();
    if (resp.data.length > 0) {
      return resp.data[0] as Vaa;
    }
    throw Error("Can't find VAA for given txHash: " + txHash);
  }

  async getOperations(params: Record<string, string>): Promise<Operation[]> {
    const url = this.buildApi('/api/v1/operations/', params);
    const operations = await fetch(url);
    const resp = await operations.json();
    return resp.operations as Operation[];
  }

  async getOperation(wormholeId: string): Promise<Operation> {
    const url = this.buildApi('/api/v1/operations/' + wormholeId, {});
    const operation = await fetch(url);
    const resp = await operation.json();
    return resp as Operation;
  }

  isMrlTransfer(payload: OperationPayload): boolean {
    const { payloadType, toAddress, toChain } = payload;
    const nativeToAddress = '0x' + toAddress.substring(26);
    return (
      payloadType === 3 &&
      toChain === 16 &&
      nativeToAddress === Precompile.Bridge
    );
  }
}
