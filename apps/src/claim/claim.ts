import {
  addr,
  AnyChain,
  AnyEvmChain,
  EvmParachain,
  NttTokenDef,
  SolanaChain,
  SuiChain,
  Wormhole,
} from '@galacticcouncil/xc-core';
import {
  Call,
  EvmCall,
  EvmClaim,
  SolanaClaim,
  SubstrateClaim,
  SuiClaim,
  WormholeScan,
} from '@galacticcouncil/xc-sdk';

import {
  deserializeLayout,
  encoding,
  type Layout,
} from '@wormhole-foundation/sdk-base';

import { config } from '../setup';

const { EvmAddr, Ss58Addr } = addr;

const whScan = new WormholeScan();

// Signed ntt transfer vaa, chains kept as raw wormhole ids. The sdk's own
// `Ntt:WormholeTransfer` layout maps every chain id to a name and rejects
// ids its registry predates - the config here is what knows the chains, so
// the ids are all that is read.
const bytes32 = { binary: 'bytes', size: 32 } as const;
const nttTransferVaaLayout = [
  { name: 'version', binary: 'uint', size: 1 },
  { name: 'guardianSet', binary: 'uint', size: 4 },
  {
    name: 'signatures',
    binary: 'array',
    lengthSize: 1,
    layout: { binary: 'bytes', size: 66 },
  },
  { name: 'timestamp', binary: 'uint', size: 4 },
  { name: 'nonce', binary: 'uint', size: 4 },
  { name: 'emitterChain', binary: 'uint', size: 2 },
  { name: 'emitterAddress', ...bytes32 },
  { name: 'sequence', binary: 'uint', size: 8 },
  { name: 'consistencyLevel', binary: 'uint', size: 1 },
  {
    name: 'prefix',
    binary: 'bytes',
    custom: Uint8Array.from([0x99, 0x45, 0xff, 0x10]),
    omit: true,
  },
  { name: 'sourceNttManager', ...bytes32 },
  { name: 'recipientNttManager', ...bytes32 },
  {
    name: 'nttManagerPayload',
    binary: 'bytes',
    lengthSize: 2,
    layout: [
      { name: 'id', ...bytes32 },
      { name: 'sender', ...bytes32 },
      {
        name: 'payload',
        binary: 'bytes',
        lengthSize: 2,
        layout: [
          {
            name: 'prefix',
            binary: 'bytes',
            custom: Uint8Array.from([0x99, 0x4e, 0x54, 0x54]),
            omit: true,
          },
          { name: 'decimals', binary: 'uint', size: 1 },
          { name: 'amount', binary: 'uint', size: 8 },
          { name: 'sourceToken', ...bytes32 },
          { name: 'recipientAddress', ...bytes32 },
          { name: 'recipientChain', binary: 'uint', size: 2 },
          // Optional trailer, 2 byte length prefixed when present.
          { name: 'additionalPayload', binary: 'bytes' },
        ],
      },
    ],
  },
  { name: 'transceiverPayload', binary: 'bytes', lengthSize: 2 },
] as const satisfies Layout;

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
  /** Signed vaa, base64 */
  vaaRaw: string;
};

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

function chainById(wormholeId: number): AnyChain | undefined {
  return Array.from(config.chains.values()).find(
    (c) =>
      Wormhole.isKnown(c) &&
      Wormhole.fromChain(c).getWormholeId() === wormholeId
  );
}

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
 * Four things get pasted in practice: a wormholescan link, the bare vaa id
 * it ends with, the source transaction hash, or the signed bytes themselves
 * - base64 as the guardians issue them, or the 0x hex some explorers render.
 */
async function resolveVaa(input: string): Promise<string> {
  const trimmed = input.trim().replace(/\s+/g, '');
  if (!trimmed) {
    throw new Error('Paste a vaa, a tx hash, or a wormholescan link.');
  }

  const id = asVaaId(trimmed);
  if (id) {
    const operation = await whScan.getOperation(id);
    if (!operation.vaa) {
      throw new Error(id + ' has no signed vaa yet.');
    }
    return operation.vaa.raw;
  }

  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    const vaa = await whScan.getVaaByTxHash(trimmed);
    return vaa.vaa;
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
export async function readVaa(input: string): Promise<NttClaim> {
  const vaaRaw = await resolveVaa(input);

  let vaa;
  try {
    vaa = deserializeLayout(nttTransferVaaLayout, encoding.b64.decode(vaaRaw));
  } catch (e) {
    throw new Error(
      'Not a signed ntt transfer vaa - ' +
        (e instanceof Error ? e.message : String(e))
    );
  }

  const { recipientNttManager, nttManagerPayload } = vaa;
  const { recipientAddress, recipientChain, decimals, amount } =
    nttManagerPayload.payload;

  const chain = chainById(recipientChain);
  if (!chain) {
    throw new Error(
      'Vaa targets wormhole chain ' + recipientChain + ', not configured here.'
    );
  }

  const manager = encoding.hex.encode(recipientNttManager, true);
  const ntt = findNtt(chain, manager);
  if (!ntt) {
    throw new Error(
      'No ntt deployment on ' + chain.name + ' for manager ' + manager + '.'
    );
  }

  return {
    id: [
      vaa.emitterChain,
      encoding.hex.encode(vaa.emitterAddress),
      vaa.sequence,
    ].join('/'),
    chain: chain,
    ntt: ntt,
    recipient: toDisplayAddress(
      chain,
      encoding.hex.encode(recipientAddress, true)
    ),
    amount: String(Number(amount) / 10 ** decimals),
    vaaRaw: vaaRaw,
  };
}

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
 * Simulate an evm claim and name the revert, if any.
 *
 * The wallet would only report "execution reverted" - the mint cap is the
 * usual reason a claim that looks ready still fails, and it is worth naming
 * before asking for a signature.
 */
export async function simulate(
  call: EvmCall,
  chain: AnyEvmChain
): Promise<string | undefined> {
  try {
    await chain.evmClient.getProvider().call({
      account: call.from as `0x${string}`,
      to: call.to,
      data: call.data as `0x${string}`,
    });
    return undefined;
  } catch (e) {
    const data = revertData(e);
    return data ? (REVERTS[data] ?? data) : String(e);
  }
}

/**
 * Whether `payer` can sign a claim on `chain`.
 *
 * - Evm chains take an h160
 * - Hydration takes an h160 or an ss58 (the claim is then an EVM.call)
 * - Solana & sui addresses are left to their wallets to reject
 */
export function isValidPayer(chain: AnyChain, payer: string): boolean {
  if (chain instanceof EvmParachain) {
    return EvmAddr.isValid(payer) || Ss58Addr.isValid(payer);
  }
  if (chain instanceof SolanaChain || chain instanceof SuiChain) {
    return payer.length > 0;
  }
  return EvmAddr.isValid(payer);
}

/**
 * Claim call(s) for a transfer, paid by `payer` on the destination chain.
 *
 * Which platform redeems is a property of the message, not a choice - one
 * `receiveMessage` on an evm chain, a jito bundle on solana, a single ptb
 * on sui. On hydration an h160 payer keeps it a plain evm transaction, an
 * ss58 one routes through EVM.call instead.
 */
export async function buildClaim(
  claim: NttClaim,
  payer: string
): Promise<Call | Call[]> {
  const { chain, ntt, vaaRaw } = claim;

  if (chain instanceof SolanaChain) {
    return new SolanaClaim(chain).redeem(payer, vaaRaw, ntt);
  }
  if (chain instanceof SuiChain) {
    return new SuiClaim(chain).redeem(payer, vaaRaw, ntt);
  }
  if (chain instanceof EvmParachain && !EvmAddr.isValid(payer)) {
    const substrate = await SubstrateClaim.create(chain);
    return substrate.redeem(payer, vaaRaw, ntt);
  }
  if (!chain.isEvmChain() && !chain.isEvmParachain()) {
    throw new Error(chain.name + ' claims are not supported here.');
  }
  return new EvmClaim().redeem(payer, vaaRaw, ntt);
}
