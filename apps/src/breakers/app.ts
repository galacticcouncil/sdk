import {
  ASSET_PERIOD,
  AssetRow,
  currentBlock,
  Health,
  loadAssets,
  loadGlobal,
  loadNtt,
  Meter,
  NttRow,
} from './breakers';

const refreshBtn = document.getElementById('refresh') as HTMLButtonElement;
const filterEl = document.getElementById('filter') as HTMLInputElement;
const summaryEl = document.getElementById('summary') as HTMLElement;
const globalEl = document.getElementById('global') as HTMLElement;
const assetsEl = document.getElementById('assets') as HTMLElement;
const nttEl = document.getElementById('ntt') as HTMLElement;
const assetsSubEl = document.getElementById('assets-sub') as HTMLElement;

assetsSubEl.textContent =
  `fixed ${ASSET_PERIOD.label} window (${ASSET_PERIOD.blocks.toLocaleString('en-US')} blocks), ` +
  'resets on next mint after expiry';

let assetRows: AssetRow[] = [];
let nttRows: NttRow[] = [];

function el(tag: string, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function cell(className?: string, ...children: (Node | string)[]) {
  const td = el('td', className);
  td.append(...children);
  return td;
}

function badge(text: string, health: Health) {
  return el('span', 'badge is-' + health, text);
}

/** Bar plus its numbers, the colour carried by the health class. */
function meter(m: Meter) {
  const wrap = el('div', 'meter is-' + m.health);
  const bar = el('div', 'meter-bar');
  const fill = el('div', 'meter-fill');
  fill.style.width = Math.round(m.fill * 100) + '%';
  bar.append(fill);
  wrap.append(bar, el('span', 'meter-label', m.label));
  return wrap;
}

function stat(label: string, value: string, health: Health = 'none') {
  const node = el('div', 'stat is-' + health);
  node.append(el('span', 'stat-label', label), el('span', 'stat-value', value));
  return node;
}

function messageRow(colspan: number, message: unknown) {
  const row = el('tr');
  const td = cell(
    'hint',
    message instanceof Error ? message.message : String(message)
  );
  td.setAttribute('colspan', String(colspan));
  row.append(td);
  return row;
}

function matches(row: object, needle: string) {
  if (!needle) return true;
  return Object.values(row)
    .filter((v): v is string => typeof v === 'string')
    .some((v) => v.toLowerCase().includes(needle));
}

function renderSummary(block: number) {
  const locked = assetRows.filter((r) => r.locked).length;
  const tight = nttRows.filter((r) => !r.error && r.headroom < 0.2).length;
  summaryEl.replaceChildren(
    stat('Block', '#' + block.toLocaleString('en-US')),
    stat('Locked assets', String(locked), locked ? 'bad' : 'ok'),
    stat('Legs under 20% headroom', String(tight), tight ? 'warn' : 'ok')
  );
}

function renderAssets() {
  const needle = filterEl.value.trim().toLowerCase();
  const rows = assetRows.filter((r) => matches(r, needle));
  if (!rows.length) {
    assetsEl.replaceChildren(messageRow(7, 'Nothing matches.'));
    return;
  }
  assetsEl.replaceChildren(
    ...rows.map((r) => {
      const tr = el('tr', r.locked ? 'is-locked' : undefined);
      const name = cell('kind', el('strong', undefined, r.asset));
      name.append(el('span', 'soft', ' #' + r.assetId));
      tr.append(
        name,
        cell(undefined, badge(r.status, r.health)),
        cell('soft', r.category),
        cell('num delta', r.netChange),
        cell('num', r.limit),
        cell('wide', meter(r.usage)),
        cell('wide', meter(r.window))
      );
      return tr;
    })
  );
}

function renderNtt() {
  const needle = filterEl.value.trim().toLowerCase();
  const rows = nttRows.filter((r) => matches(r, needle));
  if (!rows.length) {
    nttEl.replaceChildren(messageRow(6, 'Nothing matches.'));
    return;
  }
  nttEl.replaceChildren(
    ...rows.map((r) => {
      const tr = el('tr');
      tr.append(cell('kind', r.leg), cell(undefined, badge(r.asset, 'none')));
      if (r.error) {
        const td = cell('hint', r.error);
        td.setAttribute('colspan', '4');
        tr.append(td);
        return tr;
      }
      tr.append(
        cell('wide', meter(r.send), el('span', 'soft last', r.sendLast)),
        cell('wide', meter(r.receive), el('span', 'soft last', r.receiveLast)),
        cell('soft', r.window)
      );
      return tr;
    })
  );
}

async function renderGlobal() {
  try {
    const global = await loadGlobal();
    if (!global.configured) {
      globalEl.replaceChildren(el('p', 'hint', 'Not configured.'));
      return;
    }
    const head = el('div', 'global-head');
    head.append(
      badge(global.lockdown ? 'Lockdown' : 'Active', global.meter.health),
      meter(global.meter)
    );
    const rows = global.rows.map((r) => {
      const row = el('div', 'kv');
      row.append(
        el('span', 'kv-term', r.term),
        el('code', 'kv-value', r.value)
      );
      return row;
    });
    globalEl.replaceChildren(head, ...rows);
  } catch (e) {
    globalEl.replaceChildren(
      el('p', 'hint', e instanceof Error ? e.message : String(e))
    );
  }
}

async function render() {
  refreshBtn.disabled = true;
  refreshBtn.classList.add('is-busy');
  summaryEl.replaceChildren(stat('Block', '…'));
  globalEl.replaceChildren(el('p', 'hint', 'Loading…'));
  assetsEl.replaceChildren(messageRow(7, 'Loading…'));
  nttEl.replaceChildren(messageRow(6, 'Loading…'));

  try {
    const block = await currentBlock();
    // Independent reads - one failing rpc must not blank the others.
    await Promise.all([
      renderGlobal(),
      loadAssets(block)
        .then((rows) => (assetRows = rows))
        .then(renderAssets)
        .catch((e) => assetsEl.replaceChildren(messageRow(7, e))),
      loadNtt()
        .then((rows) => (nttRows = rows))
        .then(renderNtt)
        .catch((e) => nttEl.replaceChildren(messageRow(6, e))),
    ]);
    renderSummary(block);
  } catch (e) {
    summaryEl.replaceChildren(
      stat('Error', e instanceof Error ? e.message : String(e), 'bad')
    );
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.classList.remove('is-busy');
  }
}

filterEl.addEventListener('input', () => {
  renderAssets();
  renderNtt();
});
refreshBtn.addEventListener('click', () => render());
render();
