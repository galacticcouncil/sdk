import buffer from 'buffer';

/**
 * Fixes @solana/web3.js buffer issues
 */
window.Buffer = buffer.Buffer;
