import {
  HYDRATION_SA,
  MoxitAsset,
  fetchSaBalances,
  formatUnits,
  listMoxitAssets,
} from './assets';
import { buildGovernanceTransact } from './transact';

const EVM_RX = /^0x[0-9a-fA-F]{40}$/;
const SUI_RX = /^0x[0-9a-fA-F]{64}$/;
const SOL_RX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const assets = listMoxitAssets();
const assetByKey = new Map<string, MoxitAsset>(assets.map((a) => [a.key, a]));

const saEl = document.getElementById('sa') as HTMLElement;
const balancesBody = document.getElementById('balances-body') as HTMLElement;
const balancesStatus = document.getElementById(
  'balances-status'
) as HTMLElement;
const refreshBtn = document.getElementById('refresh') as HTMLButtonElement;

const form = document.getElementById('transact-form') as HTMLFormElement;
const assetEl = document.getElementById('asset') as HTMLSelectElement;
const originEl = document.getElementById('origin') as HTMLElement;
const recipientEl = document.getElementById('recipient') as HTMLInputElement;
const recipientHint = document.getElementById('recipient-hint') as HTMLElement;
const amountEl = document.getElementById('amount') as HTMLInputElement;
const feeEl = document.getElementById('fee') as HTMLInputElement;
const buildBtn = document.getElementById('build') as HTMLButtonElement;

const resultEl = document.getElementById('result') as HTMLElement;
const resultTitle = document.getElementById('result-title') as HTMLElement;
const callEl = document.getElementById('result-call') as HTMLElement;
const detailsEl = document.getElementById('result-details') as HTMLElement;
const copyBtn = document.getElementById('copy-call') as HTMLButtonElement;

saEl.textContent = HYDRATION_SA;

for (const a of assets) {
  const opt = document.createElement('option');
  opt.value = a.key;
  opt.textContent = `${a.symbol} → ${a.originName}`;
  assetEl.appendChild(opt);
}

function recipientError(originKey: string, addr: string): string | null {
  if (!addr) return 'Recipient is required.';
  switch (originKey) {
    case 'solana':
      return SOL_RX.test(addr) ? null : 'Expected a base58 Solana address.';
    case 'sui':
      return SUI_RX.test(addr)
        ? null
        : 'Expected a 32-byte 0x Sui address.';
    default:
      return EVM_RX.test(addr) ? null : 'Expected a 20-byte 0x EVM address.';
  }
}

function onAssetChange() {
  const asset = assetByKey.get(assetEl.value);
  if (!asset) {
    originEl.textContent = '—';
    return;
  }
  originEl.textContent = asset.originName;
  recipientHint.textContent = `Account on ${asset.originName} that receives the bridged ${asset.symbol}.`;
  recipientEl.placeholder =
    asset.originKey === 'solana'
      ? 'Base58 Solana address'
      : asset.originKey === 'sui'
        ? '0x… (32-byte Sui address)'
        : '0x… (20-byte EVM address)';
}

assetEl.addEventListener('change', onAssetChange);

function setBusy(btn: HTMLButtonElement, busy: boolean) {
  btn.disabled = busy;
  btn.classList.toggle('is-busy', busy);
}

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

async function loadBalances() {
  setBusy(refreshBtn, true);
  balancesStatus.textContent = 'Loading balances from Moonbeam…';
  balancesBody.innerHTML = '';
  try {
    const rows = await fetchSaBalances(assets);
    for (const r of rows) {
      const tr = document.createElement('tr');

      const sym = document.createElement('td');
      sym.textContent = r.symbol;

      const origin = document.createElement('td');
      origin.textContent = r.originName;

      const addr = document.createElement('td');
      addr.className = 'mono';
      addr.textContent = shortAddr(r.address);
      addr.title = r.address;

      const bal = document.createElement('td');
      bal.className = 'mono num';
      bal.textContent = r.error ? '—' : formatUnits(r.balance, r.decimals);
      if (r.error) bal.title = r.error;

      tr.append(sym, origin, addr, bal);
      balancesBody.appendChild(tr);
    }
    balancesStatus.textContent = `${rows.length} exit assets · SA ${HYDRATION_SA}`;
  } catch (e: any) {
    balancesStatus.textContent =
      'Failed to load balances: ' + String(e?.message ?? e);
  } finally {
    setBusy(refreshBtn, false);
  }
}

refreshBtn.addEventListener('click', () => void loadBalances());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultEl.hidden = true;

  const asset = assetByKey.get(assetEl.value);
  const recipient = recipientEl.value.trim();
  const amount = amountEl.value.trim();
  const feeGlmr = feeEl.value.trim() || '1';

  if (!asset) return showError('Select an exit asset.');
  const recErr = recipientError(asset.originKey, recipient);
  if (recErr) return showError(recErr);
  if (!(Number(amount) > 0)) return showError('Enter a positive amount.');

  setBusy(buildBtn, true);
  try {
    const res = await buildGovernanceTransact({
      asset,
      recipient,
      amount,
      feeGlmr,
    });

    resultTitle.textContent = 'Governance call · PolkadotXcm.send';
    callEl.textContent = res.callHex;

    const decodedLines: string[] = [];
    if (res.decoded.length) {
      decodedLines.push(
        ``,
        `Moonbeam call · Batch.batchAll${res.batchTo ? '  @ ' + res.batchTo : ''}`
      );
      res.decoded.forEach((c, i) => {
        decodedLines.push(`  ${i + 1}. ${c.label}  @ ${c.to}`);
        c.args.forEach((a) =>
          decodedLines.push(`       ${a.name.padEnd(14)} ${a.value}`)
        );
      });
    }

    detailsEl.textContent = [
      `Exit           ${amount} ${asset.symbol}  →  ${res.originName}`,
      `Recipient      ${recipient}`,
      `Amount (raw)   ${res.amountRaw}`,
      `Moonbeam ERC20 ${asset.address}`,
      `Token bridge   ${res.tokenBridge}  (Wormhole chain ${res.wormholeId})`,
      `Executed as    ${HYDRATION_SA}  (Hydration sovereign account)`,
      `Exec fee       ${feeGlmr} GLMR`,
      `Weight         refTime ${res.weight.refTime} · proofSize ${res.weight.proofSize}`,
      ...decodedLines,
      ``,
      `Moonbeam EthereumXcm.transact call`,
      res.transactHex,
    ].join('\n');
    resultEl.hidden = false;
  } catch (err: any) {
    showError(String(err?.message ?? err));
  } finally {
    setBusy(buildBtn, false);
  }
});

function showError(message: string) {
  resultTitle.textContent = 'Error';
  callEl.textContent = message;
  detailsEl.textContent = '';
  resultEl.hidden = false;
}

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(callEl.textContent ?? '');
    copyBtn.textContent = 'Copied';
    setTimeout(() => (copyBtn.textContent = 'Copy call'), 1200);
  } catch {
    /* clipboard unavailable */
  }
});

void loadBalances();
