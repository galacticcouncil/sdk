import { jest } from '@jest/globals';

import { NearClient, type OmniDepositOrder } from '@galacticcouncil/xc-core';

import { createOmniClient } from './client';
import { OMNI_BRIDGE_API } from './consts';

const CONNECTOR = 'zcash-connector.bridge.near';
const MANAGER = 'ntt-zec.hydration-whm.near';
const SENDER = 't1NyxCchMSJD5bUhKhKFzFnFnqEtvLbxMEG';
const DEPOSIT = 't1X5xYTgZRQtAnjwYBebHtrjSWBcfEmyLzx';
const OTHER = 't1QosiKpUQL4fYgmtDQHjxMpHTVT7HciYrQ';
const MSG =
  '{"recipient_chain":73,"recipient":"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045"}';

const ORDER: OmniDepositOrder = {
  chain: 'zcash',
  recipient: MANAGER,
  msg: MSG,
  refundAddress: SENDER,
};

const answered = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as Response;

const registered = (address = DEPOSIT) => answered({ address });

const refused = () =>
  ({
    ok: false,
    status: 502,
    text: async () => 'bad gateway',
  }) as Response;

const mockApi = (...responses: Response[]) => {
  const fetch = jest.spyOn(globalThis, 'fetch');
  for (const res of responses) {
    fetch.mockResolvedValueOnce(res);
  }
  return fetch;
};

/** Connector views, answered by method; the rpc each ran on is recorded. */
const mockNear = (views: Record<string, () => Promise<unknown>>) => {
  const rpcs: string[] = [];
  const view = jest
    .spyOn(NearClient.prototype, 'view')
    .mockImplementation(async function (this: NearClient, _id, method) {
      rpcs.push(this.rpc);
      const answer = views[method];
      if (!answer) {
        throw new Error('unexpected view ' + method);
      }
      return answer();
    } as NearClient['view']);
  return { view, rpcs };
};

const derives = (address = DEPOSIT) =>
  mockNear({ get_user_deposit_address: async () => address });

describe('createOmniClient', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('getDepositAddress', () => {
    it('should register the order with the api, without a public record', async () => {
      const fetch = mockApi(registered());
      derives();

      await createOmniClient().getDepositAddress(ORDER);

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${OMNI_BRIDGE_API}/utxo/get_user_deposit_address`);
      expect(init.method).toBe('POST');
      expect(init.signal).toBeInstanceOf(AbortSignal);

      const body = JSON.parse(init.body as string);
      expect(body).toEqual({
        chain: 'zcash',
        recipient: MANAGER,
        safe_deposit: { msg: MSG },
        refund_address: SENDER,
        skip_tx: true,
      });
      // The address derives from the exact msg string, passed through as is.
      expect(body.safe_deposit.msg).toBe(MSG);
    });

    it('should return the address the connector derives from the order', async () => {
      mockApi(registered());
      const { view, rpcs } = derives();

      await expect(createOmniClient().getDepositAddress(ORDER)).resolves.toBe(
        DEPOSIT
      );
      expect(view).toHaveBeenCalledWith(CONNECTOR, 'get_user_deposit_address', {
        deposit_msg: {
          recipient_id: MANAGER,
          safe_deposit: { msg: MSG },
          refund_address: SENDER,
        },
      });
      expect(rpcs).toEqual(['https://free.rpc.fastnear.com']);
    });

    it('should register an order once and reuse its address', async () => {
      const fetch = mockApi(registered());
      const { view } = derives();
      const client = createOmniClient();

      const [first, second] = await Promise.all([
        client.getDepositAddress(ORDER),
        client.getDepositAddress({ ...ORDER }),
      ]);
      const third = await client.getDepositAddress(ORDER);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(view).toHaveBeenCalledTimes(1);
      expect([first, second, third]).toEqual([DEPOSIT, DEPOSIT, DEPOSIT]);
    });

    it('should register each order on its own', async () => {
      const fetch = mockApi(registered(), registered(OTHER));
      mockNear({
        get_user_deposit_address: jest
          .fn<() => Promise<unknown>>()
          .mockResolvedValueOnce(DEPOSIT)
          .mockResolvedValueOnce(OTHER),
      });
      const client = createOmniClient();

      await expect(client.getDepositAddress(ORDER)).resolves.toBe(DEPOSIT);
      await expect(
        client.getDepositAddress({ ...ORDER, refundAddress: OTHER })
      ).resolves.toBe(OTHER);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it.each([
      [
        'a refused registration',
        refused(),
        'Omni deposit address failed: 502 bad gateway',
      ],
      [
        'a response without an address',
        answered({}),
        'Omni deposit address missing in the response',
      ],
      [
        'an empty address',
        registered(''),
        'Omni deposit address missing in the response',
      ],
      [
        'a non-zcash address',
        registered('bc1qnotazcashaddress'),
        'Omni deposit address is not a zcash address: bc1qnotazcashaddress',
      ],
      [
        'a mistyped zcash address',
        registered('t1X5xYTgZRQtAnjwYBebHtrjSWBcfEmyLzy'),
        'Omni deposit address is not a zcash address',
      ],
    ])(
      'should reject %s before reading the connector, and retry it',
      async (_case, res, error) => {
        const fetch = mockApi(res, registered());
        const { view } = derives();
        const client = createOmniClient();

        await expect(client.getDepositAddress(ORDER)).rejects.toThrow(error);
        expect(view).not.toHaveBeenCalled();

        await expect(client.getDepositAddress(ORDER)).resolves.toBe(DEPOSIT);
        expect(fetch).toHaveBeenCalledTimes(2);
      }
    );

    it('should reject an address the connector does not derive, and retry it', async () => {
      const fetch = mockApi(registered(OTHER), registered());
      derives(DEPOSIT);
      const client = createOmniClient();

      await expect(client.getDepositAddress(ORDER)).rejects.toThrow(
        `Omni deposit address ${OTHER} does not derive from the order (${DEPOSIT})`
      );
      await expect(client.getDepositAddress(ORDER)).resolves.toBe(DEPOSIT);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should reject when the connector cannot be read, and retry it', async () => {
      const fetch = mockApi(registered(), registered());
      mockNear({
        get_user_deposit_address: jest
          .fn<() => Promise<unknown>>()
          .mockRejectedValueOnce(new Error('near rpc 503: unavailable'))
          .mockResolvedValueOnce(DEPOSIT),
      });
      const client = createOmniClient();

      await expect(client.getDepositAddress(ORDER)).rejects.toThrow(
        'near rpc 503: unavailable'
      );
      await expect(client.getDepositAddress(ORDER)).resolves.toBe(DEPOSIT);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should reject when the connector does not answer in time, and retry it', async () => {
      const fetch = mockApi(registered(), registered());
      mockNear({
        get_user_deposit_address: jest
          .fn<() => Promise<unknown>>()
          .mockReturnValueOnce(new Promise(() => {}))
          .mockResolvedValueOnce(DEPOSIT),
      });
      const client = createOmniClient({ timeoutMs: 20 });

      await expect(client.getDepositAddress(ORDER)).rejects.toThrow(
        `near view ${CONNECTOR}.get_user_deposit_address timed out after 20ms`
      );
      await expect(client.getDepositAddress(ORDER)).resolves.toBe(DEPOSIT);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should take the api and rpc overrides', async () => {
      const fetch = mockApi(registered());
      const { rpcs } = derives();

      await createOmniClient({
        apiUrl: 'https://omni.test/api',
        nearRpc: 'https://near.test',
      }).getDepositAddress(ORDER);

      const [url] = fetch.mock.calls[0] as [string];
      expect(url).toBe('https://omni.test/api/utxo/get_user_deposit_address');
      expect(rpcs).toEqual(['https://near.test']);
    });
  });

  describe('getConnector', () => {
    it('should give the mainnet zcash connector', () => {
      expect(createOmniClient().getConnector('zcash')).toEqual({
        account: CONNECTOR,
        token: 'zec.omft.near',
        minDeposit: 100_000n,
      });
    });
  });

  describe('getConnectorConfig', () => {
    it('should read the live config off the connector', async () => {
      const config = { min_deposit_amount: '100000', refund_timelock_sec: 1 };
      const { view } = mockNear({ get_config: async () => config });

      await expect(
        createOmniClient().getConnectorConfig('zcash')
      ).resolves.toEqual(config);
      expect(view).toHaveBeenCalledWith(CONNECTOR, 'get_config', {});
    });
  });
});
