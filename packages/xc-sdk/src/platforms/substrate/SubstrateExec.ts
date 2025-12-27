import { Asset, AssetAmount, CallType } from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';

import { SubstrateService } from './SubstrateService';

import { SubstrateCall, SubstrateDryRunResult } from './types';
import { buildXcmDest, buildXcmMessage, getErrorFromDryRun } from './utils';

import { Call } from '../types';

export class SubstrateExec {
  readonly #src: SubstrateService;
  readonly #dst: SubstrateService;

  constructor(src: SubstrateService, dst: SubstrateService) {
    this.#src = src;
    this.#dst = dst;
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
    const dstChain = this.#dst.chain;

    const dstCuurrency = await dstChain.getCurrency();
    const dstAsset = dstCuurrency.asset;
    const dstDecimals = dstCuurrency.decimals;

    const dstFeeLocation = dstChain.getAssetXcmLocation(dstAsset);
    const dstCallBinary = Binary.fromHex(dstCall.data);

    const dstExtrinsic = await dstApi.txFromCallData(dstCallBinary);
    const dstPaymentInfo = await dstExtrinsic.getPaymentInfo(dstAccount);

    const dstFeeAmount = (BigInt(dstPaymentInfo.partial_fee) * 120n) / 100n;

    const dstFee = AssetAmount.fromAsset(dstAsset, {
      amount: dstFeeAmount,
      decimals: dstDecimals,
    });

    const dstRefTime = dstPaymentInfo.weight.ref_time;
    const dstProofSize = dstPaymentInfo.weight.proof_size;

    const transactXcmDest = buildXcmDest(dstChain);
    const transactXcmMessage = buildXcmMessage(
      dstAccount,
      dstFeeLocation,
      dstFee,
      dstRefTime,
      dstProofSize,
      dstCallBinary
    );

    const transactTx = srcApi.tx.PolkadotXcm.send({
      dest: transactXcmDest,
      message: transactXcmMessage,
    });

    const calls: any[] = [];

    try {
      const swapTxHash = await this.#src.chain.dex.getCalldata(
        srcAccount,
        opts.srcFeeAsset || srcAsset,
        dstAsset,
        dstFee,
        10 // swap slippage
      );
      const swapBinary = Binary.fromHex(swapTxHash);
      const swapTx = await srcApi.txFromCallData(swapBinary);
      calls.push(swapTx);
    } catch {}

    const transferCall = await transfer(dstFee);
    const transferBinary = Binary.fromHex(transferCall.data);
    const transferTx = await srcApi.txFromCallData(transferBinary);

    calls.push(transferTx);
    calls.push(transactTx);

    const decoded = calls.map((c) => c.decodedCall);

    const batchTx = srcApi.tx.Utility.batch_all({ calls: decoded });
    const batchTxEncoded = await batchTx.getEncodedData();

    return {
      from: srcAccount,
      data: batchTxEncoded.asHex(),
      type: CallType.Substrate,
      dryRun: this.#src.isDryRunSupported()
        ? async () => {
            try {
              const dryRunResult = await this.#src.dryRun(srcAccount, batchTx);

              const error =
                dryRunResult.execution_result &&
                dryRunResult.execution_result.success
                  ? undefined
                  : getErrorFromDryRun(dryRunResult.execution_result);

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
