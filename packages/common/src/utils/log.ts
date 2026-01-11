type LogLevel =
  | 'all'
  | 'trace'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'silent';

const LEVEL_ORDER: Record<LogLevel, number> = {
  all: 0,
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  silent: 6,
};

function tag(label: string) {
  return label.padEnd(11);
}

const TAG = {
  TRACE: tag('[GC][TRACE]'),
  DEBUG: tag('[GC][DEBUG]'),
  INFO: tag('[GC][INFO]'),
  WARN: tag('[GC][WARN]'),
  ERROR: tag('[GC][ERROR]'),
};

function getConfiguredLevel(): LogLevel {
  // browser
  if (typeof window !== 'undefined') {
    try {
      const v = window.localStorage.getItem('gc.log');
      if (v && v in LEVEL_ORDER) return v as LogLevel;
    } catch {}
  }

  // node (cjs / esm)
  if (typeof process !== 'undefined') {
    const v = process.env.GC_LOG;
    if (v && v in LEVEL_ORDER) return v as LogLevel;
  }

  return 'silent';
}

function shouldLog(level: LogLevel): boolean {
  const current = getConfiguredLevel();
  return LEVEL_ORDER[level] >= LEVEL_ORDER[current];
}

export const logger = {
  trace(...args: any[]) {
    if (!shouldLog('trace')) return;
    console.debug(TAG.TRACE, ...args);
  },

  debug(...args: any[]) {
    if (!shouldLog('debug')) return;
    console.debug(TAG.DEBUG, ...args);
  },

  info(...args: any[]) {
    if (!shouldLog('info')) return;
    console.info(TAG.INFO, ...args);
  },

  warn(...args: any[]) {
    if (!shouldLog('warn')) return;
    console.warn(TAG.WARN, ...args);
  },

  error(...args: any[]) {
    if (!shouldLog('error')) return;

    // Show stack trace only if an Error is passed
    const hasError = args.some((a) => a instanceof Error);

    if (hasError) {
      console.error(TAG.ERROR, ...args);
    } else {
      this.warn(...args);
    }
  },
};
