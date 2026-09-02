import { AnyChain, Wormhole } from '@galacticcouncil/xc-core';

import {
  RelayStatus,
  type StatusResponse,
} from '@wormhole-foundation/sdk-definitions';

const EXECUTOR_API = 'https://executor.labsapis.com';

// Pending is the only non-final state - Submitted means the relay landed,
// the rest are failures. `Underpaid` is the one to watch when tuning
// EXECUTOR_GAS_LIMIT: the quote budgeted less than the redeem cost.
const isTerminal = (status: string): boolean =>
  status !== RelayStatus.Pending &&
  Object.values(RelayStatus).includes(status as RelayStatus);

/**
 * Executor delivery status for a source transaction.
 *
 * Note this is POST, not GET - a GET on the same path 404s. Hand-rolled
 * rather than `fetchStatus`, which throws away the status code and with it
 * the not-indexed-yet case.
 */
export async function getStatus(
  chain: AnyChain,
  txHash: string
): Promise<StatusResponse[] | undefined> {
  const chainId = Wormhole.fromChain(chain).getWormholeId();

  const res = await fetch(EXECUTOR_API + '/v0/status/tx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainId, txHash }),
  });

  // Not indexed yet - the executor only knows the tx once it has seen it.
  if (res.status === 404) {
    return undefined;
  }
  if (!res.ok) {
    throw new Error('Executor status failed [' + res.status + ']');
  }
  return res.json();
}

/**
 * Poll until the executor reports a terminal relay state.
 *
 * This is the half of an executor transfer the source call can't prove: the
 * shim accepting the signed quote says nothing about whether the relayer
 * actually redeemed on the far side.
 */
export async function waitForDelivery(
  chain: AnyChain,
  txHash: string,
  log: (...args: unknown[]) => void,
  { attempts = 40, intervalMs = 15_000 } = {}
): Promise<StatusResponse | undefined> {
  for (let i = 1; i <= attempts; i++) {
    let payload: StatusResponse[] | undefined;
    try {
      payload = await getStatus(chain, txHash);
    } catch (e) {
      log('  status error:', e instanceof Error ? e.message : String(e));
    }

    const entry = payload?.[0];
    if (entry) {
      log('  [' + i + '/' + attempts + ']', entry.status);
      if (isTerminal(entry.status)) {
        return entry;
      }
    } else {
      log('  [' + i + '/' + attempts + '] not indexed yet');
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  log('  gave up waiting - poll manually with ntt.status(chain, txHash)');
  return undefined;
}
