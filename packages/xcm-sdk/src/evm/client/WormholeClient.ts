import { Chain } from '@wormhole-foundation/sdk-base';
import {
  Wormhole,
  UnsignedTransaction,
} from '@wormhole-foundation/sdk-connect';
import { EvmPlatform } from '@wormhole-foundation/sdk-evm';

import './setup';

export class WormholeClient {
  private readonly wh: Wormhole<'Mainnet'>;

  constructor() {
    this.wh = new Wormhole('Mainnet', [EvmPlatform]);
  }

  async redeem(
    wormholeMessageId: string,
    destChain: Chain,
    destAddr: string
  ): Promise<UnsignedTransaction[]> {
    const vaa = await this.wh.getVaa(
      wormholeMessageId,
      'TokenBridge:Transfer', // Protocol:Payload name to use for decoding the VAA payload
      60_000
    );

    const rcv = this.wh.getChain(destChain);
    const rcvTb = await rcv.getTokenBridge();

    const finished = await rcvTb.isTransferCompleted(vaa!);
    console.log('Transfer completed: ', finished);

    const rcvAddr = Wormhole.chainAddress(rcv.chain, destAddr);
    const redeem = rcvTb.redeem(rcvAddr.address, vaa!);

    const txbuff: UnsignedTransaction[] = [];
    for await (const tx of redeem) {
      txbuff.push(tx);
    }
    return txbuff;
  }
}
