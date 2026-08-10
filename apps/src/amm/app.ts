import { pool } from '@galacticcouncil/sdk-next';

import { flatten } from './diff';
import { Commit, KINDS, Kind, PoolsEngine } from './engine';
import { LogLevel, LogTap } from './logs';
import { Stats } from './stats';

type PoolBase = pool.PoolBase;

/** Non-balance changes kept in the feed */
const FEED_SIZE = 60;

const ENDPOINTS = [
  ['wss://rpc-catfish-1.catfish.hydration.cloud', 'Catfish 1'],
  ['wss://rpc-catfish-2.catfish.hydration.cloud', 'Catfish 2'],
  ['wss://rpc-catfish-3.catfish.hydration.cloud', 'Catfish 3'],
  ['wss://rpc-catfish-4.catfish.hydration.cloud', 'Catfish 4'],
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
const reservesEl = el<HTMLTableSectionElement>('reserves-body');
const feedEl = el<HTMLTableSectionElement>('feed-body');
const countEl = el<HTMLElement>('count');

/** One asset's reserve in one pool — the row unit of the reserves table */
interface Reserve {
  kind: Kind;
  pool: string;
  assetId: number;
  decimals?: number;
  balance: bigint;
  delta: bigint;
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

/** A change to anything that isn't a reserve: fee, pegs, amp, capacity… */
interface Change {
  kind: Kind;
  pool: string;
  field: string;
  /** Set where the field belongs to one asset, as a peg does */
  assetId?: number;
  value: string;
  delta: string;
  block: number;
  seq: number;
}

const reserves = new Map<string, Reserve>();
const previous = new Map<string, Record<string, string>>();
const feed: Change[] = [];

const stats = new Stats();
let commits = 0;
let seq = 0;
let head = 0;

/** Chain reads at the last head advance, and how many that block cost */
let reads = 0;
let readsPerBlock = 0;

/** First head seen, so cumulative counts have a span: `head - start` */
let start = 0;

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
    if (head) readsPerBlock = fetch + unpinned - reads;
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
      const key = `${poolKey}:${token.id}`;
      const prior = reserves.get(key);

      /**
       * First sight is a baseline, not a move: it records the block it was seen
       * at, but has nothing to subtract from, so it neither flashes nor deltas.
       */
      const moved = prior !== undefined && prior.balance !== token.balance;

      const delta = moved
        ? token.balance - prior.balance
        : (prior?.delta ?? 0n);

      reserves.set(key, {
        kind: commit.kind,
        pool: label(p),
        assetId: token.id,
        decimals: token.decimals,
        balance: token.balance,
        delta,
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

      feed.unshift({
        kind: commit.kind,
        pool: label(p),
        field: peg ? 'pegs' : path,
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

  feed.length = Math.min(feed.length, FEED_SIZE);
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

  const rows = [...reserves.values()]
    .filter((r) =>
      hit(needle, r.kind, r.pool, symbol(r.assetId), String(r.assetId))
    )
    .sort((a, b) => b.seq - a.seq || a.kind.localeCompare(b.kind));

  countEl.textContent = `${rows.length} / ${reserves.size}`;
  reservesEl.replaceChildren(...rows.map(reserveRow));

  /** Pegs converge every block, so they are off unless asked for */
  const changes = feed.filter(
    (c) =>
      (pegsEl.checked || c.field !== 'pegs') &&
      hit(needle, c.kind, c.pool, c.field)
  );
  feedEl.replaceChildren(...changes.map(changeRow));
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

function reserveRow(r: Reserve): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.className = band(r.block);

  tr.appendChild(cell(String(r.block), 'mono soft num'));
  tr.appendChild(cell(r.kind, 'kind'));
  tr.appendChild(cell(r.pool, 'mono soft'));
  tr.appendChild(asset(r.assetId));
  tr.appendChild(cell(amount(r.balance, r.decimals), 'mono num'));
  tr.appendChild(delta(r.delta === 0n ? '' : signed(r.delta, r.decimals)));
  return tr;
}

function changeRow(c: Change): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.className = band(c.block);

  tr.appendChild(cell(String(c.block), 'mono soft num'));
  tr.appendChild(cell(c.kind, 'kind'));
  tr.appendChild(cell(c.pool, 'mono soft'));
  tr.appendChild(
    c.assetId === undefined ? cell(c.field, 'mono') : field(c.field, c.assetId)
  );
  tr.appendChild(cell(c.value, 'mono num'));
  tr.appendChild(delta(c.delta));
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

/** label, value, warn, what it means */
type Item = [string, string, boolean, string];

/**
 * What the query layer cost.
 *
 * - `reads` is what reached the chain; `cached` and `live` were served locally
 * - `per block` is the steady-state cost, the number to compare against a
 *   design that re-reads every pool on every block
 */
function queryItems(): Item[] {
  const { live, memo, fetch, unpinned } = engine.tally();
  const total = live + memo + fetch + unpinned;
  const served = total ? Math.round(((live + memo) / total) * 100) : 0;

  return [
    [
      'reads',
      String(fetch + unpinned),
      false,
      'Read requests that reached the chain.',
    ],
    [
      'per block',
      String(readsPerBlock),
      false,
      'Chain reads during the last completed block.',
    ],
    [
      'cached',
      String(memo),
      false,
      'Reads served by the block cache, sharing a read already made at that block.',
    ],
    [
      'live',
      String(live),
      false,
      'Reads served from a value an event wrote, with no RPC.',
    ],
    [
      'served',
      `${served}%`,
      false,
      'Share of read requests answered without touching the chain.',
    ],
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

  const groups: [string, Item[]][] = [
    [
      'store',
      [
        [
          'commits',
          String(commits),
          false,
          'Store commits received, one per pool type per block that changed something.',
        ],
        [
          'resyncs',
          String(resyncs),
          resyncs > 0,
          'Seeds beyond the first per client — something asked for a re-derivation.',
        ],
        [
          'seed errors',
          String(sum(s.errorsBy)),
          sum(s.errorsBy) > 0,
          'Seeds that gave up, usually a read that hit the query deadline.',
        ],
      ],
    ],
    [
      'chain',
      [
        [
          'block',
          head ? String(head) : '—',
          false,
          'Highest block the store has committed.',
        ],
        [
          'blocks',
          start ? String(head - start) : '—',
          false,
          'Blocks elapsed since the first one seen.',
        ],
        [
          'reorgs',
          String(s.reorgs),
          false,
          'Reorgs healed by replaying the affected events at the new tip.',
        ],
        [
          'max depth',
          String(s.maxDepth),
          false,
          'Deepest reorg seen, in blocks replaced.',
        ],
        [
          'gaps',
          String(s.gaps),
          s.gaps > 0,
          "Blocks lost below the feed's window, forcing a reseed.",
        ],
      ],
    ],
    [
      'connection',
      [
        [
          'outages',
          String(s.outages),
          s.outages > 0,
          'Times the node stopped answering the health probe.',
        ],
        [
          'last down',
          s.downLast ? `${s.downLast}ms` : '—',
          false,
          'How long the most recent outage lasted.',
        ],
        [
          'stalled reads',
          String(s.stalls),
          s.stalls > 0,
          'Reads that hit the query deadline.',
        ],
      ],
    ],
    [
      'watchdog',
      [
        [
          'reseeds',
          reseeds || '—',
          false,
          'Driver-wide reseeds, by what asked for them.',
        ],
        [
          'sync errors',
          String(s.syncErrors),
          s.syncErrors > 0,
          'Passes that threw; the client reseeds and carries on.',
        ],
      ],
    ],
    ['queries', queryItems()],
  ];

  statsEl.replaceChildren(
    ...groups.map(([title, items]) => {
      const group = document.createElement('div');
      group.className = 'stat-group';

      const heading = document.createElement('span');
      heading.className = 'group-label';
      heading.textContent = title;
      group.appendChild(heading);

      const row = document.createElement('div');
      row.className = 'stat-row';
      for (const [name, value, warn, hint] of items) {
        const item = document.createElement('div');
        item.className = warn ? 'stat is-warn' : 'stat';
        item.title = hint;
        item.innerHTML =
          `<span class="stat-label">${name}</span>` +
          `<span class="stat-value">${value}</span>`;
        row.appendChild(item);
      }
      group.appendChild(row);

      return group;
    })
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
    for (const key of [...reserves.keys()]) {
      if (key.startsWith(`${kind}:`)) reserves.delete(key);
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
    reserves.clear();
    previous.clear();
    feed.length = 0;
    stats.reset();
    commits = 0;
    seq = 0;
    head = 0;
    start = 0;
    reads = 0;
    readsPerBlock = 0;
    render();
    renderStats();
    setState(false);
    renderTypes();
    return;
  }

  engine.connect(endpointEl.value);
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
