import { AnyChain } from '../chain';

import { TransferCtx } from './types';

export interface TransferValidationReport {
  [key: string]: any;
}

export class TransferValidationError extends Error {
  readonly report: TransferValidationReport;

  constructor(message: string, report: TransferValidationReport) {
    super(message);
    this.name = 'TransferValidationError';
    this.report = report;
  }
}

export type TransferValidationConstraint = (chain: AnyChain) => boolean;

export abstract class TransferValidation {
  readonly sourceConstraint: TransferValidationConstraint;
  readonly destinationConstraint: TransferValidationConstraint;

  constructor(
    sourceConstraint: TransferValidationConstraint,
    destinationConstraint: TransferValidationConstraint
  ) {
    this.sourceConstraint = sourceConstraint;
    this.destinationConstraint = destinationConstraint;
  }

  private ruleFor(ctx: TransferCtx): boolean {
    const { source, destination } = ctx;
    return (
      this.sourceConstraint(source.chain) &&
      this.destinationConstraint(destination.chain)
    );
  }

  abstract validate(ctx: TransferCtx): void;

  check(ctx: TransferCtx) {
    if (this.ruleFor(ctx)) {
      return this.validate(ctx);
    }
  }
}

export class TransferValidator {
  private criterias: TransferValidation[] = [];

  constructor(...criterias: TransferValidation[]) {
    this.criterias = criterias;
  }

  async validate(ctx: TransferCtx): Promise<TransferValidationReport[]> {
    const summary: TransferValidationReport[] = [];
    const promises = [];

    for (const criterion of this.criterias) {
      promises.push(criterion.check(ctx));
    }

    await Promise.allSettled(promises).then((results) =>
      results.forEach((result) => {
        if (result.status === 'rejected') {
          const error = result.reason as TransferValidationError;
          summary.push(error.report);
        }
      })
    );
    return summary;
  }
}
