import { Wormhole, type EvmParachain } from '@galacticcouncil/xc-core';

/**
 * `msg` of the `ft_transfer_call` Omni's connector makes into the NEAR manager.
 *
 * - Omni derives the deposit address from this exact string
 * - The manager takes the recipient as 32 bytes, an ss58 one derived first
 * - `refund_to` takes a failed publish's refund instead of the connector
 *
 * @param hydration - chain the manager publishes to
 * @param address - Hydration recipient
 * @param refundTo - NEAR account a failed publish refunds
 */
export async function getDepositMsg(
  hydration: EvmParachain,
  address: string,
  refundTo: string
): Promise<string> {
  const wormhole = Wormhole.fromChain(hydration);
  const recipient = await hydration.getDerivatedAddress(address);

  return JSON.stringify({
    recipient_chain: wormhole.getWormholeId(),
    recipient: wormhole.normalizeAddress(recipient),
    refund_to: refundTo,
  });
}
