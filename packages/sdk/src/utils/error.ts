import { ApiPromise } from '@polkadot/api';
import { DispatchError } from '@polkadot/types/interfaces';

export function humanizeError(
  api: ApiPromise,
  dispatchError: DispatchError
): string | undefined {
  const { error } = dispatchError as any;

  if (!error.isModule) {
    return JSON.stringify(error.toHuman());
  }

  const decoded = api.registry.findMetaError(error.asModule);
  return `${decoded.section}.${decoded.method}: ${decoded.docs.join(' ')}`;
}
