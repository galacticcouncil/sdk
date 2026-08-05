import { AnyChain, AssetRoute } from '@galacticcouncil/xc-core';
import { TransferBuilder } from '@galacticcouncil/xc-sdk';
import { tags } from '@galacticcouncil/xc-cfg';

import { sign } from './signers';
import { xc } from './setup';
import { claimDeposits, claimWithdraws } from './utils/claim';
import { claimVaa } from './utils/vaa';

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
// see EnsureAddressTruncated) or the same h160.
//
// The two hydration routes are NOT equivalent for wormhole: an ss58 signs
// one batched `EVM.call` extrinsic, whose logs are missing from the ethereum
// view of some hydration rpcs - including the one the guardians read - so the
// message is published on chain but never attested. An h160 signs plain evm
// txs, which are observed normally. Outbound tests use the h160 until that is
// fixed. (ss58 5F2SeXfnUuvQ7nux5b7dTHgUoePgiCW38Czk78YQuJPfjunb, bound to
// 0x82fb02afe02fe5d6c793145a75e6860c4e206682, is the batched route.)
const EVM_ADDRESS = '0x23812ff0cDdd7157C4760E3BB2d39f5f323a7D3c';
const HYDRATION_ADDRESS = '5F2SeXfnUuvQ7nux5b7dTHgUoePgiCW38Czk78YQuJPfjunb';
const SOLANA_ADDRESS = '5mcfpAMophavx1m15v4YYPNUrv4vqErAUzJV7Ct5wr7v';
const SUI_ADDRESS =
  '0x6a07fa01f106d6b4822007ab2f47270bbf31ee446db302d049b4615c46f01c7d';

const addressOf = (chain: AnyChain): string => {
  if (chain.isSolana()) return SOLANA_ADDRESS;
  if (chain.isSui()) return SUI_ADDRESS;
  if (chain.isEvmChain()) return EVM_ADDRESS;
  return HYDRATION_ADDRESS;
};

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
      Number(b.source.isEvmParachain()) - Number(a.source.isEvmParachain()) ||
      a.source.name.localeCompare(b.source.name) ||
      a.route.source.asset.originSymbol.localeCompare(
        b.route.source.asset.originSymbol
      )
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
 * claim is paid there; withdrawals are redeemed on whichever chain they
 * target - one `receiveMessage` on an evm chain, a jito bundle on solana
 * (post the vaa, redeem, release), a single ptb on sui.
 *
 * Each is paid by whoever signs on that chain, which is what `addressOf`
 * resolves - the solana payer needs sol for the bundle & the recipient's
 * token account rent.
 */
const claim = {
  in: () => claimDeposits(HYDRATION_ADDRESS, addressOf, log),
  out: () => claimWithdraws(HYDRATION_ADDRESS, addressOf, log),
  // Anything the two above never list - a transfer addressed to someone
  // else, or one whose emitter matches no registry entry. Hydration is paid
  // by the h160 rather than the ss58 addressOf hands out, so the claim is a
  // plain receiveMessage rather than an EVM.call dispatch.
  vaa: (input: string, force = false) =>
    claimVaa(
      input,
      (chain) => (chain.isEvmParachain() ? EVM_ADDRESS : addressOf(chain)),
      log,
      force
    ),
};

/**
 * Serialize clicks - every step needs a wallet confirmation. Buttons
 * locked for a missing address stay disabled.
 */
function bind(el: HTMLButtonElement, run: () => Promise<unknown>) {
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

// Grouped by source chain - a chain pair alone isn't unique, six tokens
// share hydration -> ethereum.
const groups = new Map<AnyChain, NttRoute[]>();
ROUTES.forEach((entry) => {
  const group = groups.get(entry.source) ?? [];
  group.push(entry);
  groups.set(entry.source, group);
});

groups.forEach((entries, chain) => {
  const heading = document.createElement('h2');
  heading.textContent = 'From ' + chain.name;
  routesEl.appendChild(heading);

  const row = document.createElement('div');
  row.className = 'row';
  entries.forEach((entry) => {
    const { asset } = entry.route.source;
    const dst = entry.route.destination;

    const button = document.createElement('button');
    button.textContent = `${asset.originSymbol} → ${dst.chain.name}`;

    const missing = [entry.source, dst.chain]
      .map(addressOf)
      .some((a) => a.startsWith('INSERT'));
    if (missing) {
      button.disabled = true;
      button.dataset.locked = 'true';
      button.title = `No address set for ${dst.chain.name}`;
    } else {
      button.title = `${asset.key} → ${dst.asset.key}`;
    }

    row.appendChild(button);
    bind(button, () => transfer(entry, amountInput.value));
  });
  routesEl.appendChild(row);
});

// Delivery is self-redeem, so the claim buttons are the second half of
// every transfer - deposits are paid on hydration, withdrawals on the
// chain they target.
bind(document.getElementById('claim-in') as HTMLButtonElement, claim.in);
bind(document.getElementById('claim-out') as HTMLButtonElement, claim.out);

const vaaInput = document.getElementById('vaa') as HTMLTextAreaElement;
const vaaForce = document.getElementById('vaa-force') as HTMLInputElement;
bind(document.getElementById('claim-vaa') as HTMLButtonElement, () =>
  claim.vaa(vaaInput.value, vaaForce.checked)
);

log('Ready.', ROUTES.length, 'ntt routes, self-redeem delivery.');

(window as any).ntt = { transfer, claim, routes: ROUTES, xc };
