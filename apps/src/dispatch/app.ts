import { toHex } from '@polkadot-api/utils';
import { h160 } from '@galacticcouncil/common';

import { connectEvm, sendEvm } from '../signers';
import {
  buildCall,
  describe,
  DISPATCH,
  DISPATCH_GAS,
  hydration,
  previewCall,
} from './dispatch';

const { H160 } = h160;

const connectBtn = document.getElementById('connect') as HTMLButtonElement;
const walletEl = document.getElementById('wallet') as HTMLElement;
const calldataEl = document.getElementById('calldata') as HTMLTextAreaElement;
const gasEl = document.getElementById('gas') as HTMLInputElement;
const wrapEl = document.getElementById('wrap') as HTMLInputElement;
const decodeBtn = document.getElementById('decode') as HTMLButtonElement;
const dispatchBtn = document.getElementById('dispatch') as HTMLButtonElement;
const previewEl = document.getElementById('preview') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statusTitle = document.getElementById('status-title') as HTMLElement;
const statusLog = document.getElementById('status-log') as HTMLElement;

let address: string | undefined;

gasEl.value = DISPATCH_GAS.toString();

function setStatus(title: string, line?: string) {
  statusEl.hidden = false;
  statusTitle.textContent = title;
  if (line !== undefined) statusLog.textContent += line + '\n';
}

function setBusy(busy: boolean) {
  document
    .querySelectorAll('button')
    .forEach((b) => ((b as HTMLButtonElement).disabled = busy));
}

const events = {
  onSubmit: (hash: string) =>
    setStatus('Submitting…', 'Tx: ' + hydration.explorer + '/tx/' + hash),
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

function renderWallet() {
  if (!address) {
    walletEl.replaceChildren(el('p', 'hint', 'Not connected.'));
    return;
  }
  walletEl.replaceChildren(
    line('Wallet', address),
    line('Acts as', H160.toAccount(address))
  );
}

async function preview() {
  const calldata = calldataEl.value.trim();
  if (!calldata) {
    previewEl.replaceChildren();
    return;
  }
  previewEl.replaceChildren(el('p', 'hint', 'Decoding…'));
  try {
    const d = await previewCall(calldata);
    const rows = [line('Call', d.label), line('Args', d.args)];
    if (d.propose) {
      rows.push(
        line('Threshold', String(d.propose.threshold)),
        line('Length bound', String(d.propose.lengthBound)),
        line(
          'Proposal',
          d.propose.proposal +
            (d.propose.calls !== null ? ` (${d.propose.calls} calls)` : '')
        ),
        line('Proposal hash', d.propose.proposalHash)
      );
    }
    previewEl.replaceChildren(...rows);
  } catch (e) {
    previewEl.replaceChildren(
      el('p', 'hint', e instanceof Error ? e.message : String(e))
    );
  }
}

/** Sign the pasted call after decoding it back and showing what it is. */
async function dispatch() {
  if (!address) {
    throw new Error('Connect the wallet first.');
  }
  const bytes = buildCall(calldataEl.value, wrapEl.checked);
  const decoded = await describe(bytes);
  setStatus('Signing…', decoded.label + ' ' + decoded.args);
  await sendEvm(
    hydration,
    {
      from: address,
      to: DISPATCH,
      data: toHex(bytes),
      gas: BigInt(gasEl.value || DISPATCH_GAS.toString()),
    },
    events
  );
}

connectBtn.addEventListener('click', () =>
  submit(async () => {
    address = await connectEvm(hydration);
    renderWallet();
  })
);
decodeBtn.addEventListener('click', () => submit(preview));
dispatchBtn.addEventListener('click', () => submit(dispatch));

renderWallet();
