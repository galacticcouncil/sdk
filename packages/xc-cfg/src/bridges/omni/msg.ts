import { AnyChain, EvmParachain, Wormhole } from '@galacticcouncil/xc-core';

/**
 * `msg` of the `ft_transfer_call` Omni's connector makes into a NEAR ntt
 * manager.
 *
 * - Omni derives the deposit address from this exact string
 * - The manager takes the recipient as 32 bytes, an ss58 one derived first
 * - `refund_to` takes a failed publish's refund instead of the connector
 *
 * @param destination - chain the manager publishes to
 * @param address - recipient on the destination
 * @param refundTo - NEAR account a failed publish refunds
 */
export async function getDepositMsg(
  destination: AnyChain,
  address: string,
  refundTo: string
): Promise<string> {
  const wormhole = Wormhole.fromChain(destination);

  let recipient = address;
  if (destination instanceof EvmParachain) {
    recipient = await destination.getDerivatedAddress(address);
  }

  return JSON.stringify({
    recipient_chain: wormhole.getWormholeId(),
    recipient: wormhole.normalizeAddress(recipient),
    refund_to: refundTo,
  });
}
