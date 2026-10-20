import {
  AnyEvmChain,
  NearChain,
  NearDeposit,
  NearGas,
  NttTokenDef,
} from '@galacticcouncil/xc-core';

import { parseAbiItem, type PublicClient } from 'viem';

import { encoding } from '@wormhole-foundation/sdk-base';
import {
  deserialize,
  UniversalAddress,
} from '@wormhole-foundation/sdk-definitions';
import {
  Ntt,
  register as registerNttPayloads,
} from '@wormhole-foundation/sdk-definitions-ntt';

import { NearCall } from './types';
import { toNearCall } from './utils';

function parseVaa(vaaRaw: string) {
  // The ntt payload layouts stopped registering on import in 7.x, they are
  // opt-in now - `deserialize` throws without this. Idempotent.
  registerNttPayloads();
  return deserialize('Ntt:WormholeTransfer', encoding.b64.decode(vaaRaw));
}

const TRANSFER_SENT = parseAbiItem(
  'event TransferSent(bytes32 indexed recipient, bytes32 indexed refundAddress, uint256 amount, uint256 fee, uint16 recipientChain, uint64 msgSequence)'
);

/**
 * Blocks stamped with `timestamp` (seconds), the one a vaa carries.
 *
 * - Brackets it stepping back from the head, then interpolates on the block
 *   timestamps, bisecting where an estimate lands on the bracket
 * - Widened from the block it hits to every block sharing its timestamp:
 *   hydration stamps its 2s blocks with a 6s slot clock, three alike
 * - The gap between two blocks when none carries it exactly
 */
async function blocksAt(
  provider: PublicClient,
  timestamp: bigint
): Promise<{ fromBlock: bigint; toBlock: bigint }> {
  const head = await provider.getBlock();
  let hi = head;
  let lo = head;
  for (let step = 1024n; lo.timestamp > timestamp && lo.number > 0n; ) {
    hi = lo;
    lo = await provider.getBlock({
      blockNumber: lo.number > step ? lo.number - step : 0n,
    });
    step *= 4n;
  }

  let hit = [lo, hi].find((b) => b.timestamp === timestamp);
  while (!hit && hi.number - lo.number > 1n) {
    const span = hi.number - lo.number;
    let n =
      lo.number +
      ((timestamp - lo.timestamp) * span) / (hi.timestamp - lo.timestamp);
    if (n <= lo.number || n >= hi.number) {
      n = lo.number + span / 2n;
    }
    const block = await provider.getBlock({ blockNumber: n });
    if (block.timestamp === timestamp) {
      hit = block;
    } else if (block.timestamp < timestamp) {
      lo = block;
    } else {
      hi = block;
    }
  }
  if (!hit) {
    return { fromBlock: lo.number, toBlock: hi.number };
  }

  const stamped = async (blockNumber: bigint) =>
    (await provider.getBlock({ blockNumber })).timestamp === timestamp;
  let fromBlock = hit.number;
  while (fromBlock > 0n && (await stamped(fromBlock - 1n))) {
    fromBlock--;
  }
  let toBlock = hit.number;
  while (toBlock < head.number && (await stamped(toBlock + 1n))) {
    toBlock++;
  }
  return { fromBlock, toBlock };
}

export class NearClaim {
  readonly #chain: NearChain;

  constructor(chain: NearChain) {
    this.#chain = chain;
  }

  /**
   * Redeem NTT transfer on NEAR.
   *
   * - Anyone may submit it, the tokens go to the account the vaa names
   * - The vaa names that account by its sha256 only, so it is passed in plain
   *   and checked against the hash here
   * - A first time recipient is registered on the token out of the deposit,
   *   the rest is refunded
   *
   * @param from - payer
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on NEAR
   * @param recipient - account the vaa pays out to, the payer by default
   * @returns claim (complete) call
   */
  redeem(
    from: string,
    vaaRaw: string,
    ntt: NttTokenDef,
    recipient: string = from
  ): NearCall {
    const vaa = parseVaa(vaaRaw);
    const { recipientAddress } = vaa.payload.nttManagerPayload.payload;
    if (!recipientAddress.equals(new UniversalAddress(recipient, 'sha256'))) {
      throw new Error(
        'Vaa pays out to ' + recipientAddress.toString() + ', not ' + recipient
      );
    }

    return toNearCall(from, ntt.manager, [
      {
        methodName: 'complete',
        args: {
          vaa: encoding.hex.encode(encoding.b64.decode(vaaRaw)),
          account_id: recipient,
        },
        gas: NearGas.complete,
        deposit: NearDeposit.complete,
      },
    ]);
  }

  /**
   * Whether the vaa pays out to `account`.
   *
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param account - NEAR account
   */
  isPayee(vaaRaw: string, account: string): boolean {
    const vaa = parseVaa(vaaRaw);
    const { recipientAddress } = vaa.payload.nttManagerPayload.payload;
    return recipientAddress.equals(new UniversalAddress(account, 'sha256'));
  }

  /**
   * The account a vaa pays out to, as its sender published it on the source
   * chain - what any claimer passes to {@link redeem}.
   *
   * - A transfer to a NEAR implicit account, such as a 1Click deposit
   *   address, publishes its 32 bytes as the ntt refund address
   * - Read from the manager's `TransferSent` in the blocks stamped with the
   *   vaa's timestamp, and kept only if it hashes to the payee: a transfer
   *   that published nothing carries the payee hash itself there
   *
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param source - evm chain the transfer left from
   * @returns the account, or undefined when none was published
   */
  async findRecipient(
    vaaRaw: string,
    source: AnyEvmChain
  ): Promise<string | undefined> {
    const vaa = parseVaa(vaaRaw);
    const { sourceNttManager, nttManagerPayload } = vaa.payload;
    const { recipientAddress } = nttManagerPayload.payload;

    const provider = source.evmClient.getProvider();
    const blocks = await blocksAt(provider, BigInt(vaa.timestamp));
    const manager = sourceNttManager.toUint8Array().subarray(12);
    const logs = await provider.getLogs({
      address: encoding.hex.encode(manager, true) as `0x${string}`,
      event: TRANSFER_SENT,
      args: { recipient: recipientAddress.toString() as `0x${string}` },
      ...blocks,
    });

    return logs
      .map((log) => log.args.refundAddress?.slice(2))
      .find(
        (account) =>
          !!account &&
          recipientAddress.equals(new UniversalAddress(account, 'sha256'))
      );
  }

  /**
   * Complete an inbound transfer queued by the contract rate limit.
   *
   * Callable by anyone once 24h passed since the transfer was redeemed
   * while the inbound limit was exhausted.
   *
   * @param from - claimer address
   * @param digest - queued transfer message digest
   * @param ntt - NTT token deployment on NEAR
   * @returns release inbound call
   */
  completeInboundQueuedTransfer(
    from: string,
    digest: string,
    ntt: NttTokenDef
  ): NearCall {
    return toNearCall(from, ntt.manager, [
      {
        methodName: 'release_inbound',
        args: { digest },
        gas: NearGas.payOut,
        deposit: 0n,
      },
    ]);
  }

  /**
   * Pay out what failed pay outs credited the signer - an unlock or a refund
   * whose ft_transfer failed.
   *
   * @param from - account to pay out
   * @param ntt - NTT token deployment on NEAR
   * @returns claim call
   */
  claim(from: string, ntt: NttTokenDef): NearCall {
    return toNearCall(from, ntt.manager, [
      {
        methodName: 'claim',
        args: {},
        gas: NearGas.payOut,
        deposit: NearDeposit.oneYocto,
      },
    ]);
  }

  /**
   * Whether the contract already executed the transfer.
   *
   * - Replay is keyed by the ntt message digest, not the vaa hash
   * - A transfer queued by the rate limit reads as executed
   *
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on NEAR
   */
  isRedeemed(vaaRaw: string, ntt: NttTokenDef): Promise<boolean> {
    const vaa = parseVaa(vaaRaw);
    const digest = Ntt.messageDigest(
      vaa.emitterChain,
      vaa.payload.nttManagerPayload
    );
    return this.#chain.client.view<boolean>(ntt.manager, 'is_executed', {
      digest: encoding.hex.encode(digest),
    });
  }
}
