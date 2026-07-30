import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
  EvmBalanceType,
  EvmChain,
  EvmParachain,
  Ntt as NttRegistry,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

// Default (empty) transceiver instructions. Single zero byte, matching
// the internal default of NttManager.transfer(amount, chain, recipient).
const DEFAULT_INSTRUCTIONS = '0x00';

// NTT wire format precision (TrimmedAmount).
const TRIMMED_DECIMALS = 8;

const transfer = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain;
    const rcv = destination.chain;

    const ntt = NttRegistry.fromChain(ctx, asset);
    const rcvWh = Wh.fromChain(rcv);

    let rcvAddress = address;
    if (rcv instanceof EvmParachain) {
      rcvAddress = await rcv.getDerivatedAddress(address);
    }

    const ctxEvm = ctx as EvmChain;
    const deliveryPrice = (await ctxEvm.evmClient.getProvider().readContract({
      abi: Abi.NttManager,
      address: ntt.manager as `0x${string}`,
      args: [rcvWh.getWormholeId(), DEFAULT_INSTRUCTIONS],
      functionName: 'quoteDeliveryPrice',
    })) as [bigint[], bigint];

    // NTT trims amounts to 8 decimals & manager reverts on sub-trim
    // dust (TransferAmountHasDust). Floor the amount upfront.
    const decimals = ctxEvm.getAssetDecimals(asset) ?? 0;
    let transferAmount = amount;
    if (decimals > TRIMMED_DECIMALS) {
      const dust = 10n ** BigInt(decimals - TRIMMED_DECIMALS);
      transferAmount = amount - (amount % dust);
    }

    return new ContractConfig({
      abi: Abi.NttManager,
      address: ntt.manager,
      args: [
        transferAmount,
        rcvWh.getWormholeId(),
        rcvWh.normalizeAddress(rcvAddress),
      ],
      token: ntt.token,
      wrapNative: ctxEvm.getBalanceType(asset) === EvmBalanceType.Native,
      value: deliveryPrice[1],
      func: 'transfer',
      module: 'NttManager',
    });
  },
});

export const Ntt = () => {
  return {
    transfer,
  };
};
