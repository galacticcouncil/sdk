// .papi/descriptors/src/assethub.ts
var toBinary = (() => {
  const table = new Uint8Array(128);
  for (let i = 0; i < 64; i++)
    table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
  return (base64) => {
    const n = base64.length,
      bytes = new Uint8Array(
        (((n - Number(base64[n - 1] === '=') - Number(base64[n - 2] === '=')) *
          3) /
          4) |
          0
      );
    for (let i2 = 0, j = 0; i2 < n; ) {
      const c0 = table[base64.charCodeAt(i2++)],
        c1 = table[base64.charCodeAt(i2++)];
      const c2 = table[base64.charCodeAt(i2++)],
        c3 = table[base64.charCodeAt(i2++)];
      bytes[j++] = (c0 << 2) | (c1 >> 4);
      bytes[j++] = (c1 << 4) | (c2 >> 2);
      bytes[j++] = (c2 << 6) | c3;
    }
    return bytes;
  };
})();
var descriptorValues = import('./descriptors-TSCF3OT5.mjs').then(
  (module) => module['Assethub']
);
var metadataTypes = import('./metadataTypes-XXC3EOOA.mjs').then((module) =>
  toBinary('default' in module ? module.default : module)
);
var asset = {};
var _allDescriptors = { descriptors: descriptorValues, metadataTypes, asset };
var assethub_default = _allDescriptors;

// .papi/descriptors/src/hydration.ts
var toBinary2 = (() => {
  const table = new Uint8Array(128);
  for (let i = 0; i < 64; i++)
    table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
  return (base64) => {
    const n = base64.length,
      bytes = new Uint8Array(
        (((n - Number(base64[n - 1] === '=') - Number(base64[n - 2] === '=')) *
          3) /
          4) |
          0
      );
    for (let i2 = 0, j = 0; i2 < n; ) {
      const c0 = table[base64.charCodeAt(i2++)],
        c1 = table[base64.charCodeAt(i2++)];
      const c2 = table[base64.charCodeAt(i2++)],
        c3 = table[base64.charCodeAt(i2++)];
      bytes[j++] = (c0 << 2) | (c1 >> 4);
      bytes[j++] = (c1 << 4) | (c2 >> 2);
      bytes[j++] = (c2 << 6) | c3;
    }
    return bytes;
  };
})();
var descriptorValues2 = import('./descriptors-TSCF3OT5.mjs').then(
  (module) => module['Hydration']
);
var metadataTypes2 = import('./metadataTypes-XXC3EOOA.mjs').then((module) =>
  toBinary2('default' in module ? module.default : module)
);
var asset2 = {};
var _allDescriptors2 = {
  descriptors: descriptorValues2,
  metadataTypes: metadataTypes2,
  asset: asset2,
};
var hydration_default = _allDescriptors2;

// .papi/descriptors/src/common-types.ts
import { _Enum } from 'polkadot-api';
var DigestItem = _Enum;
var Phase = _Enum;
var DispatchClass = _Enum;
var TokenError = _Enum;
var ArithmeticError = _Enum;
var TransactionalError = _Enum;
var BalanceStatus = _Enum;
var TransactionPaymentEvent = _Enum;
var XcmV3Junctions = _Enum;
var XcmV3Junction = _Enum;
var XcmV3JunctionNetworkId = _Enum;
var XcmV3JunctionBodyId = _Enum;
var XcmV2JunctionBodyPart = _Enum;
var VestingEvent = _Enum;
var SessionEvent = _Enum;
var XcmV4TraitsOutcome = _Enum;
var XcmV3TraitsError = _Enum;
var XcmV4Instruction = _Enum;
var XcmV3MultiassetFungibility = _Enum;
var XcmV3MultiassetAssetInstance = _Enum;
var XcmV4Response = _Enum;
var XcmV3MaybeErrorCode = _Enum;
var XcmV2OriginKind = _Enum;
var XcmV4AssetAssetFilter = _Enum;
var XcmV4AssetWildAsset = _Enum;
var XcmV2MultiassetWildFungibility = _Enum;
var XcmV3WeightLimit = _Enum;
var XcmVersionedAssets = _Enum;
var XcmV2MultiassetAssetId = _Enum;
var XcmV2MultilocationJunctions = _Enum;
var XcmV2Junction = _Enum;
var XcmV2NetworkId = _Enum;
var XcmV2BodyId = _Enum;
var XcmV2MultiassetFungibility = _Enum;
var XcmV2MultiassetAssetInstance = _Enum;
var XcmV3MultiassetAssetId = _Enum;
var XcmVersionedLocation = _Enum;
var UpgradeGoAhead = _Enum;
var UpgradeRestriction = _Enum;
var BalancesTypesReasons = _Enum;
var TransactionPaymentReleases = _Enum;
var Version = _Enum;
var XcmPalletQueryStatus = _Enum;
var XcmVersionedResponse = _Enum;
var XcmV2Response = _Enum;
var XcmV2TraitsError = _Enum;
var XcmV3Response = _Enum;
var XcmPalletVersionMigrationStage = _Enum;
var XcmVersionedAssetId = _Enum;
var MultiAddress = _Enum;
var BalancesAdjustmentDirection = _Enum;
var XcmVersionedXcm = _Enum;
var XcmV2Instruction = _Enum;
var XcmV2MultiAssetFilter = _Enum;
var XcmV2MultiassetWildMultiAsset = _Enum;
var XcmV2WeightLimit = _Enum;
var XcmV3Instruction = _Enum;
var XcmV3MultiassetMultiAssetFilter = _Enum;
var XcmV3MultiassetWildMultiAsset = _Enum;
var DispatchRawOrigin = _Enum;
var XcmPalletOrigin = _Enum;
var MultiSignature = _Enum;
var TransactionValidityError = _Enum;
var TransactionValidityInvalidTransaction = _Enum;
var TransactionValidityUnknownTransaction = _Enum;
var TransactionValidityTransactionSource = _Enum;
var PreimageEvent = _Enum;
var ConvictionVotingEvent = _Enum;
var PreimagesBounded = _Enum;
var ProcessMessageError = _Enum;
var PreimagePalletHoldReason = _Enum;
var PreimageOldRequestStatus = _Enum;
var PreimageRequestStatus = _Enum;
var IdentityJudgement = _Enum;
var IdentityData = _Enum;
var VotingConviction = _Enum;
var ConvictionVotingVoteAccountVote = _Enum;
var TraitsScheduleDispatchTime = _Enum;
var ConvictionVotingVoteVoting = _Enum;
var ReferendaTypesCurve = _Enum;
export {
  ArithmeticError,
  BalanceStatus,
  BalancesAdjustmentDirection,
  BalancesTypesReasons,
  ConvictionVotingEvent,
  ConvictionVotingVoteAccountVote,
  ConvictionVotingVoteVoting,
  DigestItem,
  DispatchClass,
  DispatchRawOrigin,
  IdentityData,
  IdentityJudgement,
  MultiAddress,
  MultiSignature,
  Phase,
  PreimageEvent,
  PreimageOldRequestStatus,
  PreimagePalletHoldReason,
  PreimageRequestStatus,
  PreimagesBounded,
  ProcessMessageError,
  ReferendaTypesCurve,
  SessionEvent,
  TokenError,
  TraitsScheduleDispatchTime,
  TransactionPaymentEvent,
  TransactionPaymentReleases,
  TransactionValidityError,
  TransactionValidityInvalidTransaction,
  TransactionValidityTransactionSource,
  TransactionValidityUnknownTransaction,
  TransactionalError,
  UpgradeGoAhead,
  UpgradeRestriction,
  Version,
  VestingEvent,
  VotingConviction,
  XcmPalletOrigin,
  XcmPalletQueryStatus,
  XcmPalletVersionMigrationStage,
  XcmV2BodyId,
  XcmV2Instruction,
  XcmV2Junction,
  XcmV2JunctionBodyPart,
  XcmV2MultiAssetFilter,
  XcmV2MultiassetAssetId,
  XcmV2MultiassetAssetInstance,
  XcmV2MultiassetFungibility,
  XcmV2MultiassetWildFungibility,
  XcmV2MultiassetWildMultiAsset,
  XcmV2MultilocationJunctions,
  XcmV2NetworkId,
  XcmV2OriginKind,
  XcmV2Response,
  XcmV2TraitsError,
  XcmV2WeightLimit,
  XcmV3Instruction,
  XcmV3Junction,
  XcmV3JunctionBodyId,
  XcmV3JunctionNetworkId,
  XcmV3Junctions,
  XcmV3MaybeErrorCode,
  XcmV3MultiassetAssetId,
  XcmV3MultiassetAssetInstance,
  XcmV3MultiassetFungibility,
  XcmV3MultiassetMultiAssetFilter,
  XcmV3MultiassetWildMultiAsset,
  XcmV3Response,
  XcmV3TraitsError,
  XcmV3WeightLimit,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
  XcmV4Instruction,
  XcmV4Response,
  XcmV4TraitsOutcome,
  XcmVersionedAssetId,
  XcmVersionedAssets,
  XcmVersionedLocation,
  XcmVersionedResponse,
  XcmVersionedXcm,
  assethub_default as assethub,
  hydration_default as hydration,
};
