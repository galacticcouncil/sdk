import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  jest,
} from '@jest/globals';

import { spawn, ChildProcess } from 'child_process';
import * as c from 'console';

import {
  createTestClient,
  createPublicClient,
  encodeAbiParameters,
  http,
  keccak256,
  pad,
  parseEther,
  parseUnits,
  publicActions,
  toHex,
  walletActions,
  type Hex,
} from 'viem';
import { base as viemBase } from 'viem/chains';

import {
  ContractConfigBuilderParams,
  Parachain,
} from '@galacticcouncil/xc-core';
import { assetsMap, builders, chainsMap } from '@galacticcouncil/xc-cfg';

const usdc = assetsMap.get('usdc')!;
const base = chainsMap.get('base')!;
const hydration = chainsMap.get('hydration') as Parachain;
const { ContractBuilder } = builders;

const ANVIL_PORT = 8545;
const ANVIL_URL = `http://127.0.0.1:${ANVIL_PORT}`;
const FORK_URL = process.env.BASE_FORK_URL ?? 'https://mainnet.base.org';

const L2_ADAPTOR = '0x07fe4e7340976fc873b74bafe3c3e5b0e01f3665' as Hex;
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Hex;
const TEST_USER = '0x71FeB8b2849101a6E62e3369eaAfDc6154CD0Bc0' as Hex;
const ALICE_SS58 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const TRANSFER_USDC = parseUnits('100', 6); // 100 USDC

// FiatTokenV2_2 (Base USDC) storage layout:
//   slot 9  → mapping(address => uint256) balanceOf
//   slot 10 → mapping(address => mapping(address => uint256)) allowance
const balanceSlotFor = (user: Hex): Hex =>
  keccak256(
    encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [user, 9n])
  );

const allowanceSlotFor = (owner: Hex, spender: Hex): Hex => {
  const inner = keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [owner, 10n]
    )
  );
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [spender, inner]
    )
  );
};

const waitForAnvil = async (timeoutMs: number = 30_000): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(ANVIL_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_chainId',
          params: [],
        }),
      });
      const data = (await res.json()) as { result?: string };
      if (data.result === '0x2105') return; // 8453
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`anvil did not become ready within ${timeoutMs}ms`);
};

const SNOWBRIDGE_L2_ADAPTOR_ABI = [
  {
    type: 'function',
    name: 'sendTokenAndCall',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'tuple',
        name: 'params',
        components: [
          { type: 'address', name: 'inputToken' },
          { type: 'address', name: 'outputToken' },
          { type: 'uint256', name: 'inputAmount' },
          { type: 'uint256', name: 'outputAmount' },
          { type: 'uint256', name: 'destinationChainId' },
          { type: 'uint32', name: 'fillDeadlineBuffer' },
        ],
      },
      {
        type: 'tuple',
        name: 'swapParams',
        components: [
          { type: 'uint256', name: 'inputAmount' },
          { type: 'address', name: 'router' },
          { type: 'bytes', name: 'callData' },
        ],
      },
      {
        type: 'tuple',
        name: 'sendParams',
        components: [
          { type: 'bytes', name: 'xcm' },
          { type: 'bytes[]', name: 'assets' },
          { type: 'bytes', name: 'claimer' },
          { type: 'uint128', name: 'executionFee' },
          { type: 'uint128', name: 'relayerFee' },
        ],
      },
      { type: 'address', name: 'recipient' },
      { type: 'bytes32', name: 'topic' },
    ],
    outputs: [],
  },
] as const;

describe('Across-Snowbridge sendTokenAndCall — anvil fork (Base mainnet)', () => {
  jest.setTimeout(5 * 60 * 1000);

  let anvil: ChildProcess | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let test: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pub: any;

  beforeAll(async () => {
    c.log(`🔨 spawning anvil --fork-url ${FORK_URL} on ${ANVIL_URL}`);
    anvil = spawn(
      'anvil',
      [
        '--fork-url',
        FORK_URL,
        '--chain-id',
        '8453',
        '--port',
        String(ANVIL_PORT),
        '--silent',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    anvil.stderr?.on('data', (d) => c.error('anvil:', d.toString().trim()));

    await waitForAnvil();
    c.log('🔨 anvil ready');

    const transport = http(ANVIL_URL);
    test = createTestClient({ chain: viemBase, mode: 'anvil', transport })
      .extend(publicActions)
      .extend(walletActions);
    pub = createPublicClient({ chain: viemBase, transport });
  });

  afterAll(() => {
    anvil?.kill('SIGTERM');
  });

  it('forked chain reports base mainnet chain id', async () => {
    const id = await pub.getChainId();
    expect(id).toBe(8453);
  });

  it('simulates sendTokenAndCall without revert with pre-funded USDC + allowance', async () => {
    // 1) ETH for gas
    await test.setBalance({ address: TEST_USER, value: parseEther('10') });

    // 2) USDC balance — overwrite the FiatToken balanceOf mapping slot
    await test.setStorageAt({
      address: USDC_BASE,
      index: balanceSlotFor(TEST_USER),
      value: pad(toHex(TRANSFER_USDC * 2n), { size: 32 }) as Hex,
    });

    // 3) allowance(TEST_USER, L2_ADAPTOR) = max — overwrite FiatToken allowance slot
    await test.setStorageAt({
      address: USDC_BASE,
      index: allowanceSlotFor(TEST_USER, L2_ADAPTOR),
      value: ('0x' + 'ff'.repeat(32)) as Hex,
    });

    // 4) Build the SDK contract call. Mock fees so we don't hit Across API live.
    const ctx = {
      address: ALICE_SS58,
      amount: TRANSFER_USDC,
      asset: usdc,
      sender: TEST_USER,
      source: { chain: base },
      destination: {
        chain: hydration,
        feeBreakdown: {
          acrossRelayerFee: 500_000n,
          executionFee: 5_000_000_000_000_000n,
          relayerFee: 2_000_000_000_000_000n,
          remoteEtherFee: 1_500_000_000_000_000n,
          remoteDotFee: 500_000_000n,
          swapInputAmount: 5_000_000n,
        },
      },
    } as unknown as ContractConfigBuilderParams;

    const config = await ContractBuilder()
      .Across()
      .Snowbridge()
      .sendTokenAndCall()
      .build(ctx);

    c.log('🔨 simulating SnowbridgeL2Adaptor.sendTokenAndCall on forked Base');

    // 5) eth_call against the fork via simulateContract
    const result = await pub.simulateContract({
      account: TEST_USER,
      address: config.address as Hex,
      abi: SNOWBRIDGE_L2_ADAPTOR_ABI,
      functionName: 'sendTokenAndCall',
      // viem accepts the same tuple shape we emit from the builder
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: config.args as any,
    });

    expect(result.request).toBeDefined();
    c.log('🔨 simulation OK — no revert against real Base state');
  });
});
