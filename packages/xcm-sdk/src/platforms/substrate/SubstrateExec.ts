import {
  Asset,
  AssetAmount,
  CallType,
  Dex,
  DexFactory,
} from '@galacticcouncil/xcm-core';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

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
    const { api: srcApi, asset: srcAsset } = this.#src;

    const {
      api: dstApi,
      asset: dstAsset,
      chain: dstChain,
      decimals: dstDecimals,
    } = this.#dst;

    const dstFeeLocation = dstChain.getAssetXcmLocation(dstAsset);
    const dstExtrinsic = dstApi.tx(dstCall.data);
    const dstPaymentInfo = await dstExtrinsic.paymentInfo(dstAccount);

    const dstFeeAmount = (dstPaymentInfo.partialFee.toBigInt() * 120n) / 100n;

    const dstFee = AssetAmount.fromAsset(dstAsset, {
      amount: dstFeeAmount,
      decimals: dstDecimals,
    });

    const dstRefTime = dstPaymentInfo.weight.refTime.toNumber();
    const dstProofSize = dstPaymentInfo.weight.proofSize.toString();
    const dstCallEncoded = dstExtrinsic.method.toHex();

    const transactXcmDest = buildXcmDest(dstChain);
    const transactXcmMessage = buildXcmMessage(
      dstAccount,
      dstFeeLocation,
      dstFee,
      dstRefTime,
      dstProofSize,
      dstCallEncoded
    );

    const transactTx = srcApi.tx.polkadotXcm.send(
      transactXcmDest,
      transactXcmMessage
    );

    const calls: SubmittableExtrinsic[] = [];

    if (this.#dex) {
      const swapTxHash = await this.#dex.getCalldata(
        srcAccount,
        opts.srcFeeAsset || srcAsset,
        dstAsset,
        dstFee,
        10 // swap slippage
      );
      const swapTx = srcApi.tx(swapTxHash);
      calls.push(swapTx);
    }

    const transferCall = await transfer(dstFee);
    const transferTx = srcApi.tx(transferCall.data);

    calls.push(transferTx);
    calls.push(transactTx);

    const batchTx = srcApi.tx.utility.batchAll(calls);

    return {
      from: srcAccount,
      data: batchTx.toHex(),
      type: CallType.Substrate,
      dryRun: this.#src.isDryRunSupported()
        ? async () => {
            try {
              const { executionResult, emittedEvents, forwardedXcms } =
                await this.#src.dryRun(srcAccount, batchTx);

              console.log(executionResult.asOk.toHuman());

              const error = executionResult.isErr
                ? getErrorFromDryRun(this.#src.api, executionResult.asErr)
                : undefined;

              return {
                call: 'polkadotXcm.send',
                error: error,
                events: emittedEvents.toHuman(),
                xcm: forwardedXcms.toHuman(),
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
