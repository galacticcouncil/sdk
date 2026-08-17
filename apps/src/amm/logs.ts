export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LogLine {
  level: LogLevel;
  text: string;
}

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];

/** The SDK logger tags every line; anything else on the console is not ours */
const TAG = /^\[GC\]\[(TRACE|DEBUG|INFO|WARN|ERROR)\]/;

/** bigint-safe; the payload is only ever read by {@link Stats} */
const render = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.message;
  try {
    return JSON.stringify(v, (_k, x) =>
      typeof x === 'bigint' ? x.toString() : x
    );
  } catch {
    return String(v);
  }
};

/**
 * Taps the SDK's log stream so counters can be derived from it.
 *
 * - Wraps the console methods the logger writes to and leaves them intact, so
 *   devtools stays the place to actually read logs
 * - `gc.log` decides what the SDK emits at all
 */
export class LogTap {
  constructor(private readonly onLine: (line: LogLine) => void) {
    this.capture('debug');
    this.capture('info');
    this.capture('warn');
    this.capture('error');
  }

  static setLevel(level: LogLevel | 'silent') {
    localStorage.setItem('gc.log', level);
  }

  static getLevel(): LogLevel | 'silent' {
    const v = localStorage.getItem('gc.log') ?? '';
    return LEVELS.includes(v) ? (v as LogLevel | 'silent') : 'debug';
  }

  private capture(method: 'debug' | 'info' | 'warn' | 'error') {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      original(...args);

      const [head] = args;
      const match = typeof head === 'string' ? TAG.exec(head) : null;
      if (!match) return;

      this.onLine({
        level: match[1].toLowerCase() as LogLevel,
        text: args.map(render).join(' ').replace(TAG, '').trim(),
      });
    };
  }
}
