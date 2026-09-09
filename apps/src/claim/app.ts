import {
  AnyEvmChain,
  CallType,
  EvmParachain,
  SolanaChain,
} from '@galacticcouncil/xc-core';
import { Call, EvmCall } from '@galacticcouncil/xc-sdk';

import {
  sendForced,
  signEvm,
  signSolanaAll,
  signSubstrate,
  signSui,
} from '../signers';
import { buildClaim, isValidPayer, NttClaim, readVaa, simulate } from './claim';

const form = document.getElementById('claim-form') as HTMLFormElement;
const vaaEl = document.getElementById('vaa') as HTMLTextAreaElement;
const readBtn = document.getElementById('submit') as HTMLButtonElement;
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
  readBtn.disabled = busy;
  readBtn.classList.toggle('is-busy', busy);
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

/** Sign whatever the claim built, on the chain it targets. */
async function send(claim: NttClaim, calls: Call | Call[], force: boolean) {
  const { chain } = claim;

  // Solana posts the vaa to the core bridge before the manager can release,
  // so it is several transactions - bundled, since a partial run leaves the
  // claim half done.
  if (chain instanceof SolanaChain) {
    const bundle = Array.isArray(calls) ? calls : [calls];
    setStatus('Signing…', bundle.length + ' txs as one bundle');
    return signSolanaAll(bundle, chain, events);
  }

  const call = Array.isArray(calls) ? calls[0] : calls;
  if (call.type === CallType.Sui) {
    setStatus('Signing…', '1 ptb');
    return signSui(call, chain, events);
  }
  if (call.type === CallType.Substrate) {
    setStatus('Signing…', 'EVM.call dispatch');
    return signSubstrate(call, chain as EvmParachain, events);
  }

  const evm = call as EvmCall;
  const reason = await simulate(evm, chain as AnyEvmChain);
  if (reason && !force) {
    throw new Error('Reverts: ' + reason);
  }
  if (reason) {
    setStatus('Forcing…', 'Reverts: ' + reason);
    setStatus('Forcing…', 'Sending anyway - spends gas, mints nothing.');
    return sendForced(evm, chain as AnyEvmChain, events);
  }
  setStatus('Signing…', 'receiveMessage on ' + evm.to);
  return signEvm(evm, chain as AnyEvmChain, events);
}

function renderClaim(claim: NttClaim) {
  const { chain } = claim;

  const summary = el('div', 'card');
  summary.append(el('h2', undefined, 'Transfer'));
  summary.append(line('Message', claim.id));
  summary.append(line('Destination', chain.name));
  summary.append(line('Recipient', claim.recipient));
  summary.append(line('Amount', claim.amount));
  summary.append(line('Manager', claim.ntt.manager));
  resultEl.append(summary);

  const card = el('div', 'card');
  card.append(el('h2', undefined, 'Claim'));
  card.append(
    el(
      'p',
      'lede',
      'Relaying is permissionless - the recipient is whoever the message ' +
        'names, the payer is whoever signs on ' +
        chain.name +
        '.'
    )
  );

  const field = el('label', 'field');
  field.append(el('span', 'label', 'Payer'));
  const payerEl = el('input') as HTMLInputElement;
  payerEl.type = 'text';
  payerEl.autocomplete = 'off';
  payerEl.spellcheck = false;
  payerEl.placeholder = chain.isEvmParachain()
    ? '0x… (EVM) or 7… / 5… (substrate)'
    : 'Address on ' + chain.name;
  field.append(payerEl);
  field.append(
    el('span', 'hint', 'Pays the gas. You have to be able to sign with it.')
  );
  card.append(field);

  let forceEl: HTMLInputElement | undefined;
  if (chain.isEvmChain() || chain.isEvmParachain()) {
    const force = el('label', 'field');
    forceEl = el('input') as HTMLInputElement;
    forceEl.type = 'checkbox';
    force.append(
      forceEl,
      el(
        'span',
        'hint',
        'Send even when the simulation reverts - spends gas, mints nothing, leaves the vaa replayable.'
      )
    );
    card.append(force);
  }

  const button = el('button', 'btn-primary', 'Claim');
  button.addEventListener('click', () =>
    submit(async () => {
      const payer = payerEl.value.trim();
      if (!isValidPayer(chain, payer)) {
        throw new Error('Not a valid payer address for ' + chain.name + '.');
      }
      setStatus('Building…', claim.amount + ' → ' + claim.recipient);
      const calls = await buildClaim(claim, payer);
      await send(claim, calls, !!forceEl?.checked);
      setStatus('Claimed', claim.id);
    })
  );
  card.append(button);
  resultEl.append(card);
}

async function run(input: string) {
  resultEl.replaceChildren();
  statusEl.hidden = true;
  statusLog.textContent = '';

  const claim = await readVaa(input);
  renderClaim(claim);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = vaaEl.value.trim();
  if (!input) return;
  submit(() => run(input));
});
