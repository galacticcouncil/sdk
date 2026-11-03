import { h160 } from '@galacticcouncil/common';

import { toHex } from '@polkadot-api/utils';
import {
  connectInjectedExtension,
  getInjectedExtensions,
  InjectedPolkadotAccount,
} from 'polkadot-api/pjs-signer';

import { connectEvm, sendEvm, signSubstrate } from '../signers';
import { DISPATCH, DISPATCH_GAS, hydration, wrap } from '../dispatch/dispatch';
import {
  ayesNeeded,
  buildMotion,
  buildSuspend,
  check,
  isSeat,
  loadState,
  Motion,
  motionHash,
  MOTIONS,
  State,
  substrateCall,
  XcmCall,
} from './killswitch';

const { H160 } = h160;

const refreshBtn = document.getElementById('refresh') as HTMLButtonElement;
const evmBtn = document.getElementById('connect-evm') as HTMLButtonElement;
const substrateBtn = document.getElementById(
  'connect-substrate'
) as HTMLButtonElement;
const accountsEl = document.getElementById('accounts') as HTMLSelectElement;
const xcmEl = document.getElementById('xcm') as HTMLElement;
const walletEl = document.getElementById('wallet') as HTMLElement;
const callsEl = document.getElementById('calls') as HTMLElement;
const suspendBtn = document.getElementById('suspend') as HTMLButtonElement;
const motionsEl = document.getElementById('motions') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statusTitle = document.getElementById('status-title') as HTMLElement;
const statusLog = document.getElementById('status-log') as HTMLElement;

type Signer = {
  /** Signs through the dispatch precompile */
  evm: boolean;
  /** Address the wallet holds */
  address: string;
  /** Account it acts as on chain */
  account: string;
};

let state: State | undefined;
let signer: Signer | undefined;
let accounts: InjectedPolkadotAccount[] = [];

function setStatus(title: string, line?: string) {
  statusEl.hidden = false;
  statusTitle.textContent = title;
  if (line !== undefined) statusLog.textContent += line + '\n';
}

function setBusy(busy: boolean) {
  document
    .querySelectorAll('button, select')
    .forEach((b) => ((b as HTMLButtonElement).disabled = busy));
}

const events = {
  onSubmit: (hash: string) =>
    setStatus(
      'Submitting…',
      hydration.explorer + (signer?.evm ? '/tx/' : '/extrinsic/') + hash
    ),
  onConfirmed: (info: string) => setStatus('Included', info),
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

function row(term: string, value: Node) {
  const node = el('div', 'kv');
  node.append(el('span', 'kv-term', term), value);
  return node;
}

const line = (term: string, value: string) =>
  row(term, el('code', 'kv-value', value));

function badge(text: string, health: 'ok' | 'bad') {
  return el('span', 'badge is-' + health, text);
}

const side = (suspended: boolean) =>
  suspended ? badge('Suspended', 'bad') : badge('Active', 'ok');

async function submit(job: () => Promise<void>) {
  setBusy(true);
  try {
    await job();
  } catch (e) {
    events.onError(e);
  } finally {
    setBusy(false);
    render();
  }
}

/**
 * Sign as the connected seat.
 *
 * - Evm seats go through the dispatch precompile, wrapped: every switch is
 *   operational, and the precompile admits only normal calls
 * - Decoded back and shown before the wallet is asked
 */
async function sign(bytes: Uint8Array, call: XcmCall, motion: boolean) {
  if (!signer) {
    throw new Error('Connect a seat first.');
  }
  const payload = signer.evm ? wrap(bytes) : bytes;
  const decoded = await check(payload, call, motion);
  setStatus('Signing…', [decoded.label, decoded.args].join(' '));
  if (signer.evm) {
    await sendEvm(
      hydration,
      {
        from: signer.address,
        to: DISPATCH,
        data: toHex(payload),
        gas: DISPATCH_GAS,
      },
      events
    );
  } else {
    await signSubstrate(
      substrateCall(signer.address, payload),
      hydration,
      events
    );
  }
}

/**
 * Re-read the chain until `done` holds.
 *
 * - The state is the proof: a substrate tx reports included even when its
 *   call failed
 * - An evm receipt can land before this client sees its block
 */
async function settle(
  done: (s: State) => boolean,
  title: string,
  info: string
) {
  for (let attempt = 1; ; attempt++) {
    state = await loadState();
    if (done(state)) {
      setStatus(title, info);
      return;
    }
    if (attempt === 5) {
      throw new Error(
        'Not applied - the chain still shows the old state. Is the account a seat?'
      );
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
}

async function suspend() {
  const s = state ?? (state = await loadState());
  const sure = confirm(
    'Suspend ALL inbound and outbound XCM on Hydration?\n\n' +
      `Only a committee motion with ${ayesNeeded(s)} of ${s.seats.length} ayes can resume it.`
  );
  if (!sure) {
    return;
  }
  await sign(buildSuspend(), 'suspend_xcm', false);
  await settle(
    (s) => s.sendSuspended && s.executionSuspended,
    'XCM suspended',
    'Outbound and inbound XCM are suspended.'
  );
}

async function propose(call: XcmCall) {
  state = await loadState();
  await sign(buildMotion(call, ayesNeeded(state)), call, true);
  const hash = motionHash(call);
  await settle(
    (s) => s.motions.includes(hash),
    'Motion open',
    `Parameters.${call} is open as ${hash} - vote (the proposer too) and close it.`
  );
}

async function connectEvmSeat() {
  const address = await connectEvm(hydration);
  signer = { evm: true, address: address, account: H160.toAccount(address) };
  accounts = [];
  state = await loadState();
}

/** Every account the substrate extensions share, seats first. */
async function connectSubstrateSeat() {
  const names = getInjectedExtensions();
  if (!names.length) {
    throw new Error('No polkadot extension found - install one and reload.');
  }
  const connected = await Promise.allSettled(
    names.map((name) => connectInjectedExtension(name))
  );
  const s = (state = await loadState());
  accounts = connected
    .flatMap((r) => (r.status === 'fulfilled' ? r.value.getAccounts() : []))
    .sort(
      (a, b) => Number(isSeat(s, b.address)) - Number(isSeat(s, a.address))
    );
  if (!accounts.length) {
    throw new Error('The extensions share no accounts with this page.');
  }
  accountsEl.replaceChildren(
    ...accounts.map(
      (a) =>
        new Option(
          (a.name ?? 'Account') +
            ' · ' +
            a.address +
            (isSeat(s, a.address) ? ' · seat' : '')
        )
    )
  );
  pick(0);
}

function pick(index: number) {
  const { address } = accounts[index];
  signer = { evm: false, address: address, account: address };
}

/** A switch only a motion may throw: propose it, or show it is open. */
function motionRow(s: State, { call, label, applies, note }: Motion) {
  const item = el('div', 'motion');
  const text = el('div', 'motion-text');
  text.append(
    el('strong', undefined, label),
    el('code', 'mono', 'Parameters.' + call)
  );
  if (note) text.append(el('span', 'hint', note));
  item.append(text);
  if (s.motions.includes(motionHash(call))) {
    item.append(badge('Motion open', 'ok'));
  } else {
    const button = el('button', 'btn-ghost', 'Propose') as HTMLButtonElement;
    button.disabled = !signer || !applies(s);
    button.addEventListener('click', () => submit(() => propose(call)));
    item.append(button);
  }
  return item;
}

function render() {
  accountsEl.hidden = !accounts.length;
  suspendBtn.disabled = !signer;
  if (!state) {
    return;
  }
  const s = state;

  xcmEl.replaceChildren(
    row('Outbound', side(s.sendSuspended)),
    row('Inbound', side(s.executionSuspended)),
    line('At block', '#' + s.block)
  );

  if (signer) {
    const seat = isSeat(s, signer.account);
    const head = el('div', 'global-head');
    head.append(
      badge(seat ? 'Committee seat' : 'Not a seat', seat ? 'ok' : 'bad')
    );
    walletEl.replaceChildren(head, line('Wallet', signer.address));
    if (signer.evm) {
      walletEl.append(line('Acts as', signer.account));
    }
  } else {
    walletEl.replaceChildren(el('p', 'hint', 'Not connected.'));
  }

  motionsEl.replaceChildren(
    el(
      'p',
      'hint',
      `A motion passes with ${ayesNeeded(s)} of ${s.seats.length} ayes.`
    ),
    ...MOTIONS.map((m) => motionRow(s, m))
  );
}

const suspendCall = buildSuspend();
callsEl.replaceChildren(
  line('Substrate', toHex(suspendCall)),
  line('EVM', toHex(wrap(suspendCall)) + ' to ' + DISPATCH)
);

refreshBtn.addEventListener('click', () =>
  submit(async () => {
    state = await loadState();
  })
);
evmBtn.addEventListener('click', () => submit(connectEvmSeat));
substrateBtn.addEventListener('click', () => submit(connectSubstrateSeat));
accountsEl.addEventListener('change', () => {
  pick(accountsEl.selectedIndex);
  render();
});
suspendBtn.addEventListener('click', () => submit(suspend));

submit(async () => {
  state = await loadState();
});
