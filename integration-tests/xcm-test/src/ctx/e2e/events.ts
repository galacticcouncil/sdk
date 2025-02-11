import type {
  DispatchError,
  EventRecord,
} from '@polkadot/types/interfaces/system';
import type { AnyJson } from '@polkadot/types-codec/types';
import { ApiPromise } from '@polkadot/api';

import * as c from 'console';

import { findNestedKey } from '../../utils/json';

export function checkIfFailed(api: ApiPromise, events: EventRecord[]): boolean {
  return events.some(({ event: { method, section, data } }) => {
    if (section === 'system' && method === 'ExtrinsicFailed') {
      logError(api, data);
      return true;
    }
    return false;
  });
}

export function checkIfSent(events: EventRecord[]): boolean {
  return events.some(({ event: { method, section, data } }) => {
    switch (section) {
      case 'xcmpQueue':
        return method === 'XcmpMessageSent';
      case 'parachainSystem':
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
        return method === 'Processed' && checkProcessedStatus(eventData);
      case 'xcmpQueue':
        return method === 'Success';
      case 'dmpQueue':
        return method === 'ExecutedDownward';
      default:
        return false;
    }
  });
}

export function logEvents(events: EventRecord[]) {
  return events.some(({ event: { method, section, data } }) => {
    const eventData = data.toHuman();
    logEvent(section, method, eventData);
  });
}

function checkProcessedStatus(data: AnyJson): boolean {
  const dataEntry = findNestedKey(data, 'success');
  return dataEntry && dataEntry['success'] === true;
}

function logEvent(section: string, method: string, data: AnyJson) {
  process.env.LOG_LEVEL === 'info' &&
    c.log('🥢 Event: ' + section + '.' + method, data);
}

function logError(api: ApiPromise, data: any) {
  const { dispatchError } = data;
  const error = dispatchError as DispatchError;
  const decoded = api.registry.findMetaError(error.asModule);
  c.error(`🥢 ${decoded.section}.${decoded.method}: ${decoded.docs.join(' ')}`);
}
