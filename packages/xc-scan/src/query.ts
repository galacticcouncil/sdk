import {
  XcJourneyAction,
  XcJourneyProtocol,
  XcJourneysByIdRequest,
  XcJourneysCriteria,
  XcJourneysListRequest,
  XcJourneyStatus,
  XcOcnUrn,
} from './client';

function protocolsToQueryValues(protocols: XcJourneyProtocol[]): string[] {
  const expanded = protocols.flatMap((protocol: XcJourneyProtocol) => {
    if (protocol === 'wormhole') {
      return ['wh', 'wh_portal', 'wh_relayer'];
    }
    return [protocol];
  });

  return expanded;
}

function actionsToQueryValues(actions: XcJourneyAction[]): string[] {
  const expanded = actions.flatMap((action: XcJourneyAction) => {
    if (action === 'transfer') {
      return ['transfer', 'teleport', 'swap'];
    }
    if (action === 'query') {
      return ['queryResponse'];
    }
    return [action];
  });

  return expanded;
}

/**
 * Fluent builder for `journeys.list`.
 *
 * Example:
 *   const req = XcJourneyBuilder.journeys()
 *     .address("0x123...")
 *     .assets("ETH", "USDC")
 *     .origins("urn:ocn:polkadot:1000")
 *     .status("sent", "received")
 *     .usdAmountBetween(100, 1000)
 *     .build();
 */
export class XcJourneysListBuilder {
  private criteria: XcJourneysCriteria = {};

  address(address: string): this {
    this.criteria.address = address;
    return this;
  }

  txHash(txHash: string): this {
    this.criteria.txHash = txHash;
    return this;
  }

  usdAmountGte(value: number): this {
    this.criteria.usdAmountGte = value;
    return this;
  }

  usdAmountLte(value: number): this {
    this.criteria.usdAmountLte = value;
    return this;
  }

  sentAtGte(timestamp: number): this {
    this.criteria.sentAtGte = timestamp;
    return this;
  }

  sentAtLte(timestamp: number): this {
    this.criteria.sentAtLte = timestamp;
    return this;
  }

  usdAmountBetween(min: number, max: number): this {
    this.criteria.usdAmountGte = min;
    this.criteria.usdAmountLte = max;
    return this;
  }

  sentAtBetween(fromTs: number, toTs: number): this {
    this.criteria.sentAtGte = fromTs;
    this.criteria.sentAtLte = toTs;
    return this;
  }

  assets(assets: string[]): this {
    this.criteria.assets = assets;
    return this;
  }

  origins(origins: XcOcnUrn[]): this {
    this.criteria.origins = origins;
    return this;
  }

  destinations(destinations: XcOcnUrn[]): this {
    this.criteria.destinations = destinations;
    return this;
  }

  networks(networks: XcOcnUrn[]): this {
    this.criteria.networks = networks;
    return this;
  }

  protocols(protocols: XcJourneyProtocol[]): this {
    this.criteria.protocols = protocolsToQueryValues(protocols);
    return this;
  }

  actions(actions: XcJourneyAction[]): this {
    this.criteria.actions = actionsToQueryValues(actions);
    return this;
  }

  status(status: XcJourneyStatus[]): this {
    this.criteria.status = status;
    return this;
  }

  /**
   * Schema validation.
   */
  private validate(): void {
    const c = this.criteria;

    const validateLength = (
      field: string,
      value: string | undefined,
      min: number,
      max: number
    ) => {
      if (value == null) return;
      if (value.length < min || value.length > max) {
        throw new Error(
          `${field} length must be between ${min} and ${max} characters`
        );
      }
    };

    const validateArrayLen = (
      field: keyof XcJourneysCriteria,
      min: number,
      max: number
    ) => {
      const arr = c[field] as unknown as any[] | undefined;
      if (!arr) return;
      if (arr.length < min || arr.length > max) {
        throw new Error(
          `${String(field)} length must be between ${min} and ${max} items`
        );
      }
    };

    validateLength('address', c.address, 3, 100);
    validateLength('txHash', c.txHash, 3, 100);

    validateArrayLen('assets', 1, 50);
    validateArrayLen('origins', 1, 50);
    validateArrayLen('destinations', 1, 50);
    validateArrayLen('networks', 1, 50);
    validateArrayLen('protocols', 1, 2);
    validateArrayLen('status', 1, 4);
    validateArrayLen('actions', 1, 5);
  }

  build(options?: { validate?: boolean }): XcJourneysListRequest {
    if (options?.validate) {
      this.validate();
    }

    const hasCriteria = Object.keys(this.criteria).length > 0;

    return {
      op: 'journeys.list',
      ...(hasCriteria ? { criteria: this.criteria } : {}),
    };
  }
}

/**
 * Slim builder for `journeys.by_id`.
 *
 * Example:
 *   const req = XcJourneyBuilder.journey("some-id").build();
 */
export class XcJourneysByIdBuilder {
  constructor(private journeyId: string) {}

  id(id: string): this {
    this.journeyId = id;
    return this;
  }

  build(): XcJourneysByIdRequest {
    return {
      op: 'journeys.by_id',
      criteria: { id: this.journeyId },
    };
  }
}

/**
 * Facade for journey builders.
 */
export class XcJourneyBuilder {
  /**
   * Start building a `journeys.list` request.
   */
  static journeys(): XcJourneysListBuilder {
    return new XcJourneysListBuilder();
  }

  /**
   * Start building a `journeys.by_id` request with an id.
   */
  static journey(id: string): XcJourneysByIdBuilder {
    return new XcJourneysByIdBuilder(id);
  }
}
