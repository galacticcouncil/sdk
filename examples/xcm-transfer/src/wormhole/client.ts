import { TokenBridge } from '@wormhole-foundation/sdk-definitions';
import {
  Wormhole,
  UnsignedTransaction,
} from '@wormhole-foundation/sdk-connect';
import { EvmPlatform } from '@wormhole-foundation/sdk-evm';
import { SolanaPlatform } from '@wormhole-foundation/sdk-solana';

import './setup';

export class WormholeClient {
  private readonly wh: Wormhole<'Mainnet'>;

  constructor() {
    this.wh = new Wormhole('Mainnet', [EvmPlatform, SolanaPlatform]);
  }

  get client() {
    return this.wh;
  }

  async getVaa(wormholeMessageId: string) {
    const vaa = await this.wh.getVaa(
      wormholeMessageId,
      'TokenBridge:TransferWithPayload',
      60_000
    );
    if (vaa) {
      return vaa;
    }
    throw new Error('No VAA available for: ' + wormholeMessageId);
  }

  async getTokenBridge(vaa: TokenBridge.TransferVAA) {
    const rcvChain = vaa.payload.to.chain;
    const rcv = this.wh.getChain(rcvChain);
    return await rcv.getTokenBridge();
  }

  async isTransferCompleted(vaa: TokenBridge.TransferVAA): Promise<boolean> {
    const rcvTb = await this.getTokenBridge(vaa);
    return rcvTb.isTransferCompleted(vaa);
  }

  async redeem(
    vaa: TokenBridge.TransferVAA,
    receiver: string,
    sign: (tx: UnsignedTransaction) => void
  ): Promise<void> {
    const rcvTb = await this.getTokenBridge(vaa);
    const rcvChain = vaa.payload.to.chain;
    const rcvAddr = Wormhole.chainAddress(rcvChain, receiver);
    const redeem = rcvTb.redeem(rcvAddr.address, vaa);
    for await (const tx of redeem) {
      sign(tx);
    }
  }
}
