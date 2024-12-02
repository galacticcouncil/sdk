import { config } from '../../jest.config.mjs';

/**
 * Chopsticks log level, "fatal" | "error" | "warn" | "info" | "debug" | "trace".
 * Default is "info".
 */
process.env.LOG_LEVEL = 'info';

/**
 * Don't log objects. Default is `false`.
 */
process.env.LOG_COMPACT = 'false';

/**
 * Don't truncate log messages, show full log output. Default is `false`.
 */
process.env.VERBOSE_LOG = 'false';

export default config;
