import { acc } from '@galacticcouncil/common';

import {
  buildVdotMintXcm,
  buildVdotSupplyRehearsalXcm,
  buildVdotSupplyXcm,
} from './vdot';

const SIGNER = '5F2SeXfnUuvQ7nux5b7dTHgUoePgiCW38Czk78YQuJPfjunb';
const SIGNER_ID =
  '0x82fb02afe02fe5d6c793145a75e6860c4e206682c3ab395a9d2a941eb7c0d30d';

const BUDGETS = { hydration: 1n, assetHub: 20n, bifrost: 300n };
const CALL = new Uint8Array([1, 2, 3]);

const types = (xcm: { type: string }[]) => xcm.map((i) => i.type);

describe('vDOT mint accounts', () => {
  it('derives the signer account on Bifrost and the helper on Hydration', () => {
    const onBifrost = acc.getMultilocationDerivatedAccount(2034, SIGNER, 1);
    const helper = acc.getMultilocationDerivatedAccount(2030, onBifrost, 1);

    // Polkadot (prefix 0) forms: 16Yh3JzW…rvRdM and 13eRNhT8…M5pr, seen on chain
    expect(onBifrost).toBe('5HcPtyjSGoKedJz9qaVSXh6W2AJtpc3y8iMD12zQo5aLjxg1');
    expect(helper).toBe('5Ei8ENC4zHinbqCayUcWZpBf8beUkA58bVnHbjNznmYFAZkj');
  });
});

describe('buildVdotMintXcm', () => {
  const xcm = buildVdotMintXcm({
    account: SIGNER,
    amount: 1_000n,
    budgets: BUDGETS,
    bifrostCall: CALL,
  });

  it('withdraws the amount and pays Hydration its budget', () => {
    expect(types(xcm)).toEqual([
      'WithdrawAsset',
      'PayFees',
      'SetAppendix',
      'InitiateTransfer',
    ]);
    expect((xcm[0].value as any)[0].fun.value).toBe(1_000n);
    expect((xcm[1].value as any).asset.fun.value).toBe(BUDGETS.hydration);
  });

  it('keeps the origin to Asset Hub and on to Bifrost', () => {
    const toAssetHub = xcm[3].value as any;
    expect(toAssetHub.destination.interior.value.value).toBe(1000);
    expect(toAssetHub.preserve_origin).toBe(true);
    expect(toAssetHub.remote_fees.value.value[0].fun.value).toBe(
      BUDGETS.assetHub
    );

    const [, toBifrost] = toAssetHub.remote_xcm;
    expect(toBifrost.value.destination.interior.value.value).toBe(2030);
    expect(toBifrost.value.preserve_origin).toBe(true);
    expect(toBifrost.value.remote_fees.value.value[0].fun.value).toBe(
      BUDGETS.bifrost
    );
  });

  it('deposits on the signer Bifrost account before dispatching the call', () => {
    const toAssetHub = xcm[3].value as any;
    const onBifrost = toAssetHub.remote_xcm[1].value.remote_xcm;

    expect(types(onBifrost)).toEqual([
      'SetAppendix',
      'DepositAsset',
      'Transact',
    ]);
    const [para, account] = onBifrost[1].value.beneficiary.interior.value;
    expect(para.value).toBe(2034);
    expect(account.value.id).toBe(SIGNER_ID);
    expect(onBifrost[2].value.call).toBe(CALL);
  });
});

describe('buildVdotSupplyXcm', () => {
  it('pays in vDOT, refunds the helper, then runs its call', () => {
    const xcm = buildVdotSupplyXcm({
      helper: SIGNER,
      fee: 7n,
      helperCall: CALL,
    });

    expect(types(xcm)).toEqual([
      'WithdrawAsset',
      'PayFees',
      'SetAppendix',
      'Transact',
    ]);
    expect((xcm[1].value as any).asset.fun.value).toBe(7n);
    expect((xcm[3].value as any).call).toBe(CALL);
  });
});

describe('buildVdotSupplyRehearsalXcm', () => {
  it('funds the helper and replays the supply under the Bifrost account origin', () => {
    const params = {
      helper: SIGNER,
      fee: 7n,
      helperCall: CALL,
      credited: 100n,
      bifrostAccount: SIGNER,
    };
    const xcm = buildVdotSupplyRehearsalXcm(params);

    expect(types(xcm.slice(0, 4))).toEqual([
      'ReserveAssetDeposited',
      'PayFees',
      'DepositAsset',
      'DescendOrigin',
    ]);
    expect((xcm[0].value as any)[0].fun.value).toBe(107n);
    expect(xcm.slice(4)).toEqual(buildVdotSupplyXcm(params));
  });
});
