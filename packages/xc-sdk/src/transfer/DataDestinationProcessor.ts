import { DataProcessor } from './DataProcessor';

/**
 * Resolves destination-side transfer data (received balance, minimum,
 * existential deposit) directly from the destination chain.
 *
 * Thin {@link DataProcessor} — its `(chain, asset)` are supplied directly so
 * one-way routes resolve destination data without a reverse `TransferConfig`.
 */
export class DataDestinationProcessor extends DataProcessor {}
