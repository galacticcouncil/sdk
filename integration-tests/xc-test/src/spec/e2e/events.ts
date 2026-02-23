import * as c from 'console';

type PapiEventRecord = {
  phase: any;
  event: {
    type: string;
    value: any;
  };
  topics: any[];
};

export function checkIfFailed(events: PapiEventRecord[]): boolean {
  return events.some(({ event }) => {
    if (event.type === 'System' && event.value?.type === 'ExtrinsicFailed') {
      c.error('🥢 ExtrinsicFailed:', JSON.stringify(event.value, replacer, 0));
      return true;
    }
    return false;
  });
}

export function checkIfProcessed(events: PapiEventRecord[]): boolean {
  return events.some(({ event }) => {
    switch (event.type) {
      case 'MessageQueue':
        return event.value?.type === 'Processed' && event.value?.value?.success === true;
      case 'XcmpQueue':
        return event.value?.type === 'Success';
      case 'DmpQueue':
        return event.value?.type === 'ExecutedDownward';
      default:
        return false;
    }
  });
}

export function getDepositedAmount(
  events: PapiEventRecord[],
  recipient: string
): bigint {
  let total = 0n;
  for (const { event } of events) {
    const isDeposit =
      (event.type === 'Tokens' || event.type === 'Balances') &&
      event.value?.type === 'Deposited';
    const isTransfer =
      event.type === 'Balances' && event.value?.type === 'Transfer';

    if (isDeposit && event.value?.value?.who === recipient) {
      total += BigInt(event.value.value.amount);
    } else if (isTransfer && event.value?.value?.to === recipient) {
      total += BigInt(event.value.value.amount);
    }
  }
  return total;
}

export function logEvents(events: PapiEventRecord[]) {
  for (const { event } of events) {
    c.log('🥢 Event:', JSON.stringify(event, replacer, 0));
  }
}

const replacer = (_key: string, value: any) => {
  return typeof value === 'bigint' ? value.toString() : value;
};
