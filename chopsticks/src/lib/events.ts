import { type HydrationQueries } from '@galacticcouncil/descriptors';

export type EventRecord = HydrationQueries['System']['Events']['Value'][number];

type EvmLog = Extract<
  Extract<EventRecord['event'], { type: 'EVM' }>['value'],
  { type: 'Log' }
>['value']['log'];

/**
 * Exit reasons of every `Ethereum.Executed` in the block, in order.
 *
 * - The variant and its cause, e.g. `Succeed.Returned`, `Error.CreateContractLimit`
 */
export function getEthereumExits(events: EventRecord[]): string[] {
  return events.flatMap(({ event }) => {
    if (event.type !== 'Ethereum' || event.value.type !== 'Executed') {
      return [];
    }
    const exit = event.value.value.exit_reason as {
      type: string;
      value?: { type?: string };
    };
    return [exit.value?.type ? exit.type + '.' + exit.value.type : exit.type];
  });
}

/** Every `EVM.Log` with the given `topic0`, narrowed to one emitting contract when given. */
export function findEvmLogs(
  events: EventRecord[],
  topic0: string,
  address?: string
): EvmLog[] {
  return events.flatMap(({ event }) => {
    if (event.type !== 'EVM' || event.value.type !== 'Log') {
      return [];
    }
    const { log } = event.value.value;
    if (log.topics[0] !== topic0) {
      return [];
    }
    if (
      address &&
      String(log.address).toLowerCase() !== address.toLowerCase()
    ) {
      return [];
    }
    return [log];
  });
}
