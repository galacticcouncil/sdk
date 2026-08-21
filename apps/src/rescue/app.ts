import { signSubstrate } from '../signers';
import {
  fmt,
  fundGas,
  GAS_ASSET,
  hydration,
  meta,
  scan,
  Scan,
  stranded,
  sweep,
} from './rescue';

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
  const gas = state.held.find((h) => h.id === GAS_ASSET);
  if (gas && gas.free >= state.gasCost) {
    return;
  }

  const card = el('div', 'notice');
  card.append(
    el(
      'p',
      undefined,
      `The phantom account pays its own gas, in WETH, and holds ` +
        `${fmt(gas?.free ?? 0n, 18)} of the ${fmt(state.gasCost, 18)} a ` +
        `sweep costs. Top it up first.`
    )
  );

  const input = el('input') as HTMLInputElement;
  input.type = 'text';
  input.value = fmt(state.gasCost * 2n, 18);

  const button = el('button', 'btn-secondary', 'Send WETH');
  button.addEventListener('click', () =>
    submit(async () => {
      const amount = BigInt(Math.round(Number(input.value) * 1e18));
      setStatus('Funding…', input.value + ' WETH');
      await signSubstrate(await fundGas(owner, amount), hydration, events);
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

  state.held.forEach(({ id, free }) => {
    const { symbol, decimals } = meta(id);

    // Gas is charged in WETH, upfront, out of this same balance - sweeping
    // all of it leaves the transfer short by exactly the fee and the whole
    // call reverts. Reserve it, which also strands that much for good.
    const amount = id === GAS_ASSET ? free - state.gasCost : free;
    if (amount <= 0n) {
      card.append(
        el(
          'p',
          'hint',
          `${symbol} covers little more than the gas it would cost to move ` +
            `it - nothing to sweep.`
        )
      );
      return;
    }

    const button = el(
      'button',
      'btn-primary',
      `Sweep ${fmt(amount, decimals)} ${symbol}`
    );
    button.addEventListener('click', () =>
      submit(async () => {
        setStatus('Sweeping…', `${fmt(amount, decimals)} ${symbol} → ${owner}`);
        await signSubstrate(await sweep(owner, id, amount), hydration, events);
      })
    );
    card.append(button);
  });

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

async function run(owner: string) {
  resultEl.replaceChildren();
  statusEl.hidden = true;
  statusLog.textContent = '';

  const state = await scan(owner);

  const summary = el('div', 'card');
  summary.append(el('h2', undefined, 'Phantom account'));
  summary.append(line('EVM address', state.h160));
  summary.append(line('Holds funds as', state.account));
  summary.append(line('Bound', state.bound ? 'yes' : 'no'));

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
