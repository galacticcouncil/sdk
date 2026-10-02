import { jest } from '@jest/globals';

import { NearChain } from '@galacticcouncil/xc-core';

import { encoding } from '@wormhole-foundation/sdk-base';
import {
  createVAA,
  serialize,
  UniversalAddress,
} from '@wormhole-foundation/sdk-definitions';
import { register as registerNttPayloads } from '@wormhole-foundation/sdk-definitions-ntt';

import { NearClaim } from './NearClaim';

const NTT = {
  token: 'wrap.testnet',
  manager: 'ntt-near.whm-ntt-0bugdc.testnet',
  transceiver: { wormhole: 'ntt-near.whm-ntt-0bugdc.testnet' },
};

const RECIPIENT = 'bob.testnet';
const PAYER = 'alice.testnet';

/** Hydration -> NEAR transfer of 1.5 wNEAR, paying out to `recipient`. */
const buildVaa = (recipient: string): string => {
  registerNttPayloads();
  const vaa = createVAA('Ntt:WormholeTransfer', {
    guardianSet: 0,
    signatures: [],
    timestamp: 0,
    nonce: 0,
    emitterChain: 'Hydration',
    emitterAddress: new UniversalAddress(
      '0x5e875F689EA8dd25e11a69cfb6C9f844C4b3B207'
    ),
    sequence: 7n,
    consistencyLevel: 202,
    payload: {
      sourceNttManager: new UniversalAddress(
        '0x5b1334885320cFd7158760256c7bD0Af58006b09'
      ),
      recipientNttManager: new UniversalAddress(NTT.manager, 'sha256'),
      nttManagerPayload: {
        id: new Uint8Array(32),
        sender: new UniversalAddress(
          '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
        ),
        payload: {
          trimmedAmount: { amount: 150_000_000n, decimals: 8 },
          sourceToken: new UniversalAddress(
            '0x000000000000000000000000000000010000054b'
          ),
          recipientAddress: new UniversalAddress(recipient, 'sha256'),
          recipientChain: 'Near',
          additionalPayload: new Uint8Array(0),
        },
      },
    },
  });
  return encoding.b64.encode(serialize(vaa));
};

/**
 * NEAR testnet -> hydration 0.5 wNEAR, signed by the testnet guardian
 * (15/34831e4d…7213/1). Its ntt digest, the contracts' replay key, is known.
 */
const TESTNET_VAA =
  'AQAAAAABAKg9d9aF2PvHNbMZILrTyjz56wJLoSATtsYesa6M53CtUE462ElXOzf/uVP1h255+maLIuCQoDpLJ4Ohftjsw2AAarWhOAAAAAAADzSDHk26Dqghy38K8M6W9e/kvrDbH97RIhnkMp/5WnITAAAAAAAAAAEAmUX/EDSDHk26Dqghy38K8M6W9e/kvrDbH97RIhnkMp/5WnITAAAAAAAAAAAAAAAAWxM0iFMgz9cVh2AlbHvQr1gAawkAkQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfq7O60PPN53b+b3jkJm4NHMQjI5Of2LSuSxgFBG9mgUAT5lOVFQIAAAAAAL68IAivOuPL0zE4YdQa+ARQ1OYV5jJDYMGOlxwv21gdEnXcwAAAAAAAAAAAAAAABERERERERERERERERERERERERERAEkAAA==';
const TESTNET_DIGEST =
  'ddfc845aea67c7468f6371bdfd301d6d4a559760e61b9777e140946374f5d3af';

const mockChain = (
  view = async (..._args: unknown[]): Promise<unknown> => false
) => ({ client: { view } }) as unknown as NearChain;

describe('NearClaim', () => {
  describe('redeem', () => {
    it('should complete the vaa for the account it pays out to', () => {
      const vaa = buildVaa(RECIPIENT);
      const call = new NearClaim(mockChain()).redeem(
        PAYER,
        vaa,
        NTT,
        RECIPIENT
      );

      expect(call.from).toBe(PAYER);
      expect(call.receiverId).toBe(NTT.manager);
      expect(call.actions).toHaveLength(1);
      expect(call.actions[0]).toMatchObject({
        methodName: 'complete',
        args: {
          // Plain hex, the contract decodes no 0x prefix.
          vaa: Buffer.from(vaa, 'base64').toString('hex'),
          account_id: RECIPIENT,
        },
        deposit: 10n ** 22n,
      });
    });

    it('should default the recipient to the payer', () => {
      const call = new NearClaim(mockChain()).redeem(
        RECIPIENT,
        buildVaa(RECIPIENT),
        NTT
      );
      expect(call.actions[0].args.account_id).toBe(RECIPIENT);
    });

    // The contract would refuse it too, after the payer spent the gas.
    it('should reject an account the vaa does not pay out to', () => {
      expect(() =>
        new NearClaim(mockChain()).redeem(PAYER, buildVaa(RECIPIENT), NTT)
      ).toThrow('not ' + PAYER);
    });
  });

  describe('isRedeemed', () => {
    it('should ask the contract for the ntt message digest', async () => {
      const view = jest.fn(async (..._args: unknown[]) => true);
      const redeemed = await new NearClaim(mockChain(view)).isRedeemed(
        TESTNET_VAA,
        NTT
      );

      expect(redeemed).toBe(true);
      expect(view).toHaveBeenCalledWith(NTT.manager, 'is_executed', {
        digest: TESTNET_DIGEST,
      });
    });
  });

  it('should pay out a queued transfer by its digest', () => {
    const call = new NearClaim(mockChain()).completeInboundQueuedTransfer(
      PAYER,
      TESTNET_DIGEST,
      NTT
    );
    expect(call.actions[0]).toMatchObject({
      methodName: 'release_inbound',
      args: { digest: TESTNET_DIGEST },
      deposit: 0n,
    });
  });

  it('should claim with the one yocto the contract asserts', () => {
    const call = new NearClaim(mockChain()).claim(PAYER, NTT);
    expect(call.actions[0]).toMatchObject({
      methodName: 'claim',
      deposit: 1n,
    });
  });
});
