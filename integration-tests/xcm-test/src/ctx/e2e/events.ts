import type {
  DispatchError,
  EventRecord,
} from '@polkadot/types/interfaces/system';
import type { AnyJson } from '@polkadot/types-codec/types';
import { ApiPromise } from '@polkadot/api';

import { findNestedKey } from '../../utils/json';

export function checkIfFailed(api: ApiPromise, events: EventRecord[]): boolean {
  return events.some(({ event: { method, section, data } }) => {
    const eventData = data.toHuman();
    if (section === 'system' && method === 'ExtrinsicFailed') {
      logEvent(section, method, eventData);
      logError(api, data);
      return true;
    }
    return false;
  });
}

export function checkIfSent(events: EventRecord[]): boolean {
  return events.some(({ event: { method, section, data } }) => {
    const eventData = data.toHuman();
    switch (section) {
      case 'xcmpQueue':
        logEvent(section, method, eventData);
        return method === 'XcmpMessageSent';
      case 'parachainSystem':
        logEvent(section, method, eventData);
        return method === 'UpwardMessageSent';
      default:
        return false;
    }
  });
}

export function checkIfProcessed(events: EventRecord[]): boolean {
  return events.some(({ event: { method, section, data } }) => {
    const eventData = data.toHuman();
    switch (section) {
      case 'messageQueue':
        logEvent(section, method, eventData);
        return method === 'Processed' && checkProcessedStatus(eventData);
      case 'xcmpQueue':
        logEvent(section, method, eventData);
        return method === 'Success';
      case 'dmpQueue':
        logEvent(section, method, eventData);
        return method === 'ExecutedDownward';
      default:
        return false;
    }
  });
}

function checkProcessedStatus(data: AnyJson): boolean {
  const dataEntry = findNestedKey(data, 'success');
  return dataEntry && dataEntry['success'] === true;
}

function logEvent(section: string, method: string, data: AnyJson) {
  console.log('🥢 Event: ' + section + '.' + method, data);
}

function logError(api: ApiPromise, data: any) {
  const { dispatchError } = data;
  const error = dispatchError as DispatchError;
  const decoded = api.registry.findMetaError(error.asModule);
  console.error(
    `🥢 ${decoded.section}.${decoded.method}: ${decoded.docs.join(' ')}`
  );
}
