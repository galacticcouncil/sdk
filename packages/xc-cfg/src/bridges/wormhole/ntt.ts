import { AnyChain, EvmParachain, Wormhole } from '@galacticcouncil/xc-core';

/**
 * `msg` of an `ft_transfer_call` into a NEAR ntt manager.
 *
 * - Recipient as 32 bytes; an ss58 evm parachain recipient is derived first
 */
export async function getNearTransferMsg(
  destination: AnyChain,
  address: string
): Promise<string> {
  const wormhole = Wormhole.fromChain(destination);

  let recipient = address;
  if (destination instanceof EvmParachain) {
    recipient = await destination.getDerivatedAddress(address);
  }

  return JSON.stringify({
    recipient_chain: wormhole.getWormholeId(),
    recipient: wormhole.normalizeAddress(recipient),
  });
}
