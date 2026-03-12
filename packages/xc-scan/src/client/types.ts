export type XcOcnUrn = `urn:ocn:${string}`;

export type XcPagination = {
  limit: number;
};

export type XcAssetRole =
  | 'transfer'
  | 'swap_in'
  | 'swap_out'
  | 'fee'
  | 'trapped'
  | 'refunded'
  | 'intermediate'
  | null;

export type XcAssetOperation = {
  asset: string;
  symbol?: string;
  amount: string;
  decimals?: number;
  usd?: number;
  role?: XcAssetRole;
  sequence?: number;
};

export type XcJourneyProtocol =
  | 'xcm'
  | 'wormhole'
  | 'snowbridge'
  | 'hyperbridge';

export type XcJourneyAction = 'query' | 'transact' | 'swap' | 'transfer';

export type XcJourneyStatus =
  | 'received'
  | 'failed'
  | 'timeout'
  | 'sent'
  | 'waiting'
  | 'unknown';

export interface XcJourneysCriteria {
  address?: string;
  txHash?: string;
  usdAmountGte?: number;
  usdAmountLte?: number;
  sentAtGte?: number;
  sentAtLte?: number;

  assets?: string[];
  origins?: XcOcnUrn[];
  destinations?: XcOcnUrn[];
  networks?: XcOcnUrn[];

  protocols?: string[];
  status?: string[];
  actions?: string[];
}

export interface XcJourneyWhVAAInstruction {
  type: 'WormholeVAA';
  value: {
    raw: string;
    guardianSetIndex: number;
    isDuplicated: boolean;
  };
}
export interface XcJourneyWhStop {
  type: 'wormhole';
  from: object;
  to: object;
  relay?: object;
  instructions: XcJourneyWhVAAInstruction;
  messageId?: string;
}

export interface XcJourneyStop {
  type: string;
  from: object;
  to: object;
  relay?: object;
  instructions: object[];
  messageId?: string;
}

export interface XcJourneysListRequest {
  op: 'journeys.list';
  criteria?: XcJourneysCriteria;
}

export interface XcJourneysByIdRequest {
  op: 'journeys.by_id';
  criteria: {
    id: string;
  };
}

export type XcJourneyRequest = XcJourneysListRequest | XcJourneysByIdRequest;

export type XcJourneyResponse = {
  items: XcJourney[];
  pageInfo: { hasNextPage: boolean; endCursor: string };
};

export type XcJourney = {
  id: number;
  correlationId: string;
  tripId?: string;
  status: string;
  type: string;
  originProtocol: string;
  destinationProtocol: string;
  origin: string;
  destination: string;
  from: string;
  to: string;
  fromFormatted?: string;
  toFormatted?: string;
  sentAt?: number;
  recvAt?: number;
  createdAt: number;
  stops: XcJourneyStop[] | XcJourneyWhStop[];
  instructions: any;
  transactCalls: any[];
  originTxPrimary?: string;
  originTxSecondary?: string;
  destinationTxPrimary?: string;
  destinationTxSecondary?: string;
  inConnectionFk?: number;
  inConnectionData?: any;
  outConnectionFk?: number;
  outConnectionData?: any;
  totalUsd: number;
  assets: XcAssetOperation[];
};

export type XcJourneyReplaceEvt = {
  ids: { id: number; correlationId: string };
  replaces: XcJourney;
};
