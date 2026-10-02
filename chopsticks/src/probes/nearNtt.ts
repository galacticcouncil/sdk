/**
 * PROBE (NEAR NTT <-> Hydration), driven by the sdk.
 *
 * whm's `_probeNearNttDelivery.ts`, with every user step going through the sdk
 * instead. The NEAR half is the live testnet deployment of whm near-ntt; the
 * Hydration half is deployed on a fork, at the addresses the NEAR contract is
 * peered with - no wormhole testnet observes Hydration.
 *
 *   1. fork hydration, deploy the wNEAR NTT pair (BURNING) the way hydration-ntt
 *      does, from whm's fixed deployer
 *   2. NEAR testnet -> hydration: sdk transfer signed with a NEAR key, the vaa
 *      signed by the testnet guardian
 *   3. claim it on the fork with the sdk - the core's guardian set at the vaa's
 *      index substituted with the key(s) that signed it, recovered from the vaa
 *   4. hydration -> NEAR testnet: sdk transfer on the fork, burn & published
 *      message checked - nothing observes the fork, so it is not delivered
 *
 *   HYDRATION_NTT_OUT=<hydration-ntt>/evm/out \
 *   NEAR_ACCOUNT=<you>.testnet NEAR_KEY=ed25519:… npm run probe:near
 *
 *   … -- --emitter <hex> --sequence <n>   deliver an earlier NEAR testnet
 *                                         transfer instead of sending one
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ConfigService,
  EvmClient,
  EvmParachain,
  NearChain,
  Ntt,
  Wormhole,
} from '@galacticcouncil/xc-core';
import {
  assetsMap,
  chainsMap,
  routesMap,
  testnet,
  validations,
} from '@galacticcouncil/xc-cfg';
import {
  EvmCall,
  EvmClaim,
  NearCall,
  NearKeyPair,
  NearSigner,
  TransferBuilder,
  Wallet,
} from '@galacticcouncil/xc-sdk';

import { encoding } from '@wormhole-foundation/sdk-base';
import {
  deserialize,
  deserializePayload,
  UniversalAddress,
} from '@wormhole-foundation/sdk-definitions';
import { register as registerNttPayloads } from '@wormhole-foundation/sdk-definitions-ntt';

import {
  concatHex,
  decodeAbiParameters,
  encodeAbiParameters,
  encodeDeployData,
  encodeFunctionData,
  keccak256,
  numberToHex,
  pad,
  recoverAddress,
  stringToHex,
  toEventSelector,
  type Abi,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { AccountId, Binary } from 'polkadot-api';

import {
  configs,
  EthClient,
  findEvmLogs,
  Fork,
  getEthereumExits,
  getEventsAt,
  spawn,
} from '../lib';

registerNttPayloads();

// ─── Constants ───────────────────────────────────────────────────

/**
 * whm's fixed, fresh fork deployer - `keccak256("whm near-ntt fork deployer")`,
 * nonce 0 on the fork - so the pair lands where the NEAR testnet contract is
 * peered: library 0, manager impl 1, manager proxy 2, init 3, transceiver
 * impl 4, transceiver proxy 5.
 */
const DEPLOYER_PK = keccak256(stringToHex('whm near-ntt fork deployer'));

/** The probe's own hydration account - recipient, claimer & sender. */
const USER_PK = keccak256(stringToHex('sdk near-ntt probe user'));

/** Registry template - an ntt-minted asset already on hydration. */
const TEMPLATE_ASSET_ID = 43;
const WETH_ASSET_ID = 20;
const HYDRATION_SS58_PREFIX = 63;

/** As the live hydration legs: 24h window, finalized. */
const RATE_LIMIT_DURATION = 86_400n;
const CONSISTENCY_LEVEL = 202;
const LIMIT = 10n ** 30n;

const NEAR_WORMHOLE_ID = 15;
const VAA_API = 'https://api.testnet.wormholescan.io/api/v1/vaas';

const LOG_MESSAGE_PUBLISHED = toEventSelector(
  'LogMessagePublished(address,uint64,uint32,bytes,uint8)'
);

// ─── Args ────────────────────────────────────────────────────────

const arg = (name: string): string | undefined => {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
};

const env = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error('set ' + name);
  }
  return value;
};

const toJson = (value: unknown) =>
  JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));

// ─── Artifacts (hydration-ntt) ───────────────────────────────────

interface Artifact {
  abi: Abi;
  bytecode: { object: Hex };
}

function nttArtifacts() {
  const out = env('HYDRATION_NTT_OUT');
  const load = (path: string) =>
    JSON.parse(readFileSync(resolve(out, path), 'utf8')) as Artifact;
  return {
    library: load('TransceiverStructs.sol/TransceiverStructs.json'),
    manager: load('NttManager.sol/NttManager.json'),
    transceiver: load('WormholeTransceiver.sol/WormholeTransceiver.json'),
    proxy: load('ERC1967Proxy.sol/ERC1967Proxy.json'),
  };
}

/** Fills every `__$…$__` library placeholder with the deployed library. */
const link = (bytecode: Hex, library: Hex): Hex =>
  bytecode.replace(
    /__\$[0-9a-f]{34}\$__/g,
    library.slice(2).toLowerCase()
  ) as Hex;

// ─── Fork helpers ────────────────────────────────────────────────

/** Hydration's unbound h160 -> AccountId32: b"ETH\0" ++ h160 ++ [0u8;8]. */
const truncatedAccount = (h160: Hex): string =>
  AccountId(HYDRATION_SS58_PREFIX).dec(
    `0x45544800${h160.slice(2).toLowerCase()}${'00'.repeat(8)}`
  );

const slotHex = (n: bigint): Hex => pad(numberToHex(n), { size: 32 });

/**
 * Guardian set `index` on the hydration core := `guardians`, never expiring.
 *
 * - A non-current set is accepted only while `expirationTime >
 *   block.timestamp` (Messages.sol), so it is pushed to u32 max
 */
function guardianSetOverride(core: Hex, index: number, guardians: Hex[]) {
  const base = BigInt(
    keccak256(
      encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'uint256' }],
        [BigInt(index), 2n]
      )
    )
  );
  const keys = BigInt(keccak256(slotHex(base)));
  return [
    [[core, slotHex(base)], slotHex(BigInt(guardians.length))],
    [[core, slotHex(base + 1n)], slotHex(0xffffffffn)],
    ...guardians.map((g, i) => [
      [core, slotHex(keys + BigInt(i))],
      pad(g, { size: 32 }),
    ]),
  ];
}

/** SCALE `CodeMetadata { size: u64, hash: H256 }` of an address's code, as stored. */
async function metadataOf(fork: Fork, address: Hex): Promise<Hex> {
  const meta = (await fork.client
    .getUnsafeApi()
    .query.EVM.AccountCodesMetadata.getValue(address)) as {
    size: bigint;
    hash: string;
  };
  const size = numberToHex(meta.size, { size: 8 })
    .slice(2)
    .match(/../g)!
    .reverse()
    .join('');
  return `0x${size}${meta.hash.slice(2)}` as Hex;
}

/** Every `Ethereum.Executed` in the block must succeed, and there must be `n`. */
async function sealed(fork: Fork, label: string, blockHash: string, n: number) {
  const exits = getEthereumExits(await getEventsAt(fork, blockHash));
  const ok = exits.filter((exit) => exit.startsWith('Succeed')).length;
  if (exits.length !== n || ok !== n) {
    throw new Error(`${label}: ${ok}/${n} txs succeeded (${exits.join(', ')})`);
  }
}

/**
 * Point the sdk's hydration at the fork.
 *
 * - papi reads through the fork client, as the chopsticks e2e setup does
 * - viem reads through the fork's eth rpc - gc chopsticks serves eth_* over
 *   http on the same port
 */
function useFork(chain: EvmParachain, fork: Fork) {
  const evmClient = new EvmClient(chain.evmChain, [
    fork.url.replace('ws://', 'http://'),
  ]);
  Object.defineProperty(chain, 'client', {
    get: () => fork.client,
    configurable: true,
  });
  Object.defineProperty(chain, 'evmClient', {
    get: () => evmClient,
    configurable: true,
  });
}

// ─── NEAR ────────────────────────────────────────────────────────

async function signNear(chain: NearChain, call: NearCall, key: NearKeyPair) {
  let failure: unknown;
  let outcome: Awaited<ReturnType<NearChain['client']['getTransaction']>>;
  await new NearSigner(chain, key).signAndSend(call, {
    onTransactionSend: (hash) => console.log(`   near tx   ${hash}`),
    onStatus: (status) => {
      outcome = status;
    },
    onError: (error) => {
      failure = error;
    },
  });
  if (failure) {
    throw failure;
  }
  return outcome!;
}

/** The wormhole message a NEAR transfer published - the core logs it flat. */
function findMessage(outcome: Awaited<ReturnType<typeof signNear>>) {
  const publish = outcome.receipts_outcome
    .flatMap((r) => r.outcome.logs)
    .filter((l) => l.startsWith('EVENT_JSON:'))
    .map((l) => JSON.parse(l.slice('EVENT_JSON:'.length)))
    .find((e) => e.standard === 'wormhole' && e.event === 'publish');
  if (!publish) {
    throw new Error('no wormhole message in ' + outcome.transaction.hash);
  }
  return { emitter: publish.emitter as string, sequence: String(publish.seq) };
}

/** A testnet vaa from wormholescan, retried until the guardian has signed it. */
async function testnetVaa(emitter: string, sequence: string): Promise<string> {
  const url = `${VAA_API}/${NEAR_WORMHOLE_ID}/${emitter.replace(/^0x/, '')}/${sequence}`;
  for (let attempt = 1; attempt <= 60; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const json = (await res.json()) as { data?: { vaa?: string } };
      if (json.data?.vaa) {
        return json.data.vaa;
      }
    }
    console.log(`   …waiting for the testnet guardian (${attempt})`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('no testnet vaa at ' + url);
}

// ─── Probe ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const art = nttArtifacts();
  const deployer = privateKeyToAccount(DEPLOYER_PK);
  const user = privateKeyToAccount(USER_PK);

  // The sdk config, with the NEAR testnet profile - its hydration leg is the
  // one deployed below.
  const config = new ConfigService({
    assets: assetsMap,
    chains: chainsMap,
    routes: routesMap,
  });
  testnet.registerNear(config);
  const wallet = new Wallet({
    configService: config,
    transferValidations: validations,
  });

  const hydration = config.getChain('hydration') as EvmParachain;
  const near = config.getChain('near_testnet') as NearChain;
  const wnear = config.getAsset('wnear');
  const hydrationNtt = Ntt.fromChain(hydration, wnear);
  const nearNtt = Ntt.fromChain(near, wnear);

  const core = Wormhole.fromChain(hydration).getCoreBridge() as Hex;
  const token = hydrationNtt.token as Hex;
  const assetId = Number(hydration.getAssetId(wnear));
  const decimals = hydration.getAssetDecimals(wnear)!;
  const nearEmitter = nearNtt.emitter as Hex;
  const nearDecimals = near.getAssetDecimals(wnear)!;

  console.log('\n🥢 NEAR NTT <-> Hydration probe, driven by the sdk');
  console.log(`   near      ${nearNtt.manager} (emitter ${nearEmitter})`);
  console.log(
    `   hydration ${hydrationNtt.manager} / ${hydrationNtt.transceiver.wormhole}`
  );
  console.log(`   user      ${user.address}`);

  // Dwellir, not catfish: the fork reads every storage entry lazily and the
  // deploy touches hundreds - catfish's rate limiter stalls them.
  const fork = await spawn({
    ...configs.hydration,
    endpoint:
      process.env.HYDRATION_ENDPOINT ?? 'wss://hydration-rpc.n.dwellir.com',
  });

  try {
    useFork(hydration, fork);
    const chainId = hydration.evmChain.id;
    const unsafe = fork.client.getUnsafeApi();

    // ── 1. the fork's wNEAR asset & its ntt pair ──
    const template = (await unsafe.query.AssetRegistry.Assets.getValue(
      TEMPLATE_ASSET_ID
    )) as { asset_type: { type: string }; existential_deposit: bigint };

    const funded = (h160: Hex) => [
      [
        [truncatedAccount(h160)],
        { providers: 1, data: { free: 1_000_000n * 10n ** 12n } },
      ],
    ];
    const weth = (h160: Hex) => [
      [[truncatedAccount(h160), WETH_ASSET_ID], { free: 1_000n * 10n ** 18n }],
    ];
    await fork.setStorage({
      System: {
        Account: [...funded(deployer.address), ...funded(user.address)],
      },
      Tokens: { Accounts: [...weth(deployer.address), ...weth(user.address)] },
      AssetRegistry: {
        Assets: [
          [
            [assetId],
            {
              name: stringToHex('Wrapped NEAR (fork)'),
              asset_type: template.asset_type.type,
              existential_deposit: template.existential_deposit,
              symbol: stringToHex('wNEAR'),
              decimals: decimals,
              xcm_rate_limit: null,
              is_sufficient: true,
            },
          ],
        ],
      },
      EVMAccounts: { NttMinters: [[[assetId], hydrationNtt.manager]] },
    });

    // Registration puts a 1-byte stub at the asset's precompile address, so
    // solidity's extcodesize check before `mint` passes. Raw keys: the json
    // form of these values does not apply.
    const templateToken =
      `0x00000000000000000000000000000001${TEMPLATE_ASSET_ID.toString(16).padStart(8, '0')}` as Hex;
    await fork.setStorage([
      [await unsafe.query.EVM.AccountCodes.getKey(token), '0x0400'],
      [
        await unsafe.query.EVM.AccountCodesMetadata.getKey(token),
        await metadataOf(fork, templateToken),
      ],
      // Hydration lets only whitelisted addresses CREATE, its value is `()`.
      [
        await unsafe.query.EVMAccounts.ContractDeployer.getKey(
          deployer.address
        ),
        '0x',
      ],
    ]);

    const eth = new EthClient(fork, deployer, { chainId });
    const encode = (abi: Abi, functionName: string, args: unknown[] = []) =>
      encodeFunctionData({ abi, functionName, args } as never) as Hex;
    const proxyOf = (impl: Hex) =>
      encodeDeployData({
        abi: art.proxy.abi,
        bytecode: art.proxy.bytecode.object,
        args: [impl, '0x'],
      } as never) as Hex;

    // Signed up front and sealed together - a fork block costs the same fixed
    // time however many txs it holds.
    const lib = await eth.signDeploy(art.library.bytecode.object, 3_000_000n);
    const managerImpl = await eth.signDeploy(
      encodeDeployData({
        abi: art.manager.abi,
        bytecode: link(art.manager.bytecode.object, lib.address),
        args: [token, 1, 73, RATE_LIMIT_DURATION, false], // 1 = BURNING
      } as never) as Hex,
      10_000_000n
    );
    const manager = await eth.signDeploy(
      proxyOf(managerImpl.address),
      1_500_000n
    );
    const managerInit = await eth.signCall(
      manager.address,
      encode(art.manager.abi, 'initialize'),
      1_500_000n
    );
    const transceiverImpl = await eth.signDeploy(
      encodeDeployData({
        abi: art.transceiver.abi,
        bytecode: link(art.transceiver.bytecode.object, lib.address),
        args: [
          manager.address,
          core,
          CONSISTENCY_LEVEL,
          0,
          0,
          '0x0000000000000000000000000000000000000000',
        ],
      } as never) as Hex,
      6_000_000n
    );
    const transceiver = await eth.signDeploy(
      proxyOf(transceiverImpl.address),
      1_500_000n
    );
    const transceiverInit = await eth.signCall(
      transceiver.address,
      encode(art.transceiver.abi, 'initialize'),
      1_500_000n
    );

    if (
      manager.address.toLowerCase() !== hydrationNtt.manager.toLowerCase() ||
      transceiver.address.toLowerCase() !==
        hydrationNtt.transceiver.wormhole.toLowerCase()
    ) {
      throw new Error(
        `would deploy at ${manager.address} / ${transceiver.address}, not where the sdk registers the leg`
      );
    }

    const deploys = [
      lib.rawTx,
      managerImpl.rawTx,
      manager.rawTx,
      managerInit,
      transceiverImpl.rawTx,
      transceiver.rawTx,
      transceiverInit,
    ];
    await sealed(
      fork,
      'deploy',
      (await eth.sendBatch(deploys)).blockHash,
      deploys.length
    );

    const configure = [
      await eth.signCall(
        manager.address,
        encode(art.manager.abi, 'setTransceiver', [transceiver.address]),
        1_000_000n
      ),
      await eth.signCall(
        manager.address,
        encode(art.manager.abi, 'setOutboundLimit', [LIMIT]),
        1_000_000n
      ),
      await eth.signCall(
        manager.address,
        encode(art.manager.abi, 'setThreshold', [1]),
        1_000_000n
      ),
      await eth.signCall(
        manager.address,
        encode(art.manager.abi, 'setPeer', [
          NEAR_WORMHOLE_ID,
          nearEmitter,
          nearDecimals,
          LIMIT,
        ]),
        1_000_000n
      ),
      await eth.signCall(
        transceiver.address,
        encode(art.transceiver.abi, 'setWormholePeer', [
          NEAR_WORMHOLE_ID,
          nearEmitter,
        ]),
        1_000_000n
      ),
    ];
    await sealed(
      fork,
      'configure',
      (await eth.sendBatch(configure)).blockHash,
      configure.length
    );
    console.log(
      `\n1. fork: asset ${assetId} wNEAR, pair deployed & peered with the NEAR emitter`
    );

    // ── 2. NEAR testnet -> hydration, through the sdk ──
    let emitter = arg('--emitter');
    let sequence = arg('--sequence') ?? '1';
    if (!emitter) {
      const account = env('NEAR_ACCOUNT');
      const key = NearKeyPair.fromSecretKey(env('NEAR_KEY'));
      const amount = process.env.NEAR_AMOUNT ?? '0.1';

      const transfer = await TransferBuilder(wallet)
        .withAsset('near')
        .withSource(near)
        .withDestination(hydration)
        .build({
          srcAddress: account,
          dstAddress: user.address,
          dstAsset: wnear,
        });

      console.log(`\n2. ${amount} NEAR ${account} -> ${user.address}`);
      console.log(
        `   fee       ${transfer.source.fee.toDecimal()} NEAR, max ${transfer.source.max.toDecimal()}`
      );
      // Against the fork leg now - its limits & custody are readable.
      console.log(
        `   checks    ${toJson(await transfer.validate(undefined, amount))}`
      );

      const [call] = (await transfer.buildCalls(amount)) as NearCall[];
      console.log(
        `   near call ${call.receiverId}: ${call.actions.map((a) => a.methodName).join(' + ')}`
      );
      ({ emitter, sequence } = findMessage(await signNear(near, call, key)));
    } else {
      console.log(
        `\n2. delivering the earlier transfer ${NEAR_WORMHOLE_ID}/${emitter}/${sequence}`
      );
    }

    const vaaRaw = await testnetVaa(emitter, sequence);
    const vaa = deserialize(
      'Ntt:WormholeTransfer',
      encoding.b64.decode(vaaRaw)
    );
    const transfer = vaa.payload.nttManagerPayload.payload;
    // An h160, left-padded to 32 bytes.
    const recipient = ('0x' +
      encoding.hex.encode(
        transfer.recipientAddress.toUint8Array().slice(12)
      )) as Hex;
    const expected =
      transfer.trimmedAmount.amount *
      10n ** BigInt(decimals - transfer.trimmedAmount.decimals);
    console.log(
      `   vaa       ${NEAR_WORMHOLE_ID}/${emitter}/${sequence}, guardian set ${vaa.guardianSet}`
    );

    // ── 3. claim on the fork, through the sdk ──
    // Only the trust root is substituted: the core's set at the vaa's index
    // becomes whoever signed it. The real core then verifies it for real.
    const digest = keccak256(vaa.hash);
    const guardians = await Promise.all(
      vaa.signatures.map(({ signature: { r, s, v } }) =>
        recoverAddress({
          hash: digest,
          signature: concatHex([
            numberToHex(r, { size: 32 }),
            numberToHex(s, { size: 32 }),
            numberToHex(v + 27, { size: 1 }),
          ]),
        })
      )
    );
    await fork.setStorage({
      EVM: {
        AccountStorages: guardianSetOverride(core, vaa.guardianSet, guardians),
      },
    });

    const claimer = new EthClient(fork, user, { chainId });
    const claim = new EvmClaim().redeem(user.address, vaaRaw, hydrationNtt);
    const before = await hydration.getBalance(wnear, recipient);
    await sealed(
      fork,
      'claim',
      (
        await claimer.sendBatch([
          await claimer.signCall(claim.to, claim.data as Hex),
        ])
      ).blockHash,
      1
    );
    const after = await hydration.getBalance(wnear, recipient);
    console.log(
      `\n3. claimed  ${recipient}: ${before.toDecimal()} -> ${after.toDecimal()} wNEAR`
    );
    if (after.amount - before.amount !== expected) {
      throw new Error(
        `minted ${after.amount - before.amount}, expected ${expected}`
      );
    }

    const replay = await claimer.sendBatch([
      await claimer.signCall(claim.to, claim.data as Hex),
    ]);
    const replayExits = getEthereumExits(
      await getEventsAt(fork, replay.blockHash)
    );
    console.log(
      `   replay    ${replayExits.join(', ')} (rejected: ${!replayExits.some((e) => e.startsWith('Succeed'))})`
    );

    // ── 4. hydration -> NEAR testnet, through the sdk ──
    // Only the burn side: the message lands on the fork, which no guardian sees.
    if (recipient.toLowerCase() !== user.address.toLowerCase()) {
      console.log(
        '\n4. skipped - the vaa paid someone other than the probe user'
      );
      return;
    }
    const nearRecipient =
      process.env.NEAR_RECIPIENT ?? process.env.NEAR_ACCOUNT ?? 'bob.testnet';
    const back = (expected / 2n).toString();
    const backDecimal = after.copyWith({ amount: BigInt(back) }).toDecimal();

    const outbound = await TransferBuilder(wallet)
      .withAsset(wnear)
      .withSource(hydration)
      .withDestination(near)
      .build({
        srcAddress: user.address,
        dstAddress: nearRecipient,
        dstAsset: wnear,
      });

    console.log(
      `\n4. ${backDecimal} wNEAR ${user.address} -> ${nearRecipient}`
    );
    console.log(
      `   fee       ${outbound.source.fee.toDecimal()} ${outbound.source.fee.originSymbol}`
    );
    console.log(
      `   checks    ${toJson(await outbound.validate(undefined, backDecimal))}`
    );

    const calls = (await outbound.buildCalls(backDecimal)) as EvmCall[];
    console.log(`   evm calls ${calls.map((c) => c.to).join(', ')}`);
    const signed: Hex[] = [];
    for (const call of calls) {
      signed.push(
        await claimer.signCall(
          call.to,
          call.data as Hex,
          undefined,
          call.value ?? 0n
        )
      );
    }
    const { blockHash } = await claimer.sendBatch(signed);
    await sealed(fork, 'hydration -> near', blockHash, calls.length);

    const [log] = findEvmLogs(
      await getEventsAt(fork, blockHash),
      LOG_MESSAGE_PUBLISHED,
      core
    );
    if (!log) {
      throw new Error('no message published by the core');
    }
    const [, , payload] = decodeAbiParameters(
      [
        { type: 'uint64' },
        { type: 'uint32' },
        { type: 'bytes' },
        { type: 'uint8' },
      ],
      Binary.toHex(log.data) as Hex
    );
    const message = deserializePayload(
      'Ntt:WormholeTransfer',
      encoding.hex.decode(payload)
    );
    const sent = message.nttManagerPayload.payload;
    const hashed = new UniversalAddress(nearRecipient, 'sha256');
    const left = await hydration.getBalance(wnear, user.address);

    console.log(
      `   message   to ${sent.recipientChain} ${sent.recipientAddress.toString()} (${toJson(sent.trimmedAmount)})`
    );
    console.log(
      `   recipient sha256(${nearRecipient}) ${sent.recipientAddress.equals(hashed) ? 'matches' : 'MISMATCH'}`
    );
    console.log(
      `   burned    ${after.toDecimal()} -> ${left.toDecimal()} wNEAR`
    );

    if (
      !sent.recipientAddress.equals(hashed) ||
      sent.recipientChain !== 'Near'
    ) {
      throw new Error('message does not name the NEAR recipient');
    }
    console.log('\n🥢 ✅ NEAR <-> Hydration through the sdk, on the fork.');
  } finally {
    await fork.close();
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error('PROBE ERROR:', e?.stack ?? e?.message ?? e);
    process.exit(1);
  });
