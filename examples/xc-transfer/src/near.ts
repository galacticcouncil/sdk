import { big } from '@galacticcouncil/common';
import { Asset, NearChain, NearTxOutcome } from '@galacticcouncil/xc-core';
import { NearCall, TransferBuilder } from '@galacticcouncil/xc-sdk';
import { clients, testnet } from '@galacticcouncil/xc-cfg';

import { signNear } from './signers';
import {
  connectNear,
  disconnectNear,
  NearConnection,
  reconnectNear,
} from './signers/nearConnect';
import { bind, fmt, log } from './utils/page';
import { xc } from './setup';

const { config, wallet } = xc;

/**
 * NEAR testnet -> hydration over ntt, against whm's near-ntt deployment.
 *
 * The NEAR half is live on testnet. Hydration is on no wormhole testnet, so
 * its leg exists on a chopsticks fork only - `registerNear` attaches it to the
 * config, and a signed vaa is delivered there by whm's delivery probe.
 */
testnet.registerNear(config);

const near = config.getChain('near_testnet') as NearChain;
const hydration = config.getChain('hydration');
const wnear = config.getAsset('wnear');
const native = config.getAsset('near');

const VAA_API = 'https://api.testnet.wormholescan.io/api/v1/vaas';

/** Testnet guardian polls - about five minutes. */
const VAA_POLLS = 60;

// Same default recipient as the ntt page.
const EVM_ADDRESS = '0x23812ff0cDdd7157C4760E3BB2d39f5f323a7D3c';

const accountInput = document.getElementById('account') as HTMLInputElement;
const recipientInput = document.getElementById('recipient') as HTMLInputElement;
const amountInput = document.getElementById('amount') as HTMLInputElement;
const connectButton = document.getElementById('connect') as HTMLButtonElement;
const transferButtons = ['near', 'wnear'].map(
  (id) => document.getElementById(id) as HTMLButtonElement
);

recipientInput.value = EVM_ADDRESS;

/** The connected wallet signs; transfers stay locked without one. */
let connection: NearConnection | undefined;

function setConnection(next: NearConnection | undefined) {
  connection = next;
  connectButton.textContent = next ? 'Disconnect' : 'Connect wallet';
  accountInput.value = next?.accountId ?? '';
  for (const button of transferButtons) {
    button.dataset.locked = String(!next);
    button.disabled = !next;
  }
}

async function toggleWallet() {
  if (connection) {
    await disconnectNear();
    setConnection(undefined);
    log('Disconnected.');
    return;
  }
  setConnection(await connectNear());
  log('Connected:', connection!.accountId);
}

const toWnear = (amount: bigint) => big.toDecimal(amount, 24) + ' wNEAR';

/** The wormhole message a transfer published - the core logs it flat. */
function findMessage(
  outcome: NearTxOutcome
): { emitter: string; seq: number } | undefined {
  return outcome.receipts_outcome
    .flatMap((r) => r.outcome.logs)
    .filter((l) => l.startsWith('EVENT_JSON:'))
    .map((l) => JSON.parse(l.slice('EVENT_JSON:'.length)))
    .find((e) => e.standard === 'wormhole' && e.event === 'publish');
}

async function waitForVaa(emitter: string, seq: number): Promise<boolean> {
  const url = `${VAA_API}/15/${emitter}/${seq}`;
  log('Waiting for the testnet guardian:', url);
  for (let i = 0; i < VAA_POLLS; i++) {
    const res = await fetch(url);
    if (res.ok) {
      const { data } = await res.json();
      if (data?.vaa) {
        return true;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return false;
}

async function transfer(asset: Asset) {
  if (!connection) {
    throw new Error('Connect a wallet first');
  }
  const { accountId: account, wallet: signer } = connection;
  const recipient = recipientInput.value.trim();
  const amount = amountInput.value;

  log('---', amount, asset.originSymbol, near.key, '->', hydration.key);

  const transfer = await TransferBuilder(wallet)
    .withAsset(asset)
    .withSource(near)
    .withDestination(hydration)
    .build({
      srcAddress: account,
      dstAddress: recipient,
      dstAsset: wnear,
    });

  log('Balance:', fmt(transfer.source.balance));
  log('Max:', fmt(transfer.source.max));
  // Prepaid gas & deposits the account has to hold - unused gas comes back.
  log('Fee:', fmt(transfer.source.fee));
  // Checks reading the hydration leg fail here, it only exists on the fork.
  log('Validations:', await transfer.validate(undefined, amount));

  // One transaction: [storage_deposit?, near_deposit?, ft_transfer_call].
  const [call] = (await transfer.buildCalls(amount)) as NearCall[];
  log(
    'Signing',
    call.receiverId + ':',
    call.actions.map((a) => a.methodName).join(' + ')
  );

  if (call.actions.length > 1) {
    // NEP-518 carries one action per ethereum transaction, so an ethereum
    // wallet asks once per action; NEAR wallets sign the batch at once.
    log('Approve in the wallet - once per action for an ethereum wallet.');
  }
  const outcome = await signNear(call, near, signer);
  if (!outcome) {
    log('No outcome returned - a redirecting wallet; check the explorer.');
    return;
  }

  const hash = outcome.transaction.hash;
  log('Sent:', near.explorer + 'txns/' + hash);

  const message = findMessage(outcome);
  if (!message) {
    log('No wormhole message published - outcome in the console.');
    console.log(outcome);
    return;
  }

  if (!(await waitForVaa(message.emitter, message.seq))) {
    log('Not signed yet - poll the url above.');
    return;
  }

  log('Signed. Deliver it on a hydration fork, from ../whm:');
  log(
    'HYDRATION_NTT_OUT=<hydration-ntt>/evm/out npx tsx ' +
      'chopsticks/probes/_probeNearNttDelivery.ts ' +
      `--emitter ${message.emitter} --sequence ${message.seq}`
  );
}

async function status() {
  const ntt = clients.nttClient(near, wnear);
  const [outbound, inbound, custody] = await Promise.all([
    ntt.getOutboundLimit(),
    ntt.getInboundLimit(hydration),
    ntt.getCustody(),
  ]);

  log('---', 'ntt', near.key);
  log(
    'Outbound:',
    toWnear(outbound.capacity),
    'of',
    toWnear(outbound.limit),
    'per 24h'
  );
  log(
    'Inbound from hydration:',
    toWnear(inbound.capacity),
    'of',
    toWnear(inbound.limit),
    'per 24h'
  );
  log('Locked:', toWnear(custody ?? 0n));

  const account = connection?.accountId;
  if (account) {
    const balances = await near.getBalances([native, wnear], account);
    log(account + ':', balances.map(fmt).join(', '));
  }
}

bind(document.getElementById('near') as HTMLButtonElement, () =>
  transfer(native)
);
bind(document.getElementById('wnear') as HTMLButtonElement, () =>
  transfer(wnear)
);
bind(document.getElementById('status') as HTMLButtonElement, status);
bind(connectButton, toggleWallet);
setConnection(undefined);

log('Ready.', near.name, '->', hydration.name, 'via ntt.');

reconnectNear()
  .then((kept) => {
    if (kept) {
      setConnection(kept);
      log('Connected:', kept.accountId);
    }
  })
  .catch((err) => log('Wallet reconnect failed:', String(err)));

(window as any).near = {
  transfer,
  status,
  xc,
};
