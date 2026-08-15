import {
  addr,
  AnyChain,
  AnyEvmChain,
  NttTokenDef,
  SolanaChain,
  SuiChain,
  Wormhole,
} from '@galacticcouncil/xc-core';
import {
  EvmCall,
  EvmClaim,
  SolanaClaim,
  SuiClaim,
} from '@galacticcouncil/xc-sdk';

import { chainToChainId, encoding } from '@wormhole-foundation/sdk-base';
import { deserialize } from '@wormhole-foundation/sdk-definitions';
import { register } from '@wormhole-foundation/sdk-definitions-ntt';

import { sign, signSolanaAll } from '../signers';
import { xc } from '../setup';

import { Logger, PayerOf } from './claim';
import { getWormholeChainById } from './wh';

const { EvmAddr } = addr;

// The ntt payload layouts stopped registering on import in 7.2.0, they are
// opt-in now - `deserialize` throws without this. Idempotent.
register();

export type NttClaim = {
  /** `chain/emitter/sequence`, rebuilt from the vaa header */
  id: string;
  /** Chain the claim is submitted on */
  chain: AnyChain;
  /** NTT deployment the message is addressed to */
  ntt: NttTokenDef;
  /** Who receives the tokens - not necessarily whoever pays */
  recipient: string;
  /** Human readable, trimmed to the smaller decimals of the two chains */
  amount: string;
};

/** `chain/emitter/sequence`, from a wormholescan link or the bare id. */
function asVaaId(input: string): string | undefined {
  const [path] = input.split('#/tx/').pop()!.split('?');
  const parts = path.split('/').filter((p) => p.length > 0);
  const isId =
    parts.length === 3 &&
    /^\d+$/.test(parts[0]) &&
    /^[0-9a-fA-F]{64}$/.test(parts[1]) &&
    /^\d+$/.test(parts[2]);
  return isId ? parts.join('/') : undefined;
}

/**
 * Whatever was pasted, as the base64 the claim apis take.
 *
 * Three things get pasted in practice: a wormholescan link, the bare vaa id
 * it ends with, or the signed bytes themselves - base64 as the guardians
 * issue them, or the 0x hex some explorers render.
 */
async function resolveVaa(input: string): Promise<string> {
  const trimmed = input.trim().replace(/\s+/g, '');
  if (!trimmed) {
    throw new Error('Paste a vaa, or a wormholescan link to one');
  }

  const id = asVaaId(trimmed);
  if (id) {
    const operation = await xc.wormhole.transfer.whScan.getOperation(id);
    if (!operation.vaa) {
      throw new Error(id + ' has no signed vaa yet');
    }
    return operation.vaa.raw;
  }

  if (/^(0x)?[0-9a-fA-F]+$/.test(trimmed) && trimmed.length > 200) {
    const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
    return encoding.b64.encode(encoding.hex.decode(hex));
  }

  return trimmed;
}

/**
 * NTT deployment the message is addressed to.
 *
 * Matched on the manager the transceiver payload names - the destination
 * side is what the claim needs, and it is the one value the message states
 * outright. Registry entries are chain native (an h160, a base58 program
 * id, a sui object id), so both sides go through `normalizeAddress` to a
 * 32 byte universal address before comparing.
 */
function findNtt(chain: AnyChain, manager: string): NttTokenDef | undefined {
  const wormhole = Wormhole.fromChain(chain);
  const wanted = manager.toLowerCase();
  return Object.values(wormhole.ntt).find(
    (def) => wormhole.normalizeAddress(def.manager).toLowerCase() === wanted
  );
}

/** Universal addresses are 32 bytes, evm ones the trailing 20. */
function toDisplayAddress(chain: AnyChain, universal: string): string {
  const isEvm = chain.isEvmChain() || chain.isEvmParachain();
  return isEvm ? '0x' + universal.slice(-40) : universal;
}

/**
 * Read a signed vaa and resolve everything the claim needs.
 *
 * Decoded here rather than read off wormholescan: the message names its
 * own destination, so a vaa pasted straight from a wallet or an explorer
 * claims without the indexer having caught up - and an operation the
 * indexer never matched to a deployment still resolves.
 *
 * @throws when the vaa isn't an ntt transfer, or targets a deployment
 * that isn't registered in the config
 */
export function readVaa(vaaRaw: string): NttClaim {
  let vaa;
  try {
    vaa = deserialize('Ntt:WormholeTransfer', encoding.b64.decode(vaaRaw));
  } catch (e) {
    throw new Error(
      'Not a signed ntt transfer vaa - ' +
        (e instanceof Error ? e.message : String(e))
    );
  }

  const { recipientNttManager, nttManagerPayload } = vaa.payload;
  const { recipientAddress, recipientChain, trimmedAmount } =
    nttManagerPayload.payload;

  const wormholeId = chainToChainId(recipientChain);
  const chain = getWormholeChainById(wormholeId);
  if (!chain) {
    throw new Error(
      'Vaa targets ' + recipientChain + ' (wormhole ' + wormholeId + '), not configured here'
    );
  }

  const manager = recipientNttManager.toString();
  const ntt = findNtt(chain, manager);
  if (!ntt) {
    throw new Error(
      'No ntt deployment on ' + chain.name + ' for manager ' + manager
    );
  }

  return {
    id: [
      chainToChainId(vaa.emitterChain),
      vaa.emitterAddress.toString().replace(/^0x/, ''),
      vaa.sequence,
    ].join('/'),
    chain: chain,
    ntt: ntt,
    recipient: toDisplayAddress(chain, recipientAddress.toString()),
    amount: String(Number(trimmedAmount.amount) / 10 ** trimmedAmount.decimals),
  };
}

/**
 * Reverts worth naming. An unknown selector is reported raw - it is
 * `bytes4(keccak256(signature))`, so it stays greppable against the
 * manager & transceiver sources.
 */
const REVERTS: Record<string, string> = {
  '0x303b682f':
    'MintLimitReached() - hydration issuance circuit breaker. Either the ' +
    "asset's AssetRegistry.xcm_rate_limit is used up for the 24h window, " +
    'or this one transfer is larger than the limit itself - in which case ' +
    'waiting for the window to reset never helps',
  '0x26fb55dd':
    'NotEnoughCapacity(uint256,uint256) - ntt manager inbound rate limit',
  '0x21138942':
    'TransceiverAlreadyAttestedToMessage(bytes32) - already delivered',
  '0x79b1ce56':
    'InvalidWormholePeer(uint16,bytes32) - emitter is not the peer the ' +
    'destination transceiver has registered',
};

/** Revert payload, wherever the rpc error chain buried it. */
function revertData(error: unknown): string | undefined {
  for (let e = error as { data?: unknown; cause?: unknown }; e; ) {
    if (typeof e.data === 'string' && e.data.startsWith('0x')) {
      return e.data;
    }
    e = e.cause as typeof e;
  }
  return undefined;
}

/**
 * Gas for a forced send. EvmSigner estimates first, which a reverting call
 * fails, so a fixed limit is the only way to get the transaction out - the
 * node never quotes one for a call it refuses to execute. Matches
 * SubstrateEvm's `Gas.redeem`, the budget a successful claim needs.
 */
const FORCED_GAS = 2_000_000n;

/**
 * Send a call the node already refused to simulate.
 *
 * Lands on chain as a reverted transaction: gas is spent, nothing is
 * minted, and the vaa stays unconsumed - so the claim is still replayable
 * afterwards. Only worth it as proof that the revert is real.
 */
async function sendForced(call: EvmCall, chain: AnyEvmChain, log: Logger) {
  const client = chain.evmClient;
  const provider = client.getProvider();
  const account = call.from as `0x${string}`;

  const wallet = client.getSigner(account);
  await wallet.switchChain({ id: client.chain.id });
  await wallet.request({ method: 'eth_requestAccounts' });

  // Same 5% surplus EvmSigner applies - the base fee drifts up every block,
  // and a tx priced at the bare quote is signed, handed back as a hash, then
  // dropped from the pool without ever reaching one.
  const gasPrice = await provider.getGasPrice();
  const gasPriceSurplus = gasPrice + (gasPrice * 5n) / 100n;

  const txHash = await wallet.sendTransaction({
    account: account,
    chain: client.chain,
    data: call.data as `0x${string}`,
    to: call.to,
    gas: FORCED_GAS,
    maxFeePerGas: gasPriceSurplus,
    maxPriorityFeePerGas: gasPriceSurplus,
  });
  log('  sent', txHash);

  const receipt = await provider.waitForTransactionReceipt({ hash: txHash });
  log(
    '  ' + receipt.status,
    'in block ' + receipt.blockNumber,
    '- gas used ' + receipt.gasUsed
  );
}

/**
 * Claim a wormhole NTT transfer, whoever it is addressed to.
 *
 * Which platform redeems is a property of the message, not a choice - one
 * `receiveMessage` on an evm chain, a jito bundle on solana, a single ptb
 * on sui. On hydration an h160 payer keeps it a plain evm transaction; an
 * ss58 one would route through EVM.call instead (see SubstrateClaim).
 *
 * The recipient is whoever the message names, not the payer - relaying is
 * permissionless, so a stuck transfer can be finished by anyone.
 *
 * @param input - wormholescan link, `chain/emitter/sequence`, or the vaa
 * @param payerOf - claim payer, resolved per destination chain
 * @param log - progress reporter
 * @param force - send even when the simulation reverts (evm, see sendForced)
 */
export async function claimVaa(
  input: string,
  payerOf: PayerOf,
  log: Logger = console.log,
  force = false
) {
  const vaaRaw = await resolveVaa(input);
  const { id, chain, ntt, recipient, amount } = readVaa(vaaRaw);
  const payer = payerOf(chain);

  log('Claim', id);
  log(' ', amount, '->', chain.name, recipient);

  // Solana posts the vaa to the core bridge before the manager can release,
  // so it is several transactions - bundled, since a partial run leaves the
  // claim half done.
  if (chain instanceof SolanaChain) {
    const calls = await new SolanaClaim(chain).redeem(payer, vaaRaw, ntt);
    log('  redeem on', ntt.manager, 'paid by', payer);
    log(' ', calls.length, 'txs as one bundle - confirm in wallet');
    await signSolanaAll(calls, chain);
    log('Claimed', id);
    return;
  }

  // Sui does the whole thing in one programmable transaction - verify the
  // vaa, redeem to the manager inbox, release.
  if (chain instanceof SuiChain) {
    const call = await new SuiClaim(chain).redeem(payer, vaaRaw, ntt);
    log('  redeem on', ntt.manager, 'paid by', payer);
    log('  1 ptb - confirm in wallet');
    await sign(call, chain);
    log('Claimed', id);
    return;
  }

  if (!chain.isEvmChain() && !chain.isEvmParachain()) {
    throw new Error(chain.name + ' claims are not wired here');
  }
  if (!EvmAddr.isValid(payer)) {
    throw new Error('Direct claim needs an evm payer, got ' + payer);
  }

  const call = new EvmClaim().redeem(payer, vaaRaw, ntt);
  log('  receiveMessage on', call.to, 'paid by', payer);

  // The wallet would only report "execution reverted" - the mint cap is the
  // usual reason a claim that looks ready still fails, and it is worth
  // naming before asking for a signature.
  const { evmClient } = chain as AnyEvmChain;
  try {
    await evmClient.getProvider().call({
      account: payer as `0x${string}`,
      to: call.to,
      data: call.data as `0x${string}`,
    });
  } catch (e) {
    const data = revertData(e);
    const reason = 'Reverts: ' + (data ? (REVERTS[data] ?? data) : String(e));
    if (!force) {
      throw new Error(reason);
    }
    log('  ' + reason);
    log('  forced - sending anyway, this spends gas and mints nothing');
    return sendForced(call, chain as AnyEvmChain, log);
  }

  log('  simulated ok - confirm in wallet');
  await sign(call, chain);
  log('Claimed', id);
}
