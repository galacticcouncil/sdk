import { pool } from '@galacticcouncil/sdk-next';

import { flatten } from './diff';
import { Commit, KINDS, Kind, PoolsEngine } from './engine';
import { LogLevel, LogTap } from './logs';
import { Stats } from './stats';

type PoolBase = pool.PoolBase;

const ENDPOINTS = [
  ['wss://rpc-catfish-1.catfish.hydration.cloud', 'Catfish 1'],
  ['wss://rpc-catfish-2.catfish.hydration.cloud', 'Catfish 2'],
  ['wss://rpc-catfish-3.catfish.hydration.cloud', 'Catfish 3'],
  ['wss://rpc-catfish-4.catfish.hydration.cloud', 'Catfish 4'],
  ['wss://3.lark.hydration.cloud', 'Lark 3'],
];

const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const endpointEl = el<HTMLSelectElement>('endpoint');
const levelEl = el<HTMLSelectElement>('level');
const connectEl = el<HTMLButtonElement>('connect');
const filterEl = el<HTMLInputElement>('filter');
const pegsEl = el<HTMLInputElement>('pegs');
const typesEl = el<HTMLElement>('types');
const statsEl = el<HTMLElement>('stats');
const stateEl = el<HTMLTableSectionElement>('state-body');
const countEl = el<HTMLElement>('count');

/**
 * One field of one pool — the row unit.
 *
 * - A reserve is a field whose name is its asset; everything else is a scalar
 * - Reserves exist from the first commit; a scalar appears when it first moves
 */
interface Row {
  kind: Kind;
  pool: string;
  field: string;
  /** Set where the field is an asset's reserve, or belongs to one asset */
  assetId?: number;
  value: string;
  delta: string;
  block: number;
  seq: number;
}

/**
 * Fields carrying a raw amount, and the pool property naming the asset whose
 * decimals they are denominated in.
 */
const DENOMINATED: Record<string, string> = {
  totalIssuance: 'id',
  collateralBalance: 'collateralId',
  maxInHolding: 'collateralId',
  hsmMintCapacity: 'hollarId',
};

const rows = new Map<string, Row>();
const previous = new Map<string, Record<string, string>>();

/** Raw balances, kept so a reserve's delta stays exact */
const balances = new Map<string, bigint>();

const stats = new Stats();
let commits = 0;
let seq = 0;
let head = 0;

/** Chain reads as of the last head advance */
let reads = 0;

/** First head seen, so cumulative counts have a span: `head - start` */
let start = 0;

/** When this session connected, for the uptime readout */
let connectedAt = 0;

const engine = new PoolsEngine((commit) => {
  commits++;
  observe(commit);
  render();
  renderStats();
});

new LogTap((line) => stats.observe(line));

/** A pool's label: its id where it has one, else a shortened address */
const label = (p: PoolBase): string => {
  const id = (p as PoolBase & { id?: number }).id;
  if (id !== undefined) return String(id);
  return `${p.address.slice(0, 6)}…${p.address.slice(-4)}`;
};

const symbol = (assetId: number): string =>
  engine.symbols.get(assetId) ?? `#${assetId}`;

/**
 * Fold one commit into both views.
 *
 * - Reserves carry a delta, so the size of the move is visible
 * - Everything else lands in the feed with its before and after
 */
function observe(commit: Commit) {
  seq++;

  /** Sample on head advance, so the count covers exactly one block */
  if (commit.block > head) {
    const { fetch, unpinned } = engine.tally();
    reads = fetch + unpinned;
    head = commit.block;
    if (!start) start = commit.block;
  }

  for (const p of commit.changed) {
    const poolKey = `${commit.kind}:${p.address}`;
    const before = previous.get(poolKey);
    const after = flatten(p);
    previous.set(poolKey, after);

    for (const token of p.tokens) {
      const key = `${poolKey}:asset:${token.id}`;
      const prior = rows.get(key);
      const held = balances.get(key);

      /**
       * First sight is a baseline, not a move: it records the block it was seen
       * at, but has nothing to subtract from, so it carries no delta.
       */
      const moved = held !== undefined && held !== token.balance;
      balances.set(key, token.balance);

      rows.set(key, {
        kind: commit.kind,
        pool: label(p),
        field: 'balance',
        assetId: token.id,
        value: amount(token.balance, token.decimals),
        delta: moved
          ? signed(token.balance - held, token.decimals)
          : (prior?.delta ?? ''),
        block: moved ? commit.block : (prior?.block ?? commit.block),
        seq: moved ? seq : (prior?.seq ?? 0),
      });
    }

    if (!before) continue;

    for (const path of Object.keys(after)) {
      if (path.startsWith('tokens.') || before[path] === after[path]) continue;

      /** A peg is the ratio of the pool's asset at that position */
      const peg = /^pegs\.(\d+)$/.exec(path);
      const decimals = denominated(p, path);

      const field = peg ? 'pegs' : path;
      rows.set(`${poolKey}:${field}`, {
        kind: commit.kind,
        pool: label(p),
        field,
        assetId: peg ? p.tokens[Number(peg[1])]?.id : undefined,
        value:
          decimals === undefined
            ? after[path]
            : amount(BigInt(after[path]), decimals),
        delta:
          decimals === undefined
            ? drift(before[path], after[path])
            : drift(
                exact(before[path], decimals),
                exact(after[path], decimals)
              ),
        block: commit.block,
        seq,
      });
    }
  }
}

/** Balance as a human number; decimals are per token and may be missing */
const amount = (balance: bigint, decimals?: number): string => {
  if (decimals === undefined) return balance.toString();
  const base = 10n ** BigInt(decimals);
  const whole = balance / base;
  const frac = (((balance < 0n ? -balance : balance) % base) * 10_000n) / base;
  return `${whole.toLocaleString('en-US')}.${frac.toString().padStart(4, '0')}`;
};

const signed = (delta: bigint, decimals?: number): string =>
  `${delta > 0n ? '+' : '−'}${amount(delta < 0n ? -delta : delta, decimals)}`;

/** Fixed-point working precision for field deltas */
const SCALE = 18;

/** Decimal string → scaled integer; floats would add digits of their own */
const scaled = (s: string): bigint | undefined => {
  if (!/^-?\d+(\.\d+)?$/.test(s)) return undefined;

  const negative = s.startsWith('-');
  const [whole, frac = ''] = (negative ? s.slice(1) : s).split('.');
  const padded = frac.padEnd(SCALE, '0').slice(0, SCALE);
  const value = BigInt(whole) * 10n ** BigInt(SCALE) + BigInt(padded || '0');
  return negative ? -value : value;
};

/** Raw integer → exact decimal, unseparated, so deltas stay exact */
const exact = (raw: string, decimals: number): string => {
  if (!/^-?\d+$/.test(raw)) return raw;

  const negative = raw.startsWith('-');
  const digits = (negative ? raw.slice(1) : raw).padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const frac = decimals > 0 ? `.${digits.slice(-decimals)}` : '';
  return `${negative ? '-' : ''}${whole}${frac}`;
};

/**
 * Decimals a raw-amount field is denominated in, per {@link DENOMINATED}.
 *
 * - Falls back to registry metadata: an HSM pool drops the share token from
 *   `tokens`, so its `totalIssuance` has no token to read decimals off
 */
const denominated = (p: PoolBase, path: string): number | undefined => {
  const key = DENOMINATED[path];
  if (!key) return undefined;

  const assetId = (p as unknown as Record<string, unknown>)[key];
  if (typeof assetId !== 'number') return undefined;

  return (
    p.tokens.find((t) => t.id === assetId)?.decimals ??
    engine.decimals.get(assetId)
  );
};

/** Scaled integer → plain decimal, trailing zeros dropped */
const plain = (v: bigint): string => {
  const base = 10n ** BigInt(SCALE);
  const frac = (v % base).toString().padStart(SCALE, '0').replace(/0+$/, '');
  return frac ? `${v / base}.${frac}` : `${v / base}`;
};

/**
 * How far a scalar field moved.
 *
 * - Empty where the value isn't numeric, e.g. a tradable state
 * - Peg drift lands around the tenth decimal, so it reads in the same
 *   fixed-point as the value beside it
 */
const drift = (from: string, to: string): string => {
  const a = scaled(from);
  const b = scaled(to);
  if (a === undefined || b === undefined || a === b) return '';

  const delta = b - a;
  return `${delta > 0n ? '+' : '−'}${plain(delta < 0n ? -delta : delta)}`;
};

/** Plain text includes; a leading `-` excludes instead */
const hit = (needle: string, ...fields: string[]) => {
  if (!needle) return true;

  const negated = needle.startsWith('-');
  const term = negated ? needle.slice(1) : needle;
  if (!term) return true;

  const found = fields.some((f) => f.toLowerCase().includes(term));
  return negated ? !found : found;
};

function render() {
  const needle = filterEl.value.trim().toLowerCase();

  /** Pegs converge every block, so they are off unless asked for */
  const visible = [...rows.values()]
    .filter(
      (r) =>
        (pegsEl.checked || r.field !== 'pegs') &&
        hit(
          needle,
          r.kind,
          r.pool,
          r.field,
          r.assetId === undefined ? '' : symbol(r.assetId),
          r.assetId === undefined ? '' : String(r.assetId)
        )
    )
    .sort((a, b) => b.seq - a.seq || a.kind.localeCompare(b.kind));

  countEl.textContent = `${visible.length} / ${rows.size}`;
  stateEl.replaceChildren(...visible.map(rowEl));
}

/**
 * How far a row's block trails the head, as a class.
 *
 * - Rows sharing a block share a band, so the latest update reads as a group
 * - Recomputed every render, so bands fade as blocks arrive
 */
const band = (block: number): string => {
  const age = head - block;
  return age <= 0 ? 'age-0' : age === 1 ? 'age-1' : age === 2 ? 'age-2' : '';
};

/**
 * One field of one pool.
 *
 * - A reserve names its asset; every other field names itself
 */
function rowEl(r: Row): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.className = band(r.block);

  tr.appendChild(cell(String(r.block), 'mono soft num'));
  tr.appendChild(cell(r.kind, 'kind'));
  tr.appendChild(cell(r.pool, 'mono soft'));
  tr.appendChild(
    r.assetId === undefined
      ? cell(r.field, 'mono')
      : r.field === 'balance'
        ? asset(r.assetId)
        : field(r.field, r.assetId)
  );
  tr.appendChild(cell(r.value, 'mono num'));
  tr.appendChild(delta(r.delta));
  return tr;
}

/** Signed move, coloured by direction */
function delta(text: string): HTMLTableCellElement {
  const up = text.startsWith('+');
  return cell(text, text ? `mono num ${up ? 'up' : 'down'}` : 'mono num');
}

function asset(assetId: number): HTMLTableCellElement {
  const td = document.createElement('td');
  td.className = 'asset';
  td.innerHTML =
    `<span class="asset-symbol">${symbol(assetId)}</span>` +
    `<span class="asset-id">${assetId}</span>`;
  return td;
}

/** A field that belongs to one asset, e.g. that asset's peg */
function field(name: string, assetId: number): HTMLTableCellElement {
  const td = document.createElement('td');
  td.className = 'asset';
  td.innerHTML =
    `<span class="asset-symbol">${name}</span>` +
    `<span class="asset-id">${symbol(assetId)}</span>`;
  return td;
}

function cell(text: string, className = ''): HTMLTableCellElement {
  const td = document.createElement('td');
  td.className = className;
  td.textContent = text;
  return td;
}

/** One line of a stats group */
interface Line {
  name: string;
  value: string;
  /** Second column, where the group reports a rate */
  rate?: string;
  warn?: boolean;
  hint?: string;
}

/** Blocks elapsed since the first commit, the denominator for any rate */
const span = () => (start && head > start ? head - start : 0);

/** Coarse and human: the point is the order of magnitude, not the seconds */
const elapsed = (since: number): string => {
  const total = Math.floor((Date.now() - since) / 1000);
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m`;
  return `${total}s`;
};

/** A group of name/value lines, one layout for every group in the panel */
function listGroup(title: string, lines: Line[]): HTMLElement {
  const group = document.createElement('div');
  group.className = `stat-group compact ${title}`;

  const heading = document.createElement('span');
  heading.className = 'group-label';
  heading.textContent = title;
  group.appendChild(heading);

  const list = document.createElement('div');
  const wide = lines.some(({ rate }) => rate !== undefined);
  list.className = `compact-list ${wide ? 'cols-3' : 'cols-2'}`;

  for (const { name, value, rate, warn, hint } of lines) {
    const row = document.createElement('div');
    row.className = 'compact-row';
    if (hint) row.title = hint;
    row.innerHTML =
      `<span class="q">${name}</span>` +
      `<span class="n${warn ? ' is-warn' : ''}">${value}</span>` +
      (rate === undefined ? '' : `<span class="n">${rate}</span>`);
    list.appendChild(row);
  }

  group.appendChild(list);
  return group;
}

const rate = (count: number): string => {
  const blocks = span();
  return blocks ? (count / blocks).toFixed(1) : '—';
};

/** The five queries reaching the chain most, total and per block */
function heaviest(): Line[] {
  return Object.entries(engine.tally().scopes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([scope, count]) => ({
      name: scope,
      value: String(count),
      rate: rate(count),
      hint: `${scope} — ${count} chain reads, ${rate(count)} per block.`,
    }));
}

/**
 * What the query layer cost.
 *
 * - `reads` reached the chain; `cached` and `live` were served locally
 * - The rate column is the steady-state cost per block
 */
function queries(): Line[] {
  const { live, memo, fetch, unpinned } = engine.tally();
  const total = live + memo + fetch + unpinned;
  const served = total ? Math.round(((live + memo) / total) * 100) : 0;

  return [
    {
      name: 'reads',
      value: String(fetch + unpinned),
      rate: rate(reads),
      hint: 'Read requests that reached the chain.',
    },
    {
      name: 'cached',
      value: String(memo),
      rate: rate(memo),
      hint: 'Served by the block cache, sharing a read already made at that block.',
    },
    {
      name: 'live',
      value: String(live),
      rate: rate(live),
      hint: 'Served from a value an event wrote, with no RPC.',
    },
    {
      name: 'served',
      value: `${served}%`,
      rate: '',
      hint: 'Share of read requests answered without touching the chain.',
    },
  ];
}

function renderStats() {
  const s = stats.get();
  const reseeds = Object.entries(s.reseeds)
    .map(([reason, n]) => `${reason} ${n}`)
    .join(' · ');

  /** Only the clients on screen; a disabled one's history is not this run */
  const active = KINDS.filter(({ kind }) => engine.enabled(kind));
  const sum = (by: Record<string, number>) =>
    active.reduce((total, { log }) => total + (by[log] ?? 0), 0);

  /** Seeds past the first: the first is a given, a second means re-derivation */
  const resyncs = active.reduce(
    (total, { log }) => total + Math.max(0, (s.seedsBy[log] ?? 0) - 1),
    0
  );

  const store: Line[] = [
    {
      name: 'commits',
      value: String(commits),
      hint: 'Store commits received, one per pool type per block that changed something.',
    },
    {
      name: 'resyncs',
      value: String(resyncs),
      warn: resyncs > 0,
      hint: 'Seeds beyond the first per client — something asked for a re-derivation.',
    },
    {
      name: 'seed errors',
      value: String(sum(s.errorsBy)),
      warn: sum(s.errorsBy) > 0,
      hint: 'Seeds that gave up, usually a read that hit the query deadline.',
    },
  ];

  const chain: Line[] = [
    {
      name: 'block',
      value: head ? String(head) : '—',
      hint: 'Highest block the store has committed.',
    },
    {
      name: 'blocks',
      value: start ? String(head - start) : '—',
      hint: 'Blocks elapsed since the first one seen.',
    },
    {
      name: 'reorgs',
      value: String(s.reorgs),
      hint: 'Reorgs healed by replaying the affected events at the new tip.',
    },
    {
      name: 'max depth',
      value: String(s.maxDepth),
      hint: 'Deepest reorg seen, in blocks replaced.',
    },
    {
      name: 'gaps',
      value: String(s.gaps),
      warn: s.gaps > 0,
      hint: "Blocks lost below the feed's window, forcing a reseed.",
    },
  ];

  const connection: Line[] = [
    {
      name: 'uptime',
      value: connectedAt ? elapsed(connectedAt) : '—',
      hint: 'How long this session has been subscribed.',
    },
    {
      name: 'outages',
      value: String(s.outages),
      warn: s.outages > 0,
      hint: 'Times the node stopped answering the health probe.',
    },
    {
      name: 'last down',
      value: s.downLast ? `${s.downLast}ms` : '—',
      hint: 'How long the most recent outage lasted.',
    },
    {
      name: 'stalled reads',
      value: String(s.stalls),
      warn: s.stalls > 0,
      hint: 'Reads that hit the query deadline.',
    },
  ];

  const watchdog: Line[] = [
    {
      name: 'reseeds',
      value: reseeds || '—',
      hint: 'Driver-wide reseeds, by what asked for them.',
    },
    {
      name: 'sync errors',
      value: String(s.syncErrors),
      warn: s.syncErrors > 0,
      hint: 'Passes that threw; the client reseeds and carries on.',
    },
  ];

  statsEl.replaceChildren(
    listGroup('store', store),
    listGroup('chain', chain),
    listGroup('connection', connection),
    listGroup('watchdog', watchdog),
    listGroup('queries', queries()),
    listGroup('heaviest', heaviest())
  );
}

function renderTypes() {
  typesEl.replaceChildren(
    ...KINDS.map(({ kind, label: name }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = engine.enabled(kind) ? 'pill is-on' : 'pill';
      button.textContent = name;
      button.disabled = !engine.connected;
      button.addEventListener('click', () => toggle(kind));
      return button;
    })
  );
}

function toggle(kind: Kind) {
  if (engine.enabled(kind)) {
    engine.disable(kind);
    for (const key of [...rows.keys()]) {
      if (!key.startsWith(`${kind}:`)) continue;
      rows.delete(key);
      balances.delete(key);
    }
    render();
  } else {
    engine.enable(kind);
  }
  renderTypes();
}

function setState(on: boolean) {
  connectEl.textContent = on ? 'Disconnect' : 'Connect';
  endpointEl.disabled = on;
}

connectEl.addEventListener('click', () => {
  if (engine.connected) {
    engine.disconnect();
    rows.clear();
    balances.clear();
    previous.clear();
    stats.reset();
    commits = 0;
    seq = 0;
    head = 0;
    start = 0;
    reads = 0;
    connectedAt = 0;
    render();
    renderStats();
    setState(false);
    renderTypes();
    return;
  }

  engine.connect(endpointEl.value);
  connectedAt = Date.now();
  setState(true);
  for (const kind of ['omni', 'stable', 'aave', 'hsm'] as Kind[]) {
    engine.enable(kind);
  }
  renderTypes();
});

filterEl.addEventListener('input', render);
pegsEl.addEventListener('change', render);

levelEl.addEventListener('change', () =>
  LogTap.setLevel(levelEl.value as LogLevel)
);

for (const [url, name] of ENDPOINTS) {
  const option = document.createElement('option');
  option.value = url;
  option.textContent = name;
  endpointEl.appendChild(option);
}

levelEl.value = LogTap.getLevel();
setState(false);
renderTypes();
renderStats();
