const out = document.getElementById('log')!;

export const stringify = (v: unknown) =>
  typeof v === 'string'
    ? v
    : JSON.stringify(v, (_k, val) =>
        typeof val === 'bigint' ? val.toString() : val
      );

/** Mirror onto the page so the flow is readable without devtools. */
export function log(...args: unknown[]) {
  console.log(...args);
  out.textContent += args.map(stringify).join(' ') + '\n';
  out.scrollTop = out.scrollHeight;
}

export const fmt = (amount: { toDecimal(): string; originSymbol: string }) =>
  [amount.toDecimal(), amount.originSymbol].join(' ');

/**
 * Serialize clicks - every step needs a wallet confirmation. Buttons
 * locked for a missing address stay disabled.
 */
export function bind(el: HTMLButtonElement, run: () => Promise<unknown>) {
  el.addEventListener('click', async () => {
    const all = Array.from(document.querySelectorAll('button'));
    all.forEach((b) => (b.disabled = true));
    try {
      await run();
    } catch (e) {
      log('Failed:', e instanceof Error ? e.message : String(e));
      console.error(e);
    } finally {
      all.forEach((b) => (b.disabled = b.dataset.locked === 'true'));
    }
  });
}
