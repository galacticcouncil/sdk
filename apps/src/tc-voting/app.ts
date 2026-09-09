import { toHex } from '@polkadot-api/utils';

import { connectEvm, sendEvm } from '../signers';
import { describe, DISPATCH, hydration } from '../dispatch/dispatch';
import {
  buildClose,
  buildVote,
  currentBlock,
  Gas,
  hasVoted,
  loadProposals,
  Member,
  memberOf,
  Proposal,
} from './tc-voting';

const connectBtn = document.getElementById('connect') as HTMLButtonElement;
const refreshBtn = document.getElementById('refresh') as HTMLButtonElement;
const walletEl = document.getElementById('wallet') as HTMLElement;
const proposalsEl = document.getElementById('proposals') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statusTitle = document.getElementById('status-title') as HTMLElement;
const statusLog = document.getElementById('status-log') as HTMLElement;

let member: Member | undefined;
let proposals: Proposal[] = [];
let block = 0;

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

function badge(text: string, health: 'ok' | 'warn' | 'bad' | 'none') {
  return el('span', 'badge is-' + health, text);
}

async function submit(job: () => Promise<void>) {
  setBusy(true);
  try {
    await job();
  } catch (e) {
    events.onError(e);
  } finally {
    setBusy(false);
    renderProposals();
  }
}

/** Sign a call after decoding it back and showing what it is. */
async function dispatch(
  bytes: Uint8Array,
  gas: bigint,
  expected?: 'vote' | 'close'
) {
  if (!member) {
    throw new Error('Connect the wallet first.');
  }
  const decoded = await describe(bytes, expected);
  setStatus('Signing…', decoded.label + ' ' + decoded.args);
  await sendEvm(
    hydration,
    { from: member.address, to: DISPATCH, data: toHex(bytes), gas },
    events
  );
}

function renderWallet() {
  if (!member) {
    walletEl.replaceChildren(
      el('p', 'hint', 'Not connected. The seat is an EVM account.')
    );
    return;
  }
  const head = el('div', 'global-head');
  head.append(
    badge(
      member.isMember ? 'Committee member' : 'Not a member',
      member.isMember ? 'ok' : 'bad'
    )
  );
  walletEl.replaceChildren(
    head,
    line('Wallet', member.address),
    line('Acts as', member.account)
  );
}

function renderProposals() {
  if (!proposals.length) {
    proposalsEl.replaceChildren(el('p', 'hint', 'No open proposals.'));
    return;
  }

  proposalsEl.replaceChildren(
    ...proposals.map((p) => {
      const card = el('div', 'proposal');
      const head = el('div', 'proposal-head');
      head.append(
        el('strong', undefined, '#' + p.index),
        el('span', 'mono', p.label)
      );
      const voted = member && hasVoted(p, member);
      if (voted) head.append(badge('You voted', 'ok'));
      card.append(head);
      card.append(line('Hash', p.hash));
      card.append(
        line(
          'Tally',
          `aye ${p.ayes.length} · nay ${p.nays.length} · threshold ${p.threshold} · ends #${p.end}`
        )
      );

      const closable = p.ayes.length >= p.threshold || block > p.end;
      const actions = el('div', 'actions');
      const aye = el('button', 'btn-primary', 'Aye') as HTMLButtonElement;
      const nay = el('button', 'btn-ghost', 'Nay') as HTMLButtonElement;
      const close = el('button', 'btn-ghost', 'Close') as HTMLButtonElement;
      close.disabled = !closable;
      close.title = closable
        ? 'Execute or reject now that the vote is decided'
        : 'Threshold not reached and the voting period is still open';
      aye.addEventListener('click', () =>
        submit(() => dispatch(buildVote(p, true), Gas.vote, 'vote'))
      );
      nay.addEventListener('click', () =>
        submit(() => dispatch(buildVote(p, false), Gas.vote, 'vote'))
      );
      close.addEventListener('click', () =>
        submit(() => dispatch(buildClose(p), Gas.close, 'close'))
      );
      actions.append(aye, nay, close);
      card.append(actions);
      return card;
    })
  );
}

async function refresh() {
  proposalsEl.replaceChildren(el('p', 'hint', 'Loading…'));
  [proposals, block] = await Promise.all([loadProposals(), currentBlock()]);
  if (member) {
    member = await memberOf(member.address);
  }
  renderWallet();
  renderProposals();
}

connectBtn.addEventListener('click', () =>
  submit(async () => {
    const address = await connectEvm(hydration);
    member = await memberOf(address);
    renderWallet();
  })
);
refreshBtn.addEventListener('click', () => submit(refresh));
submit(refresh);
