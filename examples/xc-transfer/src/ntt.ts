import { AnyChain, AssetRoute } from '@galacticcouncil/xc-core';
import { TransferBuilder } from '@galacticcouncil/xc-sdk';
import { tags } from '@galacticcouncil/xc-cfg';

import { sign } from './signers';
import { xc } from './setup';
import { claimDeposits, claimWithdraws } from './utils/claim';

const { config, wallet } = xc;
const { Tag } = tags;

/**
 * NTT transfer test — drives whatever the sdk registers under the `Ntt`
 * tag, so wiring a new token in xc-cfg shows up here without changes.
 *
 * Delivery is self-redeem: nothing relays the VAA, so a transfer only
 * completes once `claim` is run against the destination chain.
 */

// Evm chains sign with the h160; hydration takes an ss58 (bound on chain,
// see EnsureAddressTruncated) or the same h160. The ss58 below is bound to
// 0x82fb02afe02fe5d6c793145a75e6860c4e206682.
const EVM_ADDRESS = '0x23812ff0cDdd7157C4760E3BB2d39f5f323a7D3c';
const HYDRATION_ADDRESS = '5F2SeXfnUuvQ7nux5b7dTHgUoePgiCW38Czk78YQuJPfjunb';

const addressOf = (chain: AnyChain) =>
  chain.isEvmChain() ? EVM_ADDRESS : HYDRATION_ADDRESS;

type NttRoute = { source: AnyChain; route: AssetRoute };

/** Whatever the sdk registers under the Ntt tag, hydration side first. */
const ROUTES: NttRoute[] = Array.from(config.routes.values())
  .flatMap((chainRoutes) =>
    chainRoutes
      .getRoutes()
      .filter((route) => route.tags?.includes(Tag.Ntt))
      .map((route) => ({ source: chainRoutes.chain, route }))
  )
  .sort(
    (a, b) =>
      Number(b.source.isEvmParachain()) - Number(a.source.isEvmParachain())
  );

const out = document.getElementById('log')!;
const amountInput = document.getElementById('amount') as HTMLInputElement;
const routesEl = document.getElementById('routes')!;

const stringify = (v: unknown) =>
  typeof v === 'string'
    ? v
    : JSON.stringify(v, (_k, val) =>
        typeof val === 'bigint' ? val.toString() : val
      );

/** Mirror onto the page so the flow is readable without devtools. */
function log(...args: unknown[]) {
  console.log(...args);
  out.textContent += args.map(stringify).join(' ') + '\n';
  out.scrollTop = out.scrollHeight;
}

const fmt = (amount: { toDecimal(): string; originSymbol: string }) =>
  [amount.toDecimal(), amount.originSymbol].join(' ');

async function transfer({ source, route }: NttRoute, amount: string) {
  const destination = route.destination.chain;
  const asset = route.source.asset;

  log('---', source.key, '->', destination.key, amount, asset.originSymbol);

  // Pinned to the ntt route & its destination asset - another bridge may
  // serve the same pair (eth goes via snowbridge too).
  const transfer = await TransferBuilder(wallet)
    .withAsset(asset)
    .withSource(source)
    .withDestination(destination)
    .build({
      srcAddress: addressOf(source),
      dstAddress: addressOf(destination),
      dstAsset: route.destination.asset,
      tag: Tag.Ntt,
    });

  log('Balance:', fmt(transfer.source.balance));
  log('Max:', fmt(transfer.source.max));
  log('Validations:', await transfer.validate());

  const [calls, fee] = await Promise.all([
    transfer.buildCalls(amount),
    transfer.estimateFee(amount),
  ]);
  log('Estimated fee:', fmt(fee));

  // [approve?, transfer] on an evm chain - the manager pulls the erc20 via
  // transferFrom. From an ss58 origin the same sequence arrives batched in
  // a single EVM.call.
  log('Signing', calls.length, 'call(s)');
  console.log(calls);

  // Only meaningful with nothing pending - the transfer reverts in
  // simulation while an approve is still ahead of it.
  if (calls.length === 1) {
    log('Dry run:', await calls[0].dryRun());
  }

  for (const [i, call] of calls.entries()) {
    log('Sign', i + 1, 'of', calls.length, '- confirm in wallet');
    await sign(call, source);
  }

  log('Sent. Claim once the vaa is signed (~15m from ethereum).');
}

/**
 * Self-redeem of a delivered transfer. Deposits land on hydration, so the
 * claim is paid there; withdrawals are redeemed on the evm side.
 */
const claim = {
  in: () => claimDeposits(HYDRATION_ADDRESS, HYDRATION_ADDRESS),
  out: () => claimWithdraws(HYDRATION_ADDRESS, EVM_ADDRESS),
};

/** Serialize clicks - every step needs a wallet confirmation. */
function bind(el: Element, run: () => Promise<unknown>) {
  el.addEventListener('click', async () => {
    const all = Array.from(document.querySelectorAll('button'));
    all.forEach((b) => (b.disabled = true));
    try {
      await run();
    } catch (e) {
      log('Failed:', e instanceof Error ? e.message : String(e));
      console.error(e);
    } finally {
      all.forEach((b) => (b.disabled = false));
    }
  });
}

ROUTES.forEach((entry, i) => {
  const button = document.createElement('button');
  button.textContent = `${entry.source.name} → ${entry.route.destination.chain.name}`;
  if (i === 0) button.className = 'primary';
  routesEl.appendChild(button);
  bind(button, () => transfer(entry, amountInput.value));
});

bind(document.getElementById('claim-out')!, () => claim.out());
bind(document.getElementById('claim-in')!, () => claim.in());

log('Ready.', ROUTES.length, 'ntt route(s), self-redeem delivery.');
ROUTES.forEach(({ source, route }) =>
  log(
    ' ',
    source.key,
    '->',
    route.destination.chain.key,
    `(${route.source.asset.key} -> ${route.destination.asset.key})`
  )
);

(window as any).ntt = { transfer, claim, routes: ROUTES };
