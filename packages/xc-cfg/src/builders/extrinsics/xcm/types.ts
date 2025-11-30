export enum XcmVersion {
  v1 = 'V1',
  v2 = 'V2',
  v3 = 'V3',
  v4 = 'V4',
  v5 = 'V5',
}

export enum XcmTransferType {
  Teleport = 'Teleport',
  LocalReserve = 'LocalReserve',
  DestinationReserve = 'DestinationReserve',
  RemoteReserve = 'RemoteReserve',
}

export type Parents = 0 | 1 | 2;

// ============================================================================
// XCM ENCODER TYPES
// ============================================================================

/**
 * Encoding mode for the XcmEncoder (typed API vs unsafe API)
 */
export type EncodingMode = 'typed' | 'unsafe';
