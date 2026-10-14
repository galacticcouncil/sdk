import {
  Abi,
  AnyEvmChain,
  ContractConfig,
  ContractConfigBuilder,
  ContractConfigBuilderParams,
  EvmBalanceType,
  EvmParachain,
  NearChain,
  Ntt as NttRegistry,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { getOneClickClient } from '../../../bridges/oneclick';
import {
  encodeNttRequest,
  NTT_DEFAULT_INSTRUCTIONS,
  NTT_TRIMMED_DECIMALS,
} from '../../../bridges/wormhole';
import { executorClient, nttClient } from '../../../clients';
import { floorToPrecision } from '../../utils';

/**
 * Everything both transfer paths resolve identically - the deployment, the
 * wormhole delivery price and the trimmed amount. Only who is called with it
 * differs: the manager directly (self-redeem) or the executor shim.
 */
const resolveTransfer = async (params: ContractConfigBuilderParams) => {
  const { address, amount, asset, source, destination } = params;
  const ctx = source.chain as AnyEvmChain;
  const rcv = destination.chain;

  const ntt = NttRegistry.fromChain(ctx, asset);
  const rcvWh = Wh.fromChain(rcv);

  let rcvAddress = address;
  if (rcv instanceof EvmParachain) {
    rcvAddress = await rcv.getDerivatedAddress(address);
  }

  const deliveryPrice = (await ctx.evmClient.getProvider().readContract({
    abi: Abi.NttManager,
    address: ntt.manager as `0x${string}`,
    args: [rcvWh.getWormholeId(), NTT_DEFAULT_INSTRUCTIONS],
    functionName: 'quoteDeliveryPrice',
  })) as [bigint[], bigint];

  // NTT trims amounts to 8 decimals & manager reverts on sub-trim
  // dust (TransferAmountHasDust). Floor the amount upfront.
  const transferAmount = floorToPrecision(
    amount,
    ctx.getAssetDecimals(asset) ?? 0,
    NTT_TRIMMED_DECIMALS
  );

  return {
    ctx,
    ntt,
    rcvWh,
    rcvAddress,
    transferAmount,
    deliveryPrice: deliveryPrice[1],
    wrapNative: ctx.getBalanceType(asset) === EvmBalanceType.Native,
  };
};

/**
 * Self-redeem transfer, the manager called directly.
 *
 * @param refundAddress - ntt refund address (bytes32), emitted in the
 *   manager's `TransferSent`; the recipient by default, as the short
 *   `transfer` overload sets it
 */
const transfer = (refundAddress?: string): ContractConfigBuilder => ({
  build: async (params) => {
    const {
      ntt,
      rcvWh,
      rcvAddress,
      transferAmount,
      deliveryPrice,
      wrapNative,
    } = await resolveTransfer(params);

    const recipient = rcvWh.normalizeAddress(rcvAddress);

    return [
      new ContractConfig({
        abi: Abi.NttManager,
        address: ntt.manager,
        args: refundAddress
          ? [
              transferAmount,
              rcvWh.getWormholeId(),
              recipient,
              refundAddress,
              false,
              NTT_DEFAULT_INSTRUCTIONS,
            ]
          : [transferAmount, rcvWh.getWormholeId(), recipient],
        token: ntt.token,
        wrapNative: wrapNative,
        value: deliveryPrice,
        func: 'transfer',
        module: 'NttManager',
      }),
    ];
  },
});

/**
 * Transfer delivered by the Executor service instead of a manual redeem.
 *
 * Calls the NttManagerWithExecutor shim, which pulls the erc20, forwards the
 * transfer to the manager and pays the Executor to deliver the VAA on the far
 * side. Costs `deliveryPrice + estimatedCost` in source native gas on top of
 * the transfer - the plain manager call only ever pays `deliveryPrice`.
 *
 * The shim is the token spender here, not the manager, so the allowance the
 * platform derives from {@link ContractConfig.address} lands on the right
 * contract without further wiring.
 */
const transferWithExecutor = (): ContractConfigBuilder => ({
  build: async (params) => {
    const {
      ctx,
      ntt,
      rcvWh,
      rcvAddress,
      transferAmount,
      deliveryPrice,
      wrapNative,
    } = await resolveTransfer(params);

    const ctxWh = Wh.fromChain(ctx);
    const shim = ctxWh.getNttExecutor();

    // Refunds (unused executor budget) go back to the account that actually
    // sends the evm call - the derived H160 when a substrate origin wraps it
    // in EVM.call, the signer itself otherwise.
    const refund =
      ctx instanceof EvmParachain
        ? await ctx.getDerivatedAddress(params.sender)
        : params.sender;

    const budget = await nttClient(
      params.destination.chain,
      params.destination.balance
    ).getRedeemBudget(params.address);

    const { signedQuote, estimatedCost, relayInstructions } =
      await executorClient.quote(
        ctxWh.getWormholeId(),
        rcvWh.getWormholeId(),
        budget
      );

    // Ntt refunds unused destination gas on the recipient chain, so this is
    // the recipient - not the sender, whose format the destination may not
    // even parse (an h160 is not base58, an ss58 is not hex).
    const recipient = rcvWh.normalizeAddress(rcvAddress);

    const executorArgs = {
      value: estimatedCost,
      refundAddress: refund,
      signedQuote: signedQuote,
      instructions: relayInstructions,
    };

    // No referrer is taken - the full amount bridges. `payee` is the referrer
    // wallet, unused while both fees are zero.
    const feeArgs = {
      transferTokenFee: 0n,
      nativeTokenFee: 0n,
      payee: refund,
    };

    return [
      new ContractConfig({
        abi: Abi.NttManagerWithExecutor,
        address: shim,
        args: [
          ntt.manager,
          transferAmount,
          rcvWh.getWormholeId(),
          recipient,
          recipient,
          NTT_DEFAULT_INSTRUCTIONS,
          executorArgs,
          feeArgs,
        ],
        token: ntt.token,
        wrapNative: wrapNative,
        value: deliveryPrice + estimatedCost,
        func: 'transfer',
        module: 'NttManagerWithExecutor',
      }),
    ];
  },
});

/**
 * Executor delivery without the {@link transferWithExecutor} shim.
 *
 * Same two on-chain effects, returned as the two calls the sender owns: the
 * manager emits the transfer, then the Executor is paid to deliver that
 * message. Built together because they share one delivery quote and one
 * message sequence. The shim only bundles them - and does so by approving the
 * manager for
 * `type(uint256).max`, which hydration's erc20 precompile rejects ("value too
 * big for type", its balances being u128). Our own approve is exact, so
 * dropping the shim is what makes hydration a usable executor source at all.
 *
 * The request names the message by the manager's next sequence, read here.
 * Another transfer through the same manager landing in between would leave it
 * pointing at the wrong message - nothing is relayed then and the transfer is
 * still claimable by hand.
 */
const transferViaExecutor = (): ContractConfigBuilder => ({
  build: async (params) => {
    const {
      ctx,
      ntt,
      rcvWh,
      rcvAddress,
      transferAmount,
      deliveryPrice,
      wrapNative,
    } = await resolveTransfer(params);

    const ctxWh = Wh.fromChain(ctx);
    const rcv = params.destination.chain;

    // Whom the executor calls on the far side to redeem.
    const rcvNtt = NttRegistry.find(rcv, params.destination.balance.key);
    if (!rcvNtt) {
      throw new Error('Ntt deployment missing on ' + rcv.key);
    }

    // Unused executor budget returns to the account making the evm call.
    const refund =
      ctx instanceof EvmParachain
        ? await ctx.getDerivatedAddress(params.sender)
        : params.sender;

    const budget = await nttClient(
      rcv,
      params.destination.balance
    ).getRedeemBudget(params.address);

    const [quote, sequence] = await Promise.all([
      executorClient.quote(
        ctxWh.getWormholeId(),
        rcvWh.getWormholeId(),
        budget
      ),
      ctx.evmClient.getProvider().readContract({
        abi: Abi.NttManager,
        address: ntt.manager as `0x${string}`,
        functionName: 'nextMessageSequence',
      }) as Promise<bigint>,
    ]);

    return [
      new ContractConfig({
        abi: Abi.NttManager,
        address: ntt.manager,
        args: [
          transferAmount,
          rcvWh.getWormholeId(),
          rcvWh.normalizeAddress(rcvAddress),
        ],
        token: ntt.token,
        wrapNative: wrapNative,
        value: deliveryPrice,
        func: 'transfer',
        module: 'NttManager',
      }),
      new ContractConfig({
        abi: Abi.Executor,
        address: ctxWh.getExecutor(),
        args: [
          rcvWh.getWormholeId(),
          rcvWh.normalizeAddress(rcvNtt.manager),
          refund,
          quote.signedQuote,
          encodeNttRequest(
            ctxWh.getWormholeId(),
            ntt.manager,
            BigInt(sequence)
          ),
          quote.relayInstructions,
        ],
        value: quote.estimatedCost,
        func: 'requestExecution',
        module: 'Executor',
      }),
    ];
  },
});

/**
 * NEAR implicit account as 32 bytes: the hex of its key is the account id.
 *
 * - Throws on any other account: one that can't be published must not be
 *   paid, the vaa alone can't name it to a claimer
 */
const implicitAccountBytes = (account: string): string => {
  if (!/^[0-9a-f]{64}$/.test(account)) {
    throw new Error('Not a NEAR implicit account: ' + account);
  }
  return '0x' + account;
};

/**
 * Withdrawal through 1Click: an ntt transfer to NEAR, paying the deposit
 * address 1Click delivers natively from.
 *
 * - Pays the deposit address once opened; until then, the sender's own NEAR
 *   refund account, which they can claim from
 * - The vaa names the deposit address by its sha256 only, so the transfer
 *   publishes it as its ntt refund address, unused on NEAR; any claimer reads
 *   it back with `NearClaim.findRecipient`
 * - Fails without a NEAR refund account or a registered 1Click client, or
 *   on a deposit address that isn't an implicit account
 *
 * @param hub - NEAR chain the transfer lands on
 */
const transferViaOneClick = (hub: NearChain): ContractConfigBuilder => {
  const refundAccount = (address?: string): string => {
    if (address && hub.isValidAddress(address)) {
      return address;
    }
    throw new Error('A withdrawal through 1Click needs a NEAR refund account');
  };

  return {
    build: async (params) => {
      const { amount, deposit, refundAddress } = params;
      const toHub = { ...params.destination, chain: hub };

      if (deposit?.amount === amount) {
        const { depositAddress } = deposit;
        return transfer(implicitAccountBytes(depositAddress)).build({
          ...params,
          address: depositAddress,
          destination: toHub,
        });
      }

      return transfer().build({
        ...params,
        address: refundAccount(refundAddress),
        destination: toHub,
      });
    },
    openDeposit: async ({ address, amount, destination, refundAddress }) => {
      const deposit = await getOneClickClient(destination.chain).openDeposit({
        amount,
        recipient: address,
        refundTo: refundAccount(refundAddress),
      });
      return { ...deposit, amount };
    },
  };
};

export const Ntt = () => {
  return {
    transfer,
    transferWithExecutor,
    transferViaExecutor,
    transferViaOneClick,
  };
};
