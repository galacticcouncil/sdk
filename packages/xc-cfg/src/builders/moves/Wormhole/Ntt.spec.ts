import { jest } from '@jest/globals';

import {
  MoveConfigBuilderParams,
  Parachain,
  SuiChain,
  Wormhole,
} from '@galacticcouncil/xc-core';

import { AccountId } from '@polkadot-api/substrate-bindings';

import { sui } from '../../../assets';
import { hydration, sui_chain } from '../../../chains';

import { Ntt } from './Ntt';

const MANAGER = '0x' + '11'.repeat(32);
const TRANSCEIVER = '0x' + '22'.repeat(32);
const COIN_META = '0x' + '33'.repeat(32);
const CORE_PKG = '0x' + '44'.repeat(32);
const NTT_PKG = '0x' + '55'.repeat(32);
const TRANSCEIVER_PKG = '0x' + '66'.repeat(32);

const SUI_NTT = {
  token: '0x2::sui::SUI',
  manager: MANAGER,
  transceiver: {
    wormhole: TRANSCEIVER,
  },
  coinMetadata: COIN_META,
};

const H160 = 'd8da6bf26964af9d7eed9e03e53415d37aa96045';
const RECIPIENT_32 = '000000000000000000000000' + H160;

const toBoundSs58 = (h160: string): string => {
  const publicKey = new Uint8Array(32);
  publicKey.set(Buffer.from('ETH\0'), 0);
  publicKey.set(Buffer.from(h160, 'hex'), 4);
  return AccountId(63).dec(publicKey);
};

const SENDER = '0x' + '77'.repeat(32);

const buildTransferCtx = (amount = 1000000000n) => {
  return {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    amount: amount,
    asset: sui,
    sender: SENDER,
    source: {
      chain: sui_chain,
    },
    destination: {
      chain: hydration,
    },
  } as MoveConfigBuilderParams;
};

// State objects the builder resolves package ids from - the manager & the
// transceiver each point at their upgrade cap, which carries the current
// package id.
const objects: Record<string, any> = {
  [MANAGER]: {
    data: {
      type: `${NTT_PKG}::ntt::State<0x2::sui::SUI>`,
      content: { fields: { upgrade_cap_id: MANAGER + '01' } },
    },
  },
  [MANAGER + '01']: {
    data: {
      type: '0x2::package::UpgradeCap',
      content: { fields: { cap: { fields: { package: NTT_PKG } } } },
    },
  },
  [TRANSCEIVER]: {
    data: {
      type: `${TRANSCEIVER_PKG}::wormhole_transceiver::State`,
      content: { fields: { upgrade_cap_id: TRANSCEIVER + '01' } },
    },
  },
  [TRANSCEIVER + '01']: {
    data: {
      type: '0x2::package::UpgradeCap',
      content: { fields: { cap: { fields: { package: TRANSCEIVER_PKG } } } },
    },
  },
  [Wormhole.fromChain(sui_chain).getCoreBridge()]: {
    data: {
      type: '0xcore::state::State',
      content: { fields: {} },
    },
  },
  ['0xcurrent']: {
    data: {
      type: '0xcore::state::CurrentPackage',
      content: { fields: { value: { fields: { package: CORE_PKG } } } },
    },
  },
};

const suiNtt = Wormhole.fromChain(sui_chain).ntt;

describe('Ntt move builder', () => {
  beforeAll(() => {
    suiNtt[sui.key] = SUI_NTT;
    jest.spyOn(SuiChain.prototype, 'client', 'get').mockReturnValue({
      getObject: async ({ id }: any) => objects[id],
      getDynamicFields: async () => ({
        data: [
          {
            name: { type: '0xcore::state::CurrentPackage' },
            objectId: '0xcurrent',
          },
        ],
        hasNextPage: false,
        nextCursor: null,
      }),
      getCoinMetadata: async () => ({ id: COIN_META, decimals: 9 }),
    } as any);
    // No bound accounts: EVMAccounts.AccountExtension resolves empty
    jest.spyOn(Parachain.prototype, 'client', 'get').mockReturnValue({
      getUnsafeApi: () => ({
        query: {
          EVMAccounts: {
            AccountExtension: {
              getValue: async () => undefined,
            },
          },
        },
      }),
    } as any);
  });

  afterAll(() => {
    delete suiNtt[sui.key];
    jest.restoreAllMocks();
  });

  describe('transfer', () => {
    it('should build correct config for sui ntt transfer to hydration', async () => {
      const config = await Ntt().transfer().build(buildTransferCtx());
      expect(config).toMatchObject({
        func: 'transfer',
        module: 'NttManager',
        type: 'Sui',
      });
    });

    it('should call the resolved packages in ntt transfer order', async () => {
      const config = await Ntt().transfer().build(buildTransferCtx());
      const { commands } = JSON.parse(await config.transaction.toJSON());
      const calls = commands
        .filter((c: any) => !!c.MoveCall)
        .map((c: any) =>
          [c.MoveCall.package, c.MoveCall.module, c.MoveCall.function].join(
            '::'
          )
        );

      expect(calls).toEqual([
        `${NTT_PKG}::upgrades::new_version_gated`,
        `${NTT_PKG}::ntt::prepare_transfer`,
        `${NTT_PKG}::state::get_next_sequence`,
        `${NTT_PKG}::ntt::transfer_tx_sender`,
        `${NTT_PKG}::state::create_transceiver_message`,
        `${TRANSCEIVER_PKG}::wormhole_transceiver::release_outbound`,
        `${CORE_PKG}::publish_message::publish_message`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::coin::from_balance',
      ]);
    });

    it('should cross reference manager & transceiver auth types', async () => {
      const config = await Ntt().transfer().build(buildTransferCtx());
      const { commands } = JSON.parse(await config.transaction.toJSON());
      const typeArgs = (func: string) =>
        commands.find((c: any) => c.MoveCall?.function === func).MoveCall
          .typeArguments;

      expect(typeArgs('create_transceiver_message')).toEqual([
        `${TRANSCEIVER_PKG}::wormhole_transceiver::TransceiverAuth`,
        SUI_NTT.token,
      ]);
      expect(typeArgs('release_outbound')).toEqual([
        `${NTT_PKG}::auth::ManagerAuth`,
      ]);
    });

    it('should target the destination chain & derived recipient', async () => {
      const config = await Ntt().transfer().build(buildTransferCtx());
      const { commands, inputs } = JSON.parse(
        await config.transaction.toJSON()
      );
      const prepare = commands.find(
        (c: any) => c.MoveCall?.function === 'prepare_transfer'
      );
      const [chainArg, recipientArg] = prepare.MoveCall.arguments.slice(3, 5);
      const pure = (arg: any) =>
        Buffer.from(inputs[arg.Input].Pure.bytes, 'base64');

      // u16 wormhole id of hydration, little endian
      expect(pure(chainArg).readUInt16LE(0)).toBe(73);
      // vector<u8> recipient - bcs length prefix, then the 32 bytes
      expect(pure(recipientArg).subarray(1).toString('hex')).toBe(RECIPIENT_32);
    });

    it('should derive recipient for EVM bound ss58 account', async () => {
      const ctx = buildTransferCtx();
      ctx.address = toBoundSs58(H160);
      const config = await Ntt().transfer().build(ctx);
      const { commands, inputs } = JSON.parse(
        await config.transaction.toJSON()
      );
      const prepare = commands.find(
        (c: any) => c.MoveCall?.function === 'prepare_transfer'
      );
      const recipientArg = prepare.MoveCall.arguments[4];
      const bytes = Buffer.from(
        inputs[recipientArg.Input].Pure.bytes,
        'base64'
      );
      expect(bytes.subarray(1).toString('hex')).toBe(RECIPIENT_32);
    });

    it('should reject asset with no registered deployment', async () => {
      delete suiNtt[sui.key];
      await expect(Ntt().transfer().build(buildTransferCtx())).rejects.toThrow(
        'is not supported in NTT'
      );
      suiNtt[sui.key] = SUI_NTT;
    });
  });
});
