import { AnyChain, EvmParachain, Wormhole } from '@galacticcouncil/xc-core';

/**
 * `msg` of an `ft_transfer_call` into a NEAR ntt manager.
 *
 * - The manager takes the recipient as 32 bytes, an h160 left-padded
 * - An evm parachain recipient given as ss58 is derived to its h160 first
 *
 * @param destination - chain the manager publishes for
 * @param address - recipient on it, in its native format
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
