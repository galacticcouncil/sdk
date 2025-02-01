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

process.env.ASSETHUBPOLKADOT_BLOCK_NUMBER = 8112196;
process.env.HYDRATION_BLOCK_NUMBER = 6875392;
process.env.MOONBEAM_BLOCK_NUMBER = 9418127;
process.env.POLKADOT_BLOCK_NUMBER = 24527644;

export default config;
