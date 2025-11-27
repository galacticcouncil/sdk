import buffer from 'buffer';

/**
 * Fixes @solana/web3.js buffer issues
 */
if (typeof window !== 'undefined') {
  // Code is running in the browser (client-side)
  window.Buffer = buffer.Buffer;
}
