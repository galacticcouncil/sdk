import { toHex } from '@polkadot-api/utils';

import { connectEvm, sendEvm } from '../signers';
import {
  buildClose,
  buildPropose,
  buildVote,
  currentBlock,
  decodePropose,
  describe,
  DISPATCH,
  Gas,
  hasVoted,
  hydration,
  loadProposals,
  Member,
  memberOf,
  Proposal,
} from './tc-voting';

const connectBtn = document.getElementById('connect') as HTMLButtonElement;
const refreshBtn = document.getElementById('refresh') as HTMLButtonElement;
const walletEl = document.getElementById('wallet') as HTMLElement;
const proposalsEl = document.getElementById('proposals') as HTMLElement;
const calldataEl = document.getElementById('calldata') as HTMLTextAreaElement;
const gasEl = document.getElementById('gas') as HTMLInputElement;
const decodeBtn = document.getElementById('decode') as HTMLButtonElement;
const proposeBtn = document.getElementById('propose') as HTMLButtonElement;
const previewEl = document.getElementById('preview') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statusTitle = document.getElementById('status-title') as HTMLElement;
const statusLog = document.getElementById('status-log') as HTMLElement;

let member: Member | undefined;
let proposals: Proposal[] = [];
let block = 0;

gasEl.value = Gas.propose.toString();

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

/** Sign a wrapped call after decoding it back and showing what it is. */
async function dispatch(
  wrapped: Uint8Array,
  expected: 'vote' | 'close' | 'propose',
  gas: bigint
) {
  if (!member) {
    throw new Error('Connect the wallet first.');
  }
  const decoded = await describe(wrapped, expected);
  setStatus('Signing…', decoded.label + ' ' + decoded.args);
  await sendEvm(
    hydration,
    { from: member.address, to: DISPATCH, data: toHex(wrapped), gas },
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
        submit(() => dispatch(buildVote(p, true), 'vote', Gas.vote))
      );
      nay.addEventListener('click', () =>
        submit(() => dispatch(buildVote(p, false), 'vote', Gas.vote))
      );
      close.addEventListener('click', () =>
        submit(() => dispatch(buildClose(p), 'close', Gas.close))
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

async function preview() {
  const calldata = calldataEl.value.trim();
  if (!calldata) {
    previewEl.replaceChildren();
    return;
  }
  previewEl.replaceChildren(el('p', 'hint', 'Decoding…'));
  try {
    const d = await decodePropose(calldata);
    previewEl.replaceChildren(
      line('Call', 'TechnicalCommittee.propose'),
      line('Threshold', String(d.threshold)),
      line('Length bound', String(d.lengthBound)),
      line(
        'Proposal',
        d.label + (d.calls !== null ? ` (${d.calls} calls)` : '')
      ),
      line('Proposal hash', d.proposalHash)
    );
  } catch (e) {
    previewEl.replaceChildren(
      el('p', 'hint', e instanceof Error ? e.message : String(e))
    );
  }
}

connectBtn.addEventListener('click', () =>
  submit(async () => {
    const address = await connectEvm(hydration);
    member = await memberOf(address);
    renderWallet();
  })
);
refreshBtn.addEventListener('click', () => submit(refresh));
decodeBtn.addEventListener('click', () => submit(preview));
proposeBtn.addEventListener('click', () =>
  submit(() =>
    dispatch(
      buildPropose(calldataEl.value),
      'propose',
      BigInt(gasEl.value || Gas.propose.toString())
    )
  )
);

submit(refresh);
