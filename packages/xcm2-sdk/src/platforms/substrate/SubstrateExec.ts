import {
  Asset,
  AssetAmount,
  CallType,
  Dex,
  DexFactory,
} from '@galacticcouncil/xcm2-core';

import { Binary } from 'polkadot-api';

import { SubstrateService } from './SubstrateService';
import { SubstrateCall, SubstrateDryRunResult } from './types';
import { buildXcmDest, buildXcmMessage, getErrorFromDryRun } from './utils';

import { Call } from '../types';

export class SubstrateExec {
  readonly #src: SubstrateService;
  readonly #dst: SubstrateService;
  readonly #dex: Dex | undefined;

  constructor(src: SubstrateService, dst: SubstrateService) {
    this.#src = src;
    this.#dst = dst;
    this.#dex = DexFactory.getInstance().get(src.chain.key);
  }

  async remoteExec(
    srcAccount: string,
    dstAccount: string,
    dstCall: SubstrateCall,
    transfer: (fees: AssetAmount) => Promise<Call>,
    opts: {
      srcFeeAsset?: Asset;
    } = {}
  ): Promise<SubstrateCall> {
    const srcApi = this.#src.api;
    const srcAsset = await this.#src.getAsset();

    const dstApi = this.#dst.api;
    const dstAsset = await this.#dst.getAsset();
    const dstChain = this.#dst.chain;
    const dstDecimals = await this.#dst.getDecimals();

    const dstFeeLocation = dstChain.getAssetXcmLocation(dstAsset);
    const dstExtrinsic = await dstApi.txFromCallData(Binary.fromHex(dstCall.data));
    const dstPaymentInfo = await dstExtrinsic.getPaymentInfo(dstAccount);

    const dstFeeAmount = (BigInt(dstPaymentInfo.partial_fee) * 120n) / 100n;

    const dstFee = AssetAmount.fromAsset(dstAsset, {
      amount: dstFeeAmount,
      decimals: dstDecimals,
    });

    const dstRefTime = Number(dstPaymentInfo.weight.ref_time);
    const dstProofSize = String(dstPaymentInfo.weight.proof_size);
    const dstCallEncoded = dstCall.data;

    const transactXcmDest = buildXcmDest(dstChain);
    const transactXcmMessage = buildXcmMessage(
      dstAccount,
      dstFeeLocation,
      dstFee,
      dstRefTime,
      dstProofSize,
      dstCallEncoded
    );

    const transactTx = (srcApi.tx.PolkadotXcm as any).send({
      dest: transactXcmDest,
      message: transactXcmMessage,
    });

    const calls: any[] = [];

    if (this.#dex) {
      const swapTxHash = await this.#dex.getCalldata(
        srcAccount,
        opts.srcFeeAsset || srcAsset,
        dstAsset,
        dstFee,
        10 // swap slippage
      );
      const swapTx = await srcApi.txFromCallData(Binary.fromHex(swapTxHash));
      calls.push(swapTx);
    }

    const transferCall = await transfer(dstFee);
    const transferTx = await srcApi.txFromCallData(Binary.fromHex(transferCall.data));

    calls.push(transferTx);
    calls.push(transactTx);

    const batchTx = (srcApi.tx.Utility as any).batch_all({ calls });

    return {
      from: srcAccount,
      data: batchTx.decodedCall as `0x${string}`,
      type: CallType.Substrate,
      dryRun: this.#src.isDryRunSupported()
        ? async () => {
            try {
              const dryRunResult = await this.#src.dryRun(srcAccount, batchTx);

              console.log(dryRunResult.execution_result);

              const error =
                dryRunResult.execution_result && !dryRunResult.execution_result.success
                  ? getErrorFromDryRun(dryRunResult.execution_result.value)
                  : undefined;

              return {
                call: 'polkadotXcm.send',
                error: error,
                events: dryRunResult.emitted_events || [],
                xcm: dryRunResult.forwarded_xcms || [],
              } as SubstrateDryRunResult;
            } catch (e) {
              return {
                call: 'polkadotXcm.send',
                error: e instanceof Error ? e.message : 'unknown',
              } as SubstrateDryRunResult;
            }
          }
        : () => {},
    } as SubstrateCall;
  }
}
