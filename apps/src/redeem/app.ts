import { signEvm, signSolanaBundle, signSui } from '../signers';
import { redeem, base, ethereum, moonbeam, solana, sui } from './redeem';
import { ChainKey, HINTS, PLACEHOLDERS, validateAddress } from './validate';

const form = document.getElementById('redeem-form') as HTMLFormElement;
const chainEl = document.getElementById('chain') as HTMLSelectElement;
const addressEl = document.getElementById('address') as HTMLInputElement;
const vaaEl = document.getElementById('vaa') as HTMLTextAreaElement;
const submitBtn = document.getElementById('submit') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLElement;
const statusTitle = document.getElementById('status-title') as HTMLElement;
const statusLog = document.getElementById('status-log') as HTMLElement;
const addressHint = document.getElementById('address-hint') as HTMLElement;

function setStatus(title: string, line?: string) {
  statusEl.hidden = false;
  statusTitle.textContent = title;
  if (line !== undefined) statusLog.textContent += line + '\n';
}

function resetStatus() {
  statusEl.hidden = true;
  statusLog.textContent = '';
}

function setBusy(busy: boolean) {
  submitBtn.disabled = busy;
  submitBtn.classList.toggle('is-busy', busy);
}

chainEl.addEventListener('change', () => {
  const key = chainEl.value as ChainKey;
  if (PLACEHOLDERS[key]) {
    addressEl.placeholder = PLACEHOLDERS[key];
    addressHint.textContent = HINTS[key];
  }
});

async function submit(chain: ChainKey, address: string, vaa: string) {
  const events = {
    onSubmit: (id: string) => setStatus('Submitting…', 'Id: ' + id),
    onConfirmed: (info: string) => setStatus('Confirmed', info),
    onStatus: (info: string) => setStatus('Status', info),
    onError: (e: unknown) =>
      setStatus('Failed', e instanceof Error ? e.message : String(e)),
  };

  switch (chain) {
    case 'eth':
      return signEvm(redeem.eth(address, vaa), ethereum, events);
    case 'base':
      return signEvm(redeem.base(address, vaa), base, events);
    case 'mrl':
      return signEvm(redeem.mrl(address, vaa), moonbeam, events);
    case 'sol':
      return signSolanaBundle(await redeem.sol(address, vaa), solana, events);
    case 'sui':
      return signSui(await redeem.sui(address, vaa), sui, events);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resetStatus();

  const chain = chainEl.value as ChainKey;
  const address = addressEl.value.trim();
  const vaa = vaaEl.value.trim();

  if (!chain) return setStatus('Pick a chain', 'Select a destination chain.');
  const addrErr = validateAddress(chain, address);
  if (addrErr) return setStatus('Invalid address', addrErr);
  if (!vaa) return setStatus('Missing VAA', 'Paste the VAA bytes.');

  setBusy(true);
  setStatus('Building claim…');
  try {
    await submit(chain, address, vaa);
  } catch (err: any) {
    setStatus('Failed', String(err?.message ?? err));
  } finally {
    setBusy(false);
  }
});
