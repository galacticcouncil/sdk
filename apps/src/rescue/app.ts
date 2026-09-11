import { h160 } from '@galacticcouncil/common';

import { signSubstrate } from '../signers';
import {
  fmt,
  fundGas,
  hydration,
  meta,
  scan,
  Scan,
  stranded,
  sweep,
} from './rescue';

const { isEvmAddress } = h160;

const form = document.getElementById('scan-form') as HTMLFormElement;
const addressEl = document.getElementById('address') as HTMLInputElement;
const scanBtn = document.getElementById('submit') as HTMLButtonElement;
const resultEl = document.getElementById('result') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statusTitle = document.getElementById('status-title') as HTMLElement;
const statusLog = document.getElementById('status-log') as HTMLElement;

function setStatus(title: string, line?: string) {
  statusEl.hidden = false;
  statusTitle.textContent = title;
  if (line !== undefined) statusLog.textContent += line + '\n';
}

function setBusy(busy: boolean) {
  scanBtn.disabled = busy;
  scanBtn.classList.toggle('is-busy', busy);
  resultEl
    .querySelectorAll('button')
    .forEach((b) => ((b as HTMLButtonElement).disabled = busy));
}

const events = {
  onSubmit: (hash: string) => setStatus('Submitting…', 'Tx: ' + hash),
  onConfirmed: (info: string) => setStatus('Confirmed', info),
  onError: (e: unknown) =>
    setStatus('Failed', e instanceof Error ? e.message : String(e)),
  onInfo: (line: string) => setStatus('Retrying…', line),
};

function el(tag: string, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function line(term: string, value: string) {
  const row = el('div', 'kv');
  row.append(el('span', 'kv-term', term), el('code', 'kv-value', value));
  return row;
}

async function submit(job: () => Promise<void>) {
  setBusy(true);
  try {
    await job();
  } catch (e) {
    events.onError(e);
  } finally {
    setBusy(false);
  }
}

function renderGas(owner: string, state: Scan) {
  const failing = state.held.filter((h) => !h.ok);
  if (!failing.length) {
    return;
  }

  const { symbol, decimals } = meta(state.feeAsset);
  const card = el('div', 'notice');
  card.append(
    el(
      'p',
      undefined,
      `The phantom account pays its own gas in ${symbol}. ` +
        `${failing.length} of ${state.held.length} sweeps would fail right ` +
        `now - most often because it cannot cover the gas. Top it up, then ` +
        `scan again.`
    )
  );
  failing.forEach(({ id, reason }) =>
    card.append(el('p', 'hint', `${meta(id).symbol}: ${reason}`))
  );

  const input = el('input') as HTMLInputElement;
  input.type = 'text';
  input.placeholder = `${symbol} amount`;

  const button = el('button', 'btn-secondary', `Send ${symbol}`);
  button.addEventListener('click', () =>
    submit(async () => {
      const amount = BigInt(Math.round(Number(input.value) * 10 ** decimals));
      if (amount <= 0n) {
        throw new Error('Enter an amount.');
      }
      setStatus('Funding…', `${input.value} ${symbol}`);
      await signSubstrate(
        await fundGas(owner, state.feeAsset, amount),
        hydration,
        events
      );
      await refresh(owner);
    })
  );

  const row = el('div', 'inline');
  row.append(input, button);
  card.append(row);
  resultEl.append(card);
}

function renderSweeps(owner: string, state: Scan) {
  const card = el('div', 'card');
  card.append(el('h2', undefined, 'Sweep'));
  card.append(
    el(
      'p',
      'lede',
      'One way. Sweeping gives the address a non-zero nonce, which bars ' +
        'bind_evm_address permanently - this account will keep receiving ' +
        'into the phantom and keep needing this.'
    )
  );

  // The fee asset goes last: every other sweep is paid out of it, and its
  // own sweep leaves only the gas refund behind.
  const ordered = [...state.held].sort(
    (a, b) => Number(a.id === state.feeAsset) - Number(b.id === state.feeAsset)
  );

  ordered.forEach(({ id, free, ok }) => {
    const { symbol, decimals } = meta(id);
    const isFeeAsset = id === state.feeAsset;

    // `transfer_all` moves whatever is free once gas is withdrawn, so the
    // fee asset lands short of `free` by the charge - the label says so.
    const button = el(
      'button',
      'btn-primary',
      `Sweep all ${symbol} (${fmt(free, decimals)}` +
        (isFeeAsset ? ' less gas - sweep last)' : ')')
    ) as HTMLButtonElement;
    button.disabled = !ok;
    button.addEventListener('click', () =>
      submit(async () => {
        setStatus('Sweeping…', `${symbol} → ${owner}`);
        await signSubstrate(await sweep(owner, id), hydration, events);
        await refresh(owner);
      })
    );
    card.append(button);
  });

  resultEl.append(card);
}

function renderEvmOwner() {
  const card = el('div', 'notice');
  card.append(
    el(
      'p',
      undefined,
      'This is an evm address. Its account above is the one it already ' +
        'controls - anything sent to the address is spendable from the ' +
        'evm wallet directly, nothing is stranded. Phantom rescue is for a ' +
        'substrate account whose deposits landed on its truncated address: ' +
        'scan with that substrate address instead.'
    )
  );
  resultEl.append(card);
}

function renderBound() {
  const card = el('div', 'notice notice-danger');
  card.append(
    el(
      'p',
      undefined,
      'This address is bound, so it resolves to itself rather than to the ' +
        'phantom account. Nothing can address the phantom any more and its ' +
        'account id has no key to sign with - whatever it holds is ' +
        'unrecoverable. Sweeping is disabled: it would move this account’s ' +
        'own balance instead.'
    )
  );
  resultEl.append(card);
}

/**
 * Re-scan after a confirmed transaction, keeping the status log.
 *
 * Verdicts are per scan: sweeping the fee asset clears the phantom's fee
 * currency, so what the other buttons promised may no longer hold.
 */
async function refresh(owner: string) {
  setStatus('Rescanning…');
  resultEl.replaceChildren();
  await render(owner);
}

async function run(owner: string) {
  resultEl.replaceChildren();
  statusEl.hidden = true;
  statusLog.textContent = '';
  await render(owner);
}

async function render(owner: string) {
  const state = await scan(owner);

  const summary = el('div', 'card');
  summary.append(el('h2', undefined, 'Phantom account'));
  summary.append(line('EVM address', state.h160));
  summary.append(line('Holds funds as', state.account));
  summary.append(line('Bound', state.bound ? 'yes' : 'no'));
  summary.append(line('Pays gas in', meta(state.feeAsset).symbol));

  if (!state.held.length) {
    summary.append(
      el('p', 'lede', 'Holds nothing - there is nothing to rescue here.')
    );
    resultEl.append(summary);
    return;
  }

  state.held.forEach(({ id, free }) => {
    const { symbol, decimals } = meta(id);
    summary.append(line(symbol, fmt(free, decimals)));
  });
  resultEl.append(summary);

  if (state.bound) {
    renderBound();
    return;
  }

  if (isEvmAddress(owner)) {
    renderEvmOwner();
    return;
  }

  renderGas(owner, state);
  renderSweeps(owner, state);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const owner = addressEl.value.trim();
  if (!owner) return;

  // Reject anything that isn't an address before touching the chain.
  try {
    stranded(owner);
  } catch {
    setStatus('Failed', 'Not a valid substrate or evm address.');
    return;
  }

  submit(() => run(owner));
});
