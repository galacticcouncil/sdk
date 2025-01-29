import {
  Enum,
  GetEnum,
  FixedSizeBinary,
  Binary,
  SS58String,
  FixedSizeArray,
  ResultPayload,
  TxCallData,
} from 'polkadot-api';
type AnonymousEnum<T extends {}> = T & {
  __anonymous: true;
};
type MyTuple<T> = [T, ...T[]];
type SeparateUndefined<T> = undefined extends T
  ? undefined | Exclude<T, undefined>
  : T;
type Anonymize<T> = SeparateUndefined<
  T extends FixedSizeBinary<infer L>
    ? number extends L
      ? Binary
      : FixedSizeBinary<L>
    : T extends
          | string
          | number
          | bigint
          | boolean
          | void
          | undefined
          | null
          | symbol
          | Uint8Array
          | Enum<any>
      ? T
      : T extends AnonymousEnum<infer V>
        ? Enum<V>
        : T extends MyTuple<any>
          ? {
              [K in keyof T]: T[K];
            }
          : T extends []
            ? []
            : T extends FixedSizeArray<infer L, infer T>
              ? number extends L
                ? Array<T>
                : FixedSizeArray<L, T>
              : {
                  [K in keyof T & string]: T[K];
                }
>;
export type I5sesotjlssv2d = {
  nonce: number;
  consumers: number;
  providers: number;
  sufficients: number;
  data: Anonymize<I1q8tnt1cluu5j>;
};
export type I1q8tnt1cluu5j = {
  free: bigint;
  reserved: bigint;
  frozen: bigint;
  flags: bigint;
};
export type Iffmde3ekjedi9 = {
  normal: Anonymize<I4q39t5hn830vp>;
  operational: Anonymize<I4q39t5hn830vp>;
  mandatory: Anonymize<I4q39t5hn830vp>;
};
export type I4q39t5hn830vp = {
  ref_time: bigint;
  proof_size: bigint;
};
export type I4mddgoa69c0a2 = Array<DigestItem>;
export type DigestItem = Enum<{
  PreRuntime: Anonymize<I82jm9g7pufuel>;
  Consensus: Anonymize<I82jm9g7pufuel>;
  Seal: Anonymize<I82jm9g7pufuel>;
  Other: Binary;
  RuntimeEnvironmentUpdated: undefined;
}>;
export declare const DigestItem: GetEnum<DigestItem>;
export type I82jm9g7pufuel = [FixedSizeBinary<4>, Binary];
export type I337ai2btcivaq = Array<Anonymize<I11cj6t2vcmlfq>>;
export type I11cj6t2vcmlfq = {
  phase: Phase;
  event: Anonymize<I668na8k863p14>;
  topics: Anonymize<Ic5m5lp1oioo8r>;
};
export type Phase = Enum<{
  ApplyExtrinsic: number;
  Finalization: undefined;
  Initialization: undefined;
}>;
export declare const Phase: GetEnum<Phase>;
export type I668na8k863p14 = AnonymousEnum<{
  System: Anonymize<I2t5vkq7dgaeal>;
  ParachainSystem: Anonymize<Icbsekf57miplo>;
  Balances: Anonymize<Iao8h4hv7atnq3>;
  TransactionPayment: TransactionPaymentEvent;
  AssetTxPayment: Anonymize<Ifagg2q2o5fgjl>;
  Vesting: VestingEvent;
  CollatorSelection: Anonymize<I4srakrmf0fspo>;
  Session: SessionEvent;
  XcmpQueue: Anonymize<Idsqc7mhp6nnle>;
  PolkadotXcm: Anonymize<I5ce1ru810vv9d>;
  CumulusXcm: Anonymize<Ibvp9t1gqae5ct>;
  MessageQueue: Anonymize<I2kosejppk3jon>;
  Utility: Anonymize<I45vovbl28u5ob>;
  Multisig: Anonymize<Icjl5oqk1eo6sb>;
  Proxy: Anonymize<I8qme4qa965a0r>;
  Assets: Anonymize<I6avancvg8fd05>;
  Uniques: Anonymize<Ia0j71vjrjqu9p>;
  Nfts: Anonymize<I6qicn8jn4fftj>;
  ForeignAssets: Anonymize<I81i2fkdo6nple>;
  PoolAssets: Anonymize<I6avancvg8fd05>;
  AssetConversion: Anonymize<I31lqq0fjfmnfv>;
}>;
export type I2t5vkq7dgaeal = AnonymousEnum<{
  /**
   *An extrinsic completed successfully.
   */
  ExtrinsicSuccess: Anonymize<Ia82mnkmeo2rhc>;
  /**
   *An extrinsic failed.
   */
  ExtrinsicFailed: Anonymize<Iane057r2vqar>;
  /**
   *`:code` was updated.
   */
  CodeUpdated: undefined;
  /**
   *A new account was created.
   */
  NewAccount: Anonymize<Icbccs0ug47ilf>;
  /**
   *An account was reaped.
   */
  KilledAccount: Anonymize<Icbccs0ug47ilf>;
  /**
   *On on-chain remark happened.
   */
  Remarked: Anonymize<I855j4i3kr8ko1>;
  /**
   *An upgrade was authorized.
   */
  UpgradeAuthorized: Anonymize<Ibgl04rn6nbfm6>;
}>;
export type Ia82mnkmeo2rhc = {
  dispatch_info: Anonymize<Ic9s8f85vjtncc>;
};
export type Ic9s8f85vjtncc = {
  weight: Anonymize<I4q39t5hn830vp>;
  class: DispatchClass;
  pays_fee: Anonymize<Iehg04bj71rkd>;
};
export type DispatchClass = Enum<{
  Normal: undefined;
  Operational: undefined;
  Mandatory: undefined;
}>;
export declare const DispatchClass: GetEnum<DispatchClass>;
export type Iehg04bj71rkd = AnonymousEnum<{
  Yes: undefined;
  No: undefined;
}>;
export type Iane057r2vqar = {
  dispatch_error: Anonymize<Icogrvf0inr18b>;
  dispatch_info: Anonymize<Ic9s8f85vjtncc>;
};
export type Icogrvf0inr18b = AnonymousEnum<{
  Other: undefined;
  CannotLookup: undefined;
  BadOrigin: undefined;
  Module: Anonymize<Iasm4f970q7bf9>;
  ConsumerRemaining: undefined;
  NoProviders: undefined;
  TooManyConsumers: undefined;
  Token: TokenError;
  Arithmetic: ArithmeticError;
  Transactional: TransactionalError;
  Exhausted: undefined;
  Corruption: undefined;
  Unavailable: undefined;
  RootNotAllowed: undefined;
}>;
export type Iasm4f970q7bf9 = AnonymousEnum<{
  System: Anonymize<I5o0s7c8q1cc9b>;
  ParachainSystem: Anonymize<I9p95gln24a0rn>;
  Timestamp: undefined;
  ParachainInfo: undefined;
  Balances: Anonymize<Idj13i7adlomht>;
  TransactionPayment: undefined;
  AssetTxPayment: undefined;
  Vesting: Anonymize<Icof2acl69lq3c>;
  Authorship: undefined;
  CollatorSelection: Anonymize<I36bcffk2387dv>;
  Session: Anonymize<I1e07dgbaqd1sq>;
  Aura: undefined;
  AuraExt: undefined;
  XcmpQueue: Anonymize<Idnnbndsjjeqqs>;
  PolkadotXcm: Anonymize<I87j95aq93d7dq>;
  CumulusXcm: undefined;
  ToKusamaXcmRouter: undefined;
  MessageQueue: Anonymize<I5iupade5ag2dp>;
  Utility: Anonymize<I8dt2g2hcrgh36>;
  Multisig: Anonymize<Ia76qmhhg4jvb9>;
  Proxy: Anonymize<Iuvt54ei4cehc>;
  Assets: Anonymize<Iapedqb0veh71>;
  Uniques: Anonymize<Ienq2ge2rhv4jm>;
  Nfts: Anonymize<I58r1150kmj18u>;
  ForeignAssets: Anonymize<Iapedqb0veh71>;
  PoolAssets: Anonymize<Iapedqb0veh71>;
  AssetConversion: Anonymize<I4u78hb23uhvi2>;
}>;
export type I5o0s7c8q1cc9b = AnonymousEnum<{
  /**
   *The name of specification does not match between the current runtime
   *and the new runtime.
   */
  InvalidSpecName: undefined;
  /**
   *The specification version is not allowed to decrease between the current runtime
   *and the new runtime.
   */
  SpecVersionNeedsToIncrease: undefined;
  /**
   *Failed to extract the runtime version from the new runtime.
   *
   *Either calling `Core_version` or decoding `RuntimeVersion` failed.
   */
  FailedToExtractRuntimeVersion: undefined;
  /**
   *Suicide called when the account has non-default composite data.
   */
  NonDefaultComposite: undefined;
  /**
   *There is a non-zero reference count preventing the account from being purged.
   */
  NonZeroRefCount: undefined;
  /**
   *The origin filter prevent the call to be dispatched.
   */
  CallFiltered: undefined;
  /**
   *A multi-block migration is ongoing and prevents the current code from being replaced.
   */
  MultiBlockMigrationsOngoing: undefined;
  /**
   *No upgrade authorized.
   */
  NothingAuthorized: undefined;
  /**
   *The submitted code is not authorized.
   */
  Unauthorized: undefined;
}>;
export type I9p95gln24a0rn = AnonymousEnum<{
  /**
   *Attempt to upgrade validation function while existing upgrade pending.
   */
  OverlappingUpgrades: undefined;
  /**
   *Polkadot currently prohibits this parachain from upgrading its validation function.
   */
  ProhibitedByPolkadot: undefined;
  /**
   *The supplied validation function has compiled into a blob larger than Polkadot is
   *willing to run.
   */
  TooBig: undefined;
  /**
   *The inherent which supplies the validation data did not run this block.
   */
  ValidationDataNotAvailable: undefined;
  /**
   *The inherent which supplies the host configuration did not run this block.
   */
  HostConfigurationNotAvailable: undefined;
  /**
   *No validation function upgrade is currently scheduled.
   */
  NotScheduled: undefined;
  /**
   *No code upgrade has been authorized.
   */
  NothingAuthorized: undefined;
  /**
   *The given code upgrade has not been authorized.
   */
  Unauthorized: undefined;
}>;
export type Idj13i7adlomht = AnonymousEnum<{
  /**
   *Vesting balance too high to send value.
   */
  VestingBalance: undefined;
  /**
   *Account liquidity restrictions prevent withdrawal.
   */
  LiquidityRestrictions: undefined;
  /**
   *Balance too low to send value.
   */
  InsufficientBalance: undefined;
  /**
   *Value too low to create account due to existential deposit.
   */
  ExistentialDeposit: undefined;
  /**
   *Transfer/payment would kill account.
   */
  Expendability: undefined;
  /**
   *A vesting schedule already exists for this account.
   */
  ExistingVestingSchedule: undefined;
  /**
   *Beneficiary account must pre-exist.
   */
  DeadAccount: undefined;
  /**
   *Number of named reserves exceed `MaxReserves`.
   */
  TooManyReserves: undefined;
  /**
   *Number of holds exceed `VariantCountOf<T::RuntimeHoldReason>`.
   */
  TooManyHolds: undefined;
  /**
   *Number of freezes exceed `MaxFreezes`.
   */
  TooManyFreezes: undefined;
  /**
   *The issuance cannot be modified since it is already deactivated.
   */
  IssuanceDeactivated: undefined;
  /**
   *The delta cannot be zero.
   */
  DeltaZero: undefined;
}>;
export type Icof2acl69lq3c = AnonymousEnum<{
  /**
   *The account given is not vesting.
   */
  NotVesting: undefined;
  /**
   *The account already has `MaxVestingSchedules` count of schedules and thus
   *cannot add another one. Consider merging existing schedules in order to add another.
   */
  AtMaxVestingSchedules: undefined;
  /**
   *Amount being transferred is too low to create a vesting schedule.
   */
  AmountLow: undefined;
  /**
   *An index was out of bounds of the vesting schedules.
   */
  ScheduleIndexOutOfBounds: undefined;
  /**
   *Failed to create a new schedule because some parameter was invalid.
   */
  InvalidScheduleParams: undefined;
}>;
export type I36bcffk2387dv = AnonymousEnum<{
  /**
   *The pallet has too many candidates.
   */
  TooManyCandidates: undefined;
  /**
   *Leaving would result in too few candidates.
   */
  TooFewEligibleCollators: undefined;
  /**
   *Account is already a candidate.
   */
  AlreadyCandidate: undefined;
  /**
   *Account is not a candidate.
   */
  NotCandidate: undefined;
  /**
   *There are too many Invulnerables.
   */
  TooManyInvulnerables: undefined;
  /**
   *Account is already an Invulnerable.
   */
  AlreadyInvulnerable: undefined;
  /**
   *Account is not an Invulnerable.
   */
  NotInvulnerable: undefined;
  /**
   *Account has no associated validator ID.
   */
  NoAssociatedValidatorId: undefined;
  /**
   *Validator ID is not yet registered.
   */
  ValidatorNotRegistered: undefined;
  /**
   *Could not insert in the candidate list.
   */
  InsertToCandidateListFailed: undefined;
  /**
   *Could not remove from the candidate list.
   */
  RemoveFromCandidateListFailed: undefined;
  /**
   *New deposit amount would be below the minimum candidacy bond.
   */
  DepositTooLow: undefined;
  /**
   *Could not update the candidate list.
   */
  UpdateCandidateListFailed: undefined;
  /**
   *Deposit amount is too low to take the target's slot in the candidate list.
   */
  InsufficientBond: undefined;
  /**
   *The target account to be replaced in the candidate list is not a candidate.
   */
  TargetIsNotCandidate: undefined;
  /**
   *The updated deposit amount is equal to the amount already reserved.
   */
  IdenticalDeposit: undefined;
  /**
   *Cannot lower candidacy bond while occupying a future collator slot in the list.
   */
  InvalidUnreserve: undefined;
}>;
export type I1e07dgbaqd1sq = AnonymousEnum<{
  /**
   *Invalid ownership proof.
   */
  InvalidProof: undefined;
  /**
   *No associated validator ID for account.
   */
  NoAssociatedValidatorId: undefined;
  /**
   *Registered duplicate key.
   */
  DuplicatedKey: undefined;
  /**
   *No keys are associated with this account.
   */
  NoKeys: undefined;
  /**
   *Key setting account is not live, so it's impossible to associate keys.
   */
  NoAccount: undefined;
}>;
export type Idnnbndsjjeqqs = AnonymousEnum<{
  /**
   *Setting the queue config failed since one of its values was invalid.
   */
  BadQueueConfig: undefined;
  /**
   *The execution is already suspended.
   */
  AlreadySuspended: undefined;
  /**
   *The execution is already resumed.
   */
  AlreadyResumed: undefined;
  /**
   *There are too many active outbound channels.
   */
  TooManyActiveOutboundChannels: undefined;
  /**
   *The message is too big.
   */
  TooBig: undefined;
}>;
export type I87j95aq93d7dq = AnonymousEnum<{
  /**
   *The desired destination was unreachable, generally because there is a no way of routing
   *to it.
   */
  Unreachable: undefined;
  /**
   *There was some other issue (i.e. not to do with routing) in sending the message.
   *Perhaps a lack of space for buffering the message.
   */
  SendFailure: undefined;
  /**
   *The message execution fails the filter.
   */
  Filtered: undefined;
  /**
   *The message's weight could not be determined.
   */
  UnweighableMessage: undefined;
  /**
   *The destination `Location` provided cannot be inverted.
   */
  DestinationNotInvertible: undefined;
  /**
   *The assets to be sent are empty.
   */
  Empty: undefined;
  /**
   *Could not re-anchor the assets to declare the fees for the destination chain.
   */
  CannotReanchor: undefined;
  /**
   *Too many assets have been attempted for transfer.
   */
  TooManyAssets: undefined;
  /**
   *Origin is invalid for sending.
   */
  InvalidOrigin: undefined;
  /**
   *The version of the `Versioned` value used is not able to be interpreted.
   */
  BadVersion: undefined;
  /**
   *The given location could not be used (e.g. because it cannot be expressed in the
   *desired version of XCM).
   */
  BadLocation: undefined;
  /**
   *The referenced subscription could not be found.
   */
  NoSubscription: undefined;
  /**
   *The location is invalid since it already has a subscription from us.
   */
  AlreadySubscribed: undefined;
  /**
   *Could not check-out the assets for teleportation to the destination chain.
   */
  CannotCheckOutTeleport: undefined;
  /**
   *The owner does not own (all) of the asset that they wish to do the operation on.
   */
  LowBalance: undefined;
  /**
   *The asset owner has too many locks on the asset.
   */
  TooManyLocks: undefined;
  /**
   *The given account is not an identifiable sovereign account for any location.
   */
  AccountNotSovereign: undefined;
  /**
   *The operation required fees to be paid which the initiator could not meet.
   */
  FeesNotMet: undefined;
  /**
   *A remote lock with the corresponding data could not be found.
   */
  LockNotFound: undefined;
  /**
   *The unlock operation cannot succeed because there are still consumers of the lock.
   */
  InUse: undefined;
  /**
   *Invalid asset, reserve chain could not be determined for it.
   */
  InvalidAssetUnknownReserve: undefined;
  /**
   *Invalid asset, do not support remote asset reserves with different fees reserves.
   */
  InvalidAssetUnsupportedReserve: undefined;
  /**
   *Too many assets with different reserve locations have been attempted for transfer.
   */
  TooManyReserves: undefined;
  /**
   *Local XCM execution incomplete.
   */
  LocalExecutionIncomplete: undefined;
}>;
export type I5iupade5ag2dp = AnonymousEnum<{
  /**
   *Page is not reapable because it has items remaining to be processed and is not old
   *enough.
   */
  NotReapable: undefined;
  /**
   *Page to be reaped does not exist.
   */
  NoPage: undefined;
  /**
   *The referenced message could not be found.
   */
  NoMessage: undefined;
  /**
   *The message was already processed and cannot be processed again.
   */
  AlreadyProcessed: undefined;
  /**
   *The message is queued for future execution.
   */
  Queued: undefined;
  /**
   *There is temporarily not enough weight to continue servicing messages.
   */
  InsufficientWeight: undefined;
  /**
   *This message is temporarily unprocessable.
   *
   *Such errors are expected, but not guaranteed, to resolve themselves eventually through
   *retrying.
   */
  TemporarilyUnprocessable: undefined;
  /**
   *The queue is paused and no message can be executed from it.
   *
   *This can change at any time and may resolve in the future by re-trying.
   */
  QueuePaused: undefined;
  /**
   *Another call is in progress and needs to finish before this call can happen.
   */
  RecursiveDisallowed: undefined;
}>;
export type I8dt2g2hcrgh36 = AnonymousEnum<{
  /**
   *Too many calls batched.
   */
  TooManyCalls: undefined;
}>;
export type Ia76qmhhg4jvb9 = AnonymousEnum<{
  /**
   *Threshold must be 2 or greater.
   */
  MinimumThreshold: undefined;
  /**
   *Call is already approved by this signatory.
   */
  AlreadyApproved: undefined;
  /**
   *Call doesn't need any (more) approvals.
   */
  NoApprovalsNeeded: undefined;
  /**
   *There are too few signatories in the list.
   */
  TooFewSignatories: undefined;
  /**
   *There are too many signatories in the list.
   */
  TooManySignatories: undefined;
  /**
   *The signatories were provided out of order; they should be ordered.
   */
  SignatoriesOutOfOrder: undefined;
  /**
   *The sender was contained in the other signatories; it shouldn't be.
   */
  SenderInSignatories: undefined;
  /**
   *Multisig operation not found when attempting to cancel.
   */
  NotFound: undefined;
  /**
   *Only the account that originally created the multisig is able to cancel it.
   */
  NotOwner: undefined;
  /**
   *No timepoint was given, yet the multisig operation is already underway.
   */
  NoTimepoint: undefined;
  /**
   *A different timepoint was given to the multisig operation that is underway.
   */
  WrongTimepoint: undefined;
  /**
   *A timepoint was given, yet no multisig operation is underway.
   */
  UnexpectedTimepoint: undefined;
  /**
   *The maximum weight information provided was too low.
   */
  MaxWeightTooLow: undefined;
  /**
   *The data to be stored is already stored.
   */
  AlreadyStored: undefined;
}>;
export type Iuvt54ei4cehc = AnonymousEnum<{
  /**
   *There are too many proxies registered or too many announcements pending.
   */
  TooMany: undefined;
  /**
   *Proxy registration not found.
   */
  NotFound: undefined;
  /**
   *Sender is not a proxy of the account to be proxied.
   */
  NotProxy: undefined;
  /**
   *A call which is incompatible with the proxy type's filter was attempted.
   */
  Unproxyable: undefined;
  /**
   *Account is already a proxy.
   */
  Duplicate: undefined;
  /**
   *Call may not be made by proxy because it may escalate its privileges.
   */
  NoPermission: undefined;
  /**
   *Announcement, if made at all, was made too recently.
   */
  Unannounced: undefined;
  /**
   *Cannot add self as proxy.
   */
  NoSelfProxy: undefined;
}>;
export type Iapedqb0veh71 = AnonymousEnum<{
  /**
   *Account balance must be greater than or equal to the transfer amount.
   */
  BalanceLow: undefined;
  /**
   *The account to alter does not exist.
   */
  NoAccount: undefined;
  /**
   *The signing account has no permission to do the operation.
   */
  NoPermission: undefined;
  /**
   *The given asset ID is unknown.
   */
  Unknown: undefined;
  /**
   *The origin account is frozen.
   */
  Frozen: undefined;
  /**
   *The asset ID is already taken.
   */
  InUse: undefined;
  /**
   *Invalid witness data given.
   */
  BadWitness: undefined;
  /**
   *Minimum balance should be non-zero.
   */
  MinBalanceZero: undefined;
  /**
   *Unable to increment the consumer reference counters on the account. Either no provider
   *reference exists to allow a non-zero balance of a non-self-sufficient asset, or one
   *fewer then the maximum number of consumers has been reached.
   */
  UnavailableConsumer: undefined;
  /**
   *Invalid metadata given.
   */
  BadMetadata: undefined;
  /**
   *No approval exists that would allow the transfer.
   */
  Unapproved: undefined;
  /**
   *The source account would not survive the transfer and it needs to stay alive.
   */
  WouldDie: undefined;
  /**
   *The asset-account already exists.
   */
  AlreadyExists: undefined;
  /**
   *The asset-account doesn't have an associated deposit.
   */
  NoDeposit: undefined;
  /**
   *The operation would result in funds being burned.
   */
  WouldBurn: undefined;
  /**
   *The asset is a live asset and is actively being used. Usually emit for operations such
   *as `start_destroy` which require the asset to be in a destroying state.
   */
  LiveAsset: undefined;
  /**
   *The asset is not live, and likely being destroyed.
   */
  AssetNotLive: undefined;
  /**
   *The asset status is not the expected status.
   */
  IncorrectStatus: undefined;
  /**
   *The asset should be frozen before the given operation.
   */
  NotFrozen: undefined;
  /**
   *Callback action resulted in error
   */
  CallbackFailed: undefined;
  /**
   *The asset ID must be equal to the [`NextAssetId`].
   */
  BadAssetId: undefined;
}>;
export type Ienq2ge2rhv4jm = AnonymousEnum<{
  /**
   *The signing account has no permission to do the operation.
   */
  NoPermission: undefined;
  /**
   *The given item ID is unknown.
   */
  UnknownCollection: undefined;
  /**
   *The item ID has already been used for an item.
   */
  AlreadyExists: undefined;
  /**
   *The owner turned out to be different to what was expected.
   */
  WrongOwner: undefined;
  /**
   *Invalid witness data given.
   */
  BadWitness: undefined;
  /**
   *The item ID is already taken.
   */
  InUse: undefined;
  /**
   *The item or collection is frozen.
   */
  Frozen: undefined;
  /**
   *The delegate turned out to be different to what was expected.
   */
  WrongDelegate: undefined;
  /**
   *There is no delegate approved.
   */
  NoDelegate: undefined;
  /**
   *No approval exists that would allow the transfer.
   */
  Unapproved: undefined;
  /**
   *The named owner has not signed ownership of the collection is acceptable.
   */
  Unaccepted: undefined;
  /**
   *The item is locked.
   */
  Locked: undefined;
  /**
   *All items have been minted.
   */
  MaxSupplyReached: undefined;
  /**
   *The max supply has already been set.
   */
  MaxSupplyAlreadySet: undefined;
  /**
   *The provided max supply is less to the amount of items a collection already has.
   */
  MaxSupplyTooSmall: undefined;
  /**
   *The given item ID is unknown.
   */
  UnknownItem: undefined;
  /**
   *Item is not for sale.
   */
  NotForSale: undefined;
  /**
   *The provided bid is too low.
   */
  BidTooLow: undefined;
}>;
export type I58r1150kmj18u = AnonymousEnum<{
  /**
   *The signing account has no permission to do the operation.
   */
  NoPermission: undefined;
  /**
   *The given item ID is unknown.
   */
  UnknownCollection: undefined;
  /**
   *The item ID has already been used for an item.
   */
  AlreadyExists: undefined;
  /**
   *The approval had a deadline that expired, so the approval isn't valid anymore.
   */
  ApprovalExpired: undefined;
  /**
   *The owner turned out to be different to what was expected.
   */
  WrongOwner: undefined;
  /**
   *The witness data given does not match the current state of the chain.
   */
  BadWitness: undefined;
  /**
   *Collection ID is already taken.
   */
  CollectionIdInUse: undefined;
  /**
   *Items within that collection are non-transferable.
   */
  ItemsNonTransferable: undefined;
  /**
   *The provided account is not a delegate.
   */
  NotDelegate: undefined;
  /**
   *The delegate turned out to be different to what was expected.
   */
  WrongDelegate: undefined;
  /**
   *No approval exists that would allow the transfer.
   */
  Unapproved: undefined;
  /**
   *The named owner has not signed ownership acceptance of the collection.
   */
  Unaccepted: undefined;
  /**
   *The item is locked (non-transferable).
   */
  ItemLocked: undefined;
  /**
   *Item's attributes are locked.
   */
  LockedItemAttributes: undefined;
  /**
   *Collection's attributes are locked.
   */
  LockedCollectionAttributes: undefined;
  /**
   *Item's metadata is locked.
   */
  LockedItemMetadata: undefined;
  /**
   *Collection's metadata is locked.
   */
  LockedCollectionMetadata: undefined;
  /**
   *All items have been minted.
   */
  MaxSupplyReached: undefined;
  /**
   *The max supply is locked and can't be changed.
   */
  MaxSupplyLocked: undefined;
  /**
   *The provided max supply is less than the number of items a collection already has.
   */
  MaxSupplyTooSmall: undefined;
  /**
   *The given item ID is unknown.
   */
  UnknownItem: undefined;
  /**
   *Swap doesn't exist.
   */
  UnknownSwap: undefined;
  /**
   *The given item has no metadata set.
   */
  MetadataNotFound: undefined;
  /**
   *The provided attribute can't be found.
   */
  AttributeNotFound: undefined;
  /**
   *Item is not for sale.
   */
  NotForSale: undefined;
  /**
   *The provided bid is too low.
   */
  BidTooLow: undefined;
  /**
   *The item has reached its approval limit.
   */
  ReachedApprovalLimit: undefined;
  /**
   *The deadline has already expired.
   */
  DeadlineExpired: undefined;
  /**
   *The duration provided should be less than or equal to `MaxDeadlineDuration`.
   */
  WrongDuration: undefined;
  /**
   *The method is disabled by system settings.
   */
  MethodDisabled: undefined;
  /**
   *The provided setting can't be set.
   */
  WrongSetting: undefined;
  /**
   *Item's config already exists and should be equal to the provided one.
   */
  InconsistentItemConfig: undefined;
  /**
   *Config for a collection or an item can't be found.
   */
  NoConfig: undefined;
  /**
   *Some roles were not cleared.
   */
  RolesNotCleared: undefined;
  /**
   *Mint has not started yet.
   */
  MintNotStarted: undefined;
  /**
   *Mint has already ended.
   */
  MintEnded: undefined;
  /**
   *The provided Item was already used for claiming.
   */
  AlreadyClaimed: undefined;
  /**
   *The provided data is incorrect.
   */
  IncorrectData: undefined;
  /**
   *The extrinsic was sent by the wrong origin.
   */
  WrongOrigin: undefined;
  /**
   *The provided signature is incorrect.
   */
  WrongSignature: undefined;
  /**
   *The provided metadata might be too long.
   */
  IncorrectMetadata: undefined;
  /**
   *Can't set more attributes per one call.
   */
  MaxAttributesLimitReached: undefined;
  /**
   *The provided namespace isn't supported in this call.
   */
  WrongNamespace: undefined;
  /**
   *Can't delete non-empty collections.
   */
  CollectionNotEmpty: undefined;
  /**
   *The witness data should be provided.
   */
  WitnessRequired: undefined;
}>;
export type I4u78hb23uhvi2 = AnonymousEnum<{
  /**
   *Provided asset pair is not supported for pool.
   */
  InvalidAssetPair: undefined;
  /**
   *Pool already exists.
   */
  PoolExists: undefined;
  /**
   *Desired amount can't be zero.
   */
  WrongDesiredAmount: undefined;
  /**
   *Provided amount should be greater than or equal to the existential deposit/asset's
   *minimal amount.
   */
  AmountOneLessThanMinimal: undefined;
  /**
   *Provided amount should be greater than or equal to the existential deposit/asset's
   *minimal amount.
   */
  AmountTwoLessThanMinimal: undefined;
  /**
   *Reserve needs to always be greater than or equal to the existential deposit/asset's
   *minimal amount.
   */
  ReserveLeftLessThanMinimal: undefined;
  /**
   *Desired amount can't be equal to the pool reserve.
   */
  AmountOutTooHigh: undefined;
  /**
   *The pool doesn't exist.
   */
  PoolNotFound: undefined;
  /**
   *An overflow happened.
   */
  Overflow: undefined;
  /**
   *The minimal amount requirement for the first token in the pair wasn't met.
   */
  AssetOneDepositDidNotMeetMinimum: undefined;
  /**
   *The minimal amount requirement for the second token in the pair wasn't met.
   */
  AssetTwoDepositDidNotMeetMinimum: undefined;
  /**
   *The minimal amount requirement for the first token in the pair wasn't met.
   */
  AssetOneWithdrawalDidNotMeetMinimum: undefined;
  /**
   *The minimal amount requirement for the second token in the pair wasn't met.
   */
  AssetTwoWithdrawalDidNotMeetMinimum: undefined;
  /**
   *Optimal calculated amount is less than desired.
   */
  OptimalAmountLessThanDesired: undefined;
  /**
   *Insufficient liquidity minted.
   */
  InsufficientLiquidityMinted: undefined;
  /**
   *Requested liquidity can't be zero.
   */
  ZeroLiquidity: undefined;
  /**
   *Amount can't be zero.
   */
  ZeroAmount: undefined;
  /**
   *Calculated amount out is less than provided minimum amount.
   */
  ProvidedMinimumNotSufficientForSwap: undefined;
  /**
   *Provided maximum amount is not sufficient for swap.
   */
  ProvidedMaximumNotSufficientForSwap: undefined;
  /**
   *The provided path must consists of 2 assets at least.
   */
  InvalidPath: undefined;
  /**
   *The provided path must consists of unique assets.
   */
  NonUniquePath: undefined;
  /**
   *It was not possible to get or increment the Id of the pool.
   */
  IncorrectPoolAssetId: undefined;
  /**
   *The destination account cannot exist with the swapped funds.
   */
  BelowMinimum: undefined;
}>;
export type TokenError = Enum<{
  FundsUnavailable: undefined;
  OnlyProvider: undefined;
  BelowMinimum: undefined;
  CannotCreate: undefined;
  UnknownAsset: undefined;
  Frozen: undefined;
  Unsupported: undefined;
  CannotCreateHold: undefined;
  NotExpendable: undefined;
  Blocked: undefined;
}>;
export declare const TokenError: GetEnum<TokenError>;
export type ArithmeticError = Enum<{
  Underflow: undefined;
  Overflow: undefined;
  DivisionByZero: undefined;
}>;
export declare const ArithmeticError: GetEnum<ArithmeticError>;
export type TransactionalError = Enum<{
  LimitReached: undefined;
  NoLayer: undefined;
}>;
export declare const TransactionalError: GetEnum<TransactionalError>;
export type Icbccs0ug47ilf = {
  account: SS58String;
};
export type I855j4i3kr8ko1 = {
  sender: SS58String;
  hash: FixedSizeBinary<32>;
};
export type Ibgl04rn6nbfm6 = {
  code_hash: FixedSizeBinary<32>;
  check_version: boolean;
};
export type Icbsekf57miplo = AnonymousEnum<{
  /**
   *The validation function has been scheduled to apply.
   */
  ValidationFunctionStored: undefined;
  /**
   *The validation function was applied as of the contained relay chain block number.
   */
  ValidationFunctionApplied: Anonymize<Idd7hd99u0ho0n>;
  /**
   *The relay-chain aborted the upgrade process.
   */
  ValidationFunctionDiscarded: undefined;
  /**
   *Some downward messages have been received and will be processed.
   */
  DownwardMessagesReceived: Anonymize<Iafscmv8tjf0ou>;
  /**
   *Downward messages were processed using the given weight.
   */
  DownwardMessagesProcessed: Anonymize<I100l07kaehdlp>;
  /**
   *An upward message was sent to the relay chain.
   */
  UpwardMessageSent: Anonymize<I6gnbnvip5vvdi>;
}>;
export type Idd7hd99u0ho0n = {
  relay_chain_block_num: number;
};
export type Iafscmv8tjf0ou = {
  count: number;
};
export type I100l07kaehdlp = {
  weight_used: Anonymize<I4q39t5hn830vp>;
  dmq_head: FixedSizeBinary<32>;
};
export type I6gnbnvip5vvdi = {
  message_hash?: Anonymize<I4s6vifaf8k998>;
};
export type I4s6vifaf8k998 = FixedSizeBinary<32> | undefined;
export type Iao8h4hv7atnq3 = AnonymousEnum<{
  /**
   *An account was created with some free balance.
   */
  Endowed: Anonymize<Icv68aq8841478>;
  /**
   *An account was removed whose balance was non-zero but below ExistentialDeposit,
   *resulting in an outright loss.
   */
  DustLost: Anonymize<Ic262ibdoec56a>;
  /**
   *Transfer succeeded.
   */
  Transfer: Anonymize<Iflcfm9b6nlmdd>;
  /**
   *A balance was set by root.
   */
  BalanceSet: Anonymize<Ijrsf4mnp3eka>;
  /**
   *Some balance was reserved (moved from free to reserved).
   */
  Reserved: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some balance was unreserved (moved from reserved to free).
   */
  Unreserved: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some balance was moved from the reserve of the first account to the second account.
   *Final argument indicates the destination balance type.
   */
  ReserveRepatriated: Anonymize<I8tjvj9uq4b7hi>;
  /**
   *Some amount was deposited (e.g. for transaction fees).
   */
  Deposit: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some amount was withdrawn from the account (e.g. for transaction fees).
   */
  Withdraw: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some amount was removed from the account (e.g. for misbehavior).
   */
  Slashed: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some amount was minted into an account.
   */
  Minted: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some amount was burned from an account.
   */
  Burned: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some amount was suspended from an account (it can be restored later).
   */
  Suspended: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some amount was restored into an account.
   */
  Restored: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *An account was upgraded.
   */
  Upgraded: Anonymize<I4cbvqmqadhrea>;
  /**
   *Total issuance was increased by `amount`, creating a credit to be balanced.
   */
  Issued: Anonymize<I3qt1hgg4djhgb>;
  /**
   *Total issuance was decreased by `amount`, creating a debt to be balanced.
   */
  Rescinded: Anonymize<I3qt1hgg4djhgb>;
  /**
   *Some balance was locked.
   */
  Locked: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some balance was unlocked.
   */
  Unlocked: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some balance was frozen.
   */
  Frozen: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Some balance was thawed.
   */
  Thawed: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *The `TotalIssuance` was forcefully changed.
   */
  TotalIssuanceForced: Anonymize<I4fooe9dun9o0t>;
}>;
export type Icv68aq8841478 = {
  account: SS58String;
  free_balance: bigint;
};
export type Ic262ibdoec56a = {
  account: SS58String;
  amount: bigint;
};
export type Iflcfm9b6nlmdd = {
  from: SS58String;
  to: SS58String;
  amount: bigint;
};
export type Ijrsf4mnp3eka = {
  who: SS58String;
  free: bigint;
};
export type Id5fm4p8lj5qgi = {
  who: SS58String;
  amount: bigint;
};
export type I8tjvj9uq4b7hi = {
  from: SS58String;
  to: SS58String;
  amount: bigint;
  destination_status: BalanceStatus;
};
export type BalanceStatus = Enum<{
  Free: undefined;
  Reserved: undefined;
}>;
export declare const BalanceStatus: GetEnum<BalanceStatus>;
export type I4cbvqmqadhrea = {
  who: SS58String;
};
export type I3qt1hgg4djhgb = {
  amount: bigint;
};
export type I4fooe9dun9o0t = {
  old: bigint;
  new: bigint;
};
export type TransactionPaymentEvent = Enum<{
  /**
   *A transaction fee `actual_fee`, of which `tip` was added to the minimum inclusion fee,
   *has been paid by `who`.
   */
  TransactionFeePaid: Anonymize<Ier2cke86dqbr2>;
}>;
export declare const TransactionPaymentEvent: GetEnum<TransactionPaymentEvent>;
export type Ier2cke86dqbr2 = {
  who: SS58String;
  actual_fee: bigint;
  tip: bigint;
};
export type Ifagg2q2o5fgjl = AnonymousEnum<{
  /**
   *A transaction fee `actual_fee`, of which `tip` was added to the minimum inclusion fee,
   *has been paid by `who` in an asset `asset_id`.
   */
  AssetTxFeePaid: Anonymize<Iqjk6s1a2lmkt>;
  /**
   *A swap of the refund in native currency back to asset failed.
   */
  AssetRefundFailed: Anonymize<Icjchvrijclvlv>;
}>;
export type Iqjk6s1a2lmkt = {
  who: SS58String;
  actual_fee: bigint;
  tip: bigint;
  asset_id: Anonymize<I4c0s5cioidn76>;
};
export type I4c0s5cioidn76 = {
  parents: number;
  interior: XcmV3Junctions;
};
export type XcmV3Junctions = Enum<{
  Here: undefined;
  X1: XcmV3Junction;
  X2: Anonymize<Iam58b36i8f27i>;
  X3: Anonymize<Iegjh9cie771d8>;
  X4: Anonymize<Iae5flu84s2oia>;
  X5: Anonymize<Iejq8c4n82a165>;
  X6: Anonymize<I7rmt803vbpqrl>;
  X7: Anonymize<I7onfe2toh27f0>;
  X8: Anonymize<I3vjadpg0k2omo>;
}>;
export declare const XcmV3Junctions: GetEnum<XcmV3Junctions>;
export type XcmV3Junction = Enum<{
  Parachain: number;
  AccountId32: Anonymize<Ifq0i8kc6ds30i>;
  AccountIndex64: Anonymize<I2a3org9qntfkr>;
  AccountKey20: Anonymize<I9ed2klpttaegt>;
  PalletInstance: number;
  GeneralIndex: bigint;
  GeneralKey: Anonymize<I15lht6t53odo4>;
  OnlyChild: undefined;
  Plurality: Anonymize<I518fbtnclg1oc>;
  GlobalConsensus: XcmV3JunctionNetworkId;
}>;
export declare const XcmV3Junction: GetEnum<XcmV3Junction>;
export type Ifq0i8kc6ds30i = {
  network?: Anonymize<Idcq3vns9tgp5p>;
  id: FixedSizeBinary<32>;
};
export type Idcq3vns9tgp5p = XcmV3JunctionNetworkId | undefined;
export type XcmV3JunctionNetworkId = Enum<{
  ByGenesis: FixedSizeBinary<32>;
  ByFork: Anonymize<I15vf5oinmcgps>;
  Polkadot: undefined;
  Kusama: undefined;
  Westend: undefined;
  Rococo: undefined;
  Wococo: undefined;
  Ethereum: Anonymize<I623eo8t3jrbeo>;
  BitcoinCore: undefined;
  BitcoinCash: undefined;
  PolkadotBulletin: undefined;
}>;
export declare const XcmV3JunctionNetworkId: GetEnum<XcmV3JunctionNetworkId>;
export type I15vf5oinmcgps = {
  block_number: bigint;
  block_hash: FixedSizeBinary<32>;
};
export type I623eo8t3jrbeo = {
  chain_id: bigint;
};
export type I2a3org9qntfkr = {
  network?: Anonymize<Idcq3vns9tgp5p>;
  index: bigint;
};
export type I9ed2klpttaegt = {
  network?: Anonymize<Idcq3vns9tgp5p>;
  key: FixedSizeBinary<20>;
};
export type I15lht6t53odo4 = {
  length: number;
  data: FixedSizeBinary<32>;
};
export type I518fbtnclg1oc = {
  id: XcmV3JunctionBodyId;
  part: XcmV2JunctionBodyPart;
};
export type XcmV3JunctionBodyId = Enum<{
  Unit: undefined;
  Moniker: FixedSizeBinary<4>;
  Index: number;
  Executive: undefined;
  Technical: undefined;
  Legislative: undefined;
  Judicial: undefined;
  Defense: undefined;
  Administration: undefined;
  Treasury: undefined;
}>;
export declare const XcmV3JunctionBodyId: GetEnum<XcmV3JunctionBodyId>;
export type XcmV2JunctionBodyPart = Enum<{
  Voice: undefined;
  Members: Anonymize<Iafscmv8tjf0ou>;
  Fraction: Anonymize<Idif02efq16j92>;
  AtLeastProportion: Anonymize<Idif02efq16j92>;
  MoreThanProportion: Anonymize<Idif02efq16j92>;
}>;
export declare const XcmV2JunctionBodyPart: GetEnum<XcmV2JunctionBodyPart>;
export type Idif02efq16j92 = {
  nom: number;
  denom: number;
};
export type Iam58b36i8f27i = FixedSizeArray<2, XcmV3Junction>;
export type Iegjh9cie771d8 = FixedSizeArray<3, XcmV3Junction>;
export type Iae5flu84s2oia = FixedSizeArray<4, XcmV3Junction>;
export type Iejq8c4n82a165 = FixedSizeArray<5, XcmV3Junction>;
export type I7rmt803vbpqrl = FixedSizeArray<6, XcmV3Junction>;
export type I7onfe2toh27f0 = FixedSizeArray<7, XcmV3Junction>;
export type I3vjadpg0k2omo = FixedSizeArray<8, XcmV3Junction>;
export type Icjchvrijclvlv = {
  native_amount_kept: bigint;
};
export type VestingEvent = Enum<{
  /**
   *The amount vested has been updated. This could indicate a change in funds available.
   *The balance given is the amount which is left unvested (and thus locked).
   */
  VestingUpdated: Anonymize<Ievr89968437gm>;
  /**
   *An \[account\] has become fully vested.
   */
  VestingCompleted: Anonymize<Icbccs0ug47ilf>;
}>;
export declare const VestingEvent: GetEnum<VestingEvent>;
export type Ievr89968437gm = {
  account: SS58String;
  unvested: bigint;
};
export type I4srakrmf0fspo = AnonymousEnum<{
  /**
   *New Invulnerables were set.
   */
  NewInvulnerables: Anonymize<I39t01nnod9109>;
  /**
   *A new Invulnerable was added.
   */
  InvulnerableAdded: Anonymize<I6v8sm60vvkmk7>;
  /**
   *An Invulnerable was removed.
   */
  InvulnerableRemoved: Anonymize<I6v8sm60vvkmk7>;
  /**
   *The number of desired candidates was set.
   */
  NewDesiredCandidates: Anonymize<I1qmtmbe5so8r3>;
  /**
   *The candidacy bond was set.
   */
  NewCandidacyBond: Anonymize<Ih99m6ehpcar7>;
  /**
   *A new candidate joined.
   */
  CandidateAdded: Anonymize<Idgorhsbgdq2ap>;
  /**
   *Bond of a candidate updated.
   */
  CandidateBondUpdated: Anonymize<Idgorhsbgdq2ap>;
  /**
   *A candidate was removed.
   */
  CandidateRemoved: Anonymize<I6v8sm60vvkmk7>;
  /**
   *An account was replaced in the candidate list by another one.
   */
  CandidateReplaced: Anonymize<I9ubb2kqevnu6t>;
  /**
   *An account was unable to be added to the Invulnerables because they did not have keys
   *registered. Other Invulnerables may have been set.
   */
  InvalidInvulnerableSkipped: Anonymize<I6v8sm60vvkmk7>;
}>;
export type I39t01nnod9109 = {
  invulnerables: Anonymize<Ia2lhg7l2hilo3>;
};
export type Ia2lhg7l2hilo3 = Array<SS58String>;
export type I6v8sm60vvkmk7 = {
  account_id: SS58String;
};
export type I1qmtmbe5so8r3 = {
  desired_candidates: number;
};
export type Ih99m6ehpcar7 = {
  bond_amount: bigint;
};
export type Idgorhsbgdq2ap = {
  account_id: SS58String;
  deposit: bigint;
};
export type I9ubb2kqevnu6t = {
  old: SS58String;
  new: SS58String;
  deposit: bigint;
};
export type SessionEvent = Enum<{
  /**
   *New session has happened. Note that the argument is the session index, not the
   *block number as the type might suggest.
   */
  NewSession: Anonymize<I2hq50pu2kdjpo>;
}>;
export declare const SessionEvent: GetEnum<SessionEvent>;
export type I2hq50pu2kdjpo = {
  session_index: number;
};
export type Idsqc7mhp6nnle = AnonymousEnum<{
  /**
   *An HRMP message was sent to a sibling parachain.
   */
  XcmpMessageSent: Anonymize<I137t1cld92pod>;
}>;
export type I137t1cld92pod = {
  message_hash: FixedSizeBinary<32>;
};
export type I5ce1ru810vv9d = AnonymousEnum<{
  /**
   *Execution of an XCM message was attempted.
   */
  Attempted: Anonymize<I2aatv5i0cb96a>;
  /**
   *A XCM message was sent.
   */
  Sent: Anonymize<Ib9msr5sr8t3dn>;
  /**
   *Query response received which does not match a registered query. This may be because a
   *matching query was never registered, it may be because it is a duplicate response, or
   *because the query timed out.
   */
  UnexpectedResponse: Anonymize<I3le5tr7ugg6l2>;
  /**
   *Query response has been received and is ready for taking with `take_response`. There is
   *no registered notification call.
   */
  ResponseReady: Anonymize<I3iun9sig164po>;
  /**
   *Query response has been received and query is removed. The registered notification has
   *been dispatched and executed successfully.
   */
  Notified: Anonymize<I2uqmls7kcdnii>;
  /**
   *Query response has been received and query is removed. The registered notification
   *could not be dispatched because the dispatch weight is greater than the maximum weight
   *originally budgeted by this runtime for the query result.
   */
  NotifyOverweight: Anonymize<Idg69klialbkb8>;
  /**
   *Query response has been received and query is removed. There was a general error with
   *dispatching the notification call.
   */
  NotifyDispatchError: Anonymize<I2uqmls7kcdnii>;
  /**
   *Query response has been received and query is removed. The dispatch was unable to be
   *decoded into a `Call`; this might be due to dispatch function having a signature which
   *is not `(origin, QueryId, Response)`.
   */
  NotifyDecodeFailed: Anonymize<I2uqmls7kcdnii>;
  /**
   *Expected query response has been received but the origin location of the response does
   *not match that expected. The query remains registered for a later, valid, response to
   *be received and acted upon.
   */
  InvalidResponder: Anonymize<I13jboebjcbglr>;
  /**
   *Expected query response has been received but the expected origin location placed in
   *storage by this runtime previously cannot be decoded. The query remains registered.
   *
   *This is unexpected (since a location placed in storage in a previously executing
   *runtime should be readable prior to query timeout) and dangerous since the possibly
   *valid response will be dropped. Manual governance intervention is probably going to be
   *needed.
   */
  InvalidResponderVersion: Anonymize<I3le5tr7ugg6l2>;
  /**
   *Received query response has been read and removed.
   */
  ResponseTaken: Anonymize<I30pg328m00nr3>;
  /**
   *Some assets have been placed in an asset trap.
   */
  AssetsTrapped: Anonymize<I381dkhrurdhrs>;
  /**
   *An XCM version change notification message has been attempted to be sent.
   *
   *The cost of sending it (borne by the chain) is included.
   */
  VersionChangeNotified: Anonymize<Ic8hi3qr11vngc>;
  /**
   *The supported version of a location has been changed. This might be through an
   *automatic notification or a manual intervention.
   */
  SupportedVersionChanged: Anonymize<Iabk8ljl5g8c86>;
  /**
   *A given location which had a version change subscription was dropped owing to an error
   *sending the notification to it.
   */
  NotifyTargetSendFail: Anonymize<Ibjdlecumfu7q7>;
  /**
   *A given location which had a version change subscription was dropped owing to an error
   *migrating the location to our new XCM format.
   */
  NotifyTargetMigrationFail: Anonymize<Ia9ems1kg7laoc>;
  /**
   *Expected query response has been received but the expected querier location placed in
   *storage by this runtime previously cannot be decoded. The query remains registered.
   *
   *This is unexpected (since a location placed in storage in a previously executing
   *runtime should be readable prior to query timeout) and dangerous since the possibly
   *valid response will be dropped. Manual governance intervention is probably going to be
   *needed.
   */
  InvalidQuerierVersion: Anonymize<I3le5tr7ugg6l2>;
  /**
   *Expected query response has been received but the querier location of the response does
   *not match the expected. The query remains registered for a later, valid, response to
   *be received and acted upon.
   */
  InvalidQuerier: Anonymize<I92fq0fa45vi3>;
  /**
   *A remote has requested XCM version change notification from us and we have honored it.
   *A version information message is sent to them and its cost is included.
   */
  VersionNotifyStarted: Anonymize<Id01dpp0dn2cj0>;
  /**
   *We have requested that a remote chain send us XCM version change notifications.
   */
  VersionNotifyRequested: Anonymize<Id01dpp0dn2cj0>;
  /**
   *We have requested that a remote chain stops sending us XCM version change
   *notifications.
   */
  VersionNotifyUnrequested: Anonymize<Id01dpp0dn2cj0>;
  /**
   *Fees were paid from a location for an operation (often for using `SendXcm`).
   */
  FeesPaid: Anonymize<I6nu8k62ck9o8o>;
  /**
   *Some assets have been claimed from an asset trap
   */
  AssetsClaimed: Anonymize<I381dkhrurdhrs>;
  /**
   *A XCM version migration finished.
   */
  VersionMigrationFinished: Anonymize<I6s1nbislhk619>;
}>;
export type I2aatv5i0cb96a = {
  outcome: XcmV4TraitsOutcome;
};
export type XcmV4TraitsOutcome = Enum<{
  Complete: Anonymize<I30iff2d192eu7>;
  Incomplete: Anonymize<I3q41clmllcihh>;
  Error: Anonymize<I1n56hooghntl2>;
}>;
export declare const XcmV4TraitsOutcome: GetEnum<XcmV4TraitsOutcome>;
export type I30iff2d192eu7 = {
  used: Anonymize<I4q39t5hn830vp>;
};
export type I3q41clmllcihh = {
  used: Anonymize<I4q39t5hn830vp>;
  error: XcmV3TraitsError;
};
export type XcmV3TraitsError = Enum<{
  Overflow: undefined;
  Unimplemented: undefined;
  UntrustedReserveLocation: undefined;
  UntrustedTeleportLocation: undefined;
  LocationFull: undefined;
  LocationNotInvertible: undefined;
  BadOrigin: undefined;
  InvalidLocation: undefined;
  AssetNotFound: undefined;
  FailedToTransactAsset: undefined;
  NotWithdrawable: undefined;
  LocationCannotHold: undefined;
  ExceedsMaxMessageSize: undefined;
  DestinationUnsupported: undefined;
  Transport: undefined;
  Unroutable: undefined;
  UnknownClaim: undefined;
  FailedToDecode: undefined;
  MaxWeightInvalid: undefined;
  NotHoldingFees: undefined;
  TooExpensive: undefined;
  Trap: bigint;
  ExpectationFalse: undefined;
  PalletNotFound: undefined;
  NameMismatch: undefined;
  VersionIncompatible: undefined;
  HoldingWouldOverflow: undefined;
  ExportError: undefined;
  ReanchorFailed: undefined;
  NoDeal: undefined;
  FeesNotMet: undefined;
  LockError: undefined;
  NoPermission: undefined;
  Unanchored: undefined;
  NotDepositable: undefined;
  UnhandledXcmVersion: undefined;
  WeightLimitReached: Anonymize<I4q39t5hn830vp>;
  Barrier: undefined;
  WeightNotComputable: undefined;
  ExceedsStackLimit: undefined;
}>;
export declare const XcmV3TraitsError: GetEnum<XcmV3TraitsError>;
export type I1n56hooghntl2 = {
  error: XcmV3TraitsError;
};
export type Ib9msr5sr8t3dn = {
  origin: Anonymize<I4c0s5cioidn76>;
  destination: Anonymize<I4c0s5cioidn76>;
  message: Anonymize<Iegrepoo0c1jc5>;
  message_id: FixedSizeBinary<32>;
};
export type Iegrepoo0c1jc5 = Array<XcmV4Instruction>;
export type XcmV4Instruction = Enum<{
  WithdrawAsset: Anonymize<I50mli3hb64f9b>;
  ReserveAssetDeposited: Anonymize<I50mli3hb64f9b>;
  ReceiveTeleportedAsset: Anonymize<I50mli3hb64f9b>;
  QueryResponse: Anonymize<I9o9uda3nddbna>;
  TransferAsset: Anonymize<I7s0ar727m8n1j>;
  TransferReserveAsset: Anonymize<I5bepfv83t9cg7>;
  Transact: Anonymize<I92p6l5cs3fr50>;
  HrmpNewChannelOpenRequest: Anonymize<I5uhhrjqfuo4e5>;
  HrmpChannelAccepted: Anonymize<Ifij4jam0o7sub>;
  HrmpChannelClosing: Anonymize<Ieeb4svd9i8fji>;
  ClearOrigin: undefined;
  DescendOrigin: XcmV3Junctions;
  ReportError: Anonymize<I4r3v6e91d1qbs>;
  DepositAsset: Anonymize<Idbqvv6kvph2qq>;
  DepositReserveAsset: Anonymize<I6epv2jfejmsps>;
  ExchangeAsset: Anonymize<Ifunmnuvdqirrm>;
  InitiateReserveWithdraw: Anonymize<Id1994sd13a1fk>;
  InitiateTeleport: Anonymize<I6epv2jfejmsps>;
  ReportHolding: Anonymize<I53nvbjei7ovcg>;
  BuyExecution: Anonymize<I60dnk6pb13k6r>;
  RefundSurplus: undefined;
  SetErrorHandler: Anonymize<Iegrepoo0c1jc5>;
  SetAppendix: Anonymize<Iegrepoo0c1jc5>;
  ClearError: undefined;
  ClaimAsset: Anonymize<I39e2979fh1sq0>;
  Trap: bigint;
  SubscribeVersion: Anonymize<Ieprdqqu7ildvr>;
  UnsubscribeVersion: undefined;
  BurnAsset: Anonymize<I50mli3hb64f9b>;
  ExpectAsset: Anonymize<I50mli3hb64f9b>;
  ExpectOrigin?: Anonymize<Ia9cgf4r40b26h>;
  ExpectError?: Anonymize<I7sltvf8v2nure>;
  ExpectTransactStatus: XcmV3MaybeErrorCode;
  QueryPallet: Anonymize<Iba5bdbapp16oo>;
  ExpectPallet: Anonymize<Id7mf37dkpgfjs>;
  ReportTransactStatus: Anonymize<I4r3v6e91d1qbs>;
  ClearTransactStatus: undefined;
  UniversalOrigin: XcmV3Junction;
  ExportMessage: Anonymize<Idjv4c30koq53t>;
  LockAsset: Anonymize<Ic2kq28flu5j2f>;
  UnlockAsset: Anonymize<I63d4j1l5gkla3>;
  NoteUnlockable: Anonymize<Ibs79g4hs4qcqq>;
  RequestUnlock: Anonymize<Ifv72gq013neli>;
  SetFeesMode: Anonymize<I4nae9rsql8fa7>;
  SetTopic: FixedSizeBinary<32>;
  ClearTopic: undefined;
  AliasOrigin: Anonymize<I4c0s5cioidn76>;
  UnpaidExecution: Anonymize<I40d50jeai33oq>;
}>;
export declare const XcmV4Instruction: GetEnum<XcmV4Instruction>;
export type I50mli3hb64f9b = Array<Anonymize<Ia5l7mu5a6v49o>>;
export type Ia5l7mu5a6v49o = {
  id: Anonymize<I4c0s5cioidn76>;
  fun: XcmV3MultiassetFungibility;
};
export type XcmV3MultiassetFungibility = Enum<{
  Fungible: bigint;
  NonFungible: XcmV3MultiassetAssetInstance;
}>;
export declare const XcmV3MultiassetFungibility: GetEnum<XcmV3MultiassetFungibility>;
export type XcmV3MultiassetAssetInstance = Enum<{
  Undefined: undefined;
  Index: bigint;
  Array4: FixedSizeBinary<4>;
  Array8: FixedSizeBinary<8>;
  Array16: FixedSizeBinary<16>;
  Array32: FixedSizeBinary<32>;
}>;
export declare const XcmV3MultiassetAssetInstance: GetEnum<XcmV3MultiassetAssetInstance>;
export type I9o9uda3nddbna = {
  query_id: bigint;
  response: XcmV4Response;
  max_weight: Anonymize<I4q39t5hn830vp>;
  querier?: Anonymize<Ia9cgf4r40b26h>;
};
export type XcmV4Response = Enum<{
  Null: undefined;
  Assets: Anonymize<I50mli3hb64f9b>;
  ExecutionResult?: Anonymize<I7sltvf8v2nure>;
  Version: number;
  PalletsInfo: Anonymize<I599u7h20b52at>;
  DispatchResult: XcmV3MaybeErrorCode;
}>;
export declare const XcmV4Response: GetEnum<XcmV4Response>;
export type I7sltvf8v2nure = Anonymize<Id8ide743umavp> | undefined;
export type Id8ide743umavp = [number, XcmV3TraitsError];
export type I599u7h20b52at = Array<Anonymize<Ift5r9b1bvoh16>>;
export type Ift5r9b1bvoh16 = {
  index: number;
  name: Binary;
  module_name: Binary;
  major: number;
  minor: number;
  patch: number;
};
export type XcmV3MaybeErrorCode = Enum<{
  Success: undefined;
  Error: Binary;
  TruncatedError: Binary;
}>;
export declare const XcmV3MaybeErrorCode: GetEnum<XcmV3MaybeErrorCode>;
export type Ia9cgf4r40b26h = Anonymize<I4c0s5cioidn76> | undefined;
export type I7s0ar727m8n1j = {
  assets: Anonymize<I50mli3hb64f9b>;
  beneficiary: Anonymize<I4c0s5cioidn76>;
};
export type I5bepfv83t9cg7 = {
  assets: Anonymize<I50mli3hb64f9b>;
  dest: Anonymize<I4c0s5cioidn76>;
  xcm: Anonymize<Iegrepoo0c1jc5>;
};
export type I92p6l5cs3fr50 = {
  origin_kind: XcmV2OriginKind;
  require_weight_at_most: Anonymize<I4q39t5hn830vp>;
  call: Binary;
};
export type XcmV2OriginKind = Enum<{
  Native: undefined;
  SovereignAccount: undefined;
  Superuser: undefined;
  Xcm: undefined;
}>;
export declare const XcmV2OriginKind: GetEnum<XcmV2OriginKind>;
export type I5uhhrjqfuo4e5 = {
  sender: number;
  max_message_size: number;
  max_capacity: number;
};
export type Ifij4jam0o7sub = {
  recipient: number;
};
export type Ieeb4svd9i8fji = {
  initiator: number;
  sender: number;
  recipient: number;
};
export type I4r3v6e91d1qbs = {
  destination: Anonymize<I4c0s5cioidn76>;
  query_id: bigint;
  max_weight: Anonymize<I4q39t5hn830vp>;
};
export type Idbqvv6kvph2qq = {
  assets: XcmV4AssetAssetFilter;
  beneficiary: Anonymize<I4c0s5cioidn76>;
};
export type XcmV4AssetAssetFilter = Enum<{
  Definite: Anonymize<I50mli3hb64f9b>;
  Wild: XcmV4AssetWildAsset;
}>;
export declare const XcmV4AssetAssetFilter: GetEnum<XcmV4AssetAssetFilter>;
export type XcmV4AssetWildAsset = Enum<{
  All: undefined;
  AllOf: Anonymize<I9k109i13ivgac>;
  AllCounted: number;
  AllOfCounted: Anonymize<Iano6fp1hcf6vu>;
}>;
export declare const XcmV4AssetWildAsset: GetEnum<XcmV4AssetWildAsset>;
export type I9k109i13ivgac = {
  id: Anonymize<I4c0s5cioidn76>;
  fun: XcmV2MultiassetWildFungibility;
};
export type XcmV2MultiassetWildFungibility = Enum<{
  Fungible: undefined;
  NonFungible: undefined;
}>;
export declare const XcmV2MultiassetWildFungibility: GetEnum<XcmV2MultiassetWildFungibility>;
export type Iano6fp1hcf6vu = {
  id: Anonymize<I4c0s5cioidn76>;
  fun: XcmV2MultiassetWildFungibility;
  count: number;
};
export type I6epv2jfejmsps = {
  assets: XcmV4AssetAssetFilter;
  dest: Anonymize<I4c0s5cioidn76>;
  xcm: Anonymize<Iegrepoo0c1jc5>;
};
export type Ifunmnuvdqirrm = {
  give: XcmV4AssetAssetFilter;
  want: Anonymize<I50mli3hb64f9b>;
  maximal: boolean;
};
export type Id1994sd13a1fk = {
  assets: XcmV4AssetAssetFilter;
  reserve: Anonymize<I4c0s5cioidn76>;
  xcm: Anonymize<Iegrepoo0c1jc5>;
};
export type I53nvbjei7ovcg = {
  response_info: Anonymize<I4r3v6e91d1qbs>;
  assets: XcmV4AssetAssetFilter;
};
export type I60dnk6pb13k6r = {
  fees: Anonymize<Ia5l7mu5a6v49o>;
  weight_limit: XcmV3WeightLimit;
};
export type XcmV3WeightLimit = Enum<{
  Unlimited: undefined;
  Limited: Anonymize<I4q39t5hn830vp>;
}>;
export declare const XcmV3WeightLimit: GetEnum<XcmV3WeightLimit>;
export type I39e2979fh1sq0 = {
  assets: Anonymize<I50mli3hb64f9b>;
  ticket: Anonymize<I4c0s5cioidn76>;
};
export type Ieprdqqu7ildvr = {
  query_id: bigint;
  max_response_weight: Anonymize<I4q39t5hn830vp>;
};
export type Iba5bdbapp16oo = {
  module_name: Binary;
  response_info: Anonymize<I4r3v6e91d1qbs>;
};
export type Id7mf37dkpgfjs = {
  index: number;
  name: Binary;
  module_name: Binary;
  crate_major: number;
  min_crate_minor: number;
};
export type Idjv4c30koq53t = {
  network: XcmV3JunctionNetworkId;
  destination: XcmV3Junctions;
  xcm: Anonymize<Iegrepoo0c1jc5>;
};
export type Ic2kq28flu5j2f = {
  asset: Anonymize<Ia5l7mu5a6v49o>;
  unlocker: Anonymize<I4c0s5cioidn76>;
};
export type I63d4j1l5gkla3 = {
  asset: Anonymize<Ia5l7mu5a6v49o>;
  target: Anonymize<I4c0s5cioidn76>;
};
export type Ibs79g4hs4qcqq = {
  asset: Anonymize<Ia5l7mu5a6v49o>;
  owner: Anonymize<I4c0s5cioidn76>;
};
export type Ifv72gq013neli = {
  asset: Anonymize<Ia5l7mu5a6v49o>;
  locker: Anonymize<I4c0s5cioidn76>;
};
export type I4nae9rsql8fa7 = {
  jit_withdraw: boolean;
};
export type I40d50jeai33oq = {
  weight_limit: XcmV3WeightLimit;
  check_origin?: Anonymize<Ia9cgf4r40b26h>;
};
export type I3le5tr7ugg6l2 = {
  origin: Anonymize<I4c0s5cioidn76>;
  query_id: bigint;
};
export type I3iun9sig164po = {
  query_id: bigint;
  response: XcmV4Response;
};
export type I2uqmls7kcdnii = {
  query_id: bigint;
  pallet_index: number;
  call_index: number;
};
export type Idg69klialbkb8 = {
  query_id: bigint;
  pallet_index: number;
  call_index: number;
  actual_weight: Anonymize<I4q39t5hn830vp>;
  max_budgeted_weight: Anonymize<I4q39t5hn830vp>;
};
export type I13jboebjcbglr = {
  origin: Anonymize<I4c0s5cioidn76>;
  query_id: bigint;
  expected_location?: Anonymize<Ia9cgf4r40b26h>;
};
export type I30pg328m00nr3 = {
  query_id: bigint;
};
export type I381dkhrurdhrs = {
  hash: FixedSizeBinary<32>;
  origin: Anonymize<I4c0s5cioidn76>;
  assets: XcmVersionedAssets;
};
export type XcmVersionedAssets = Enum<{
  V2: Anonymize<I2sllmucln1iic>;
  V3: Anonymize<Iai6dhqiq3bach>;
  V4: Anonymize<I50mli3hb64f9b>;
}>;
export declare const XcmVersionedAssets: GetEnum<XcmVersionedAssets>;
export type I2sllmucln1iic = Array<Anonymize<Id8h647t880l31>>;
export type Id8h647t880l31 = {
  id: XcmV2MultiassetAssetId;
  fun: XcmV2MultiassetFungibility;
};
export type XcmV2MultiassetAssetId = Enum<{
  Concrete: Anonymize<I4frqunb5hj2km>;
  Abstract: Binary;
}>;
export declare const XcmV2MultiassetAssetId: GetEnum<XcmV2MultiassetAssetId>;
export type I4frqunb5hj2km = {
  parents: number;
  interior: XcmV2MultilocationJunctions;
};
export type XcmV2MultilocationJunctions = Enum<{
  Here: undefined;
  X1: XcmV2Junction;
  X2: Anonymize<I7tthuukjoks45>;
  X3: Anonymize<Icpsqle8f7ccnh>;
  X4: Anonymize<Ifaduechfcq41r>;
  X5: Anonymize<Ifg30nsfqato4g>;
  X6: Anonymize<I8s2vh6qelslgu>;
  X7: Anonymize<I7r6q3396okion>;
  X8: Anonymize<I1d4fie0b78rtc>;
}>;
export declare const XcmV2MultilocationJunctions: GetEnum<XcmV2MultilocationJunctions>;
export type XcmV2Junction = Enum<{
  Parachain: number;
  AccountId32: Anonymize<I6h60jropk90ne>;
  AccountIndex64: Anonymize<I73mah5ooc6vk>;
  AccountKey20: Anonymize<I9kkjqh79doku3>;
  PalletInstance: number;
  GeneralIndex: bigint;
  GeneralKey: Binary;
  OnlyChild: undefined;
  Plurality: Anonymize<Iaqhvfsgakjhdq>;
}>;
export declare const XcmV2Junction: GetEnum<XcmV2Junction>;
export type I6h60jropk90ne = {
  network: XcmV2NetworkId;
  id: FixedSizeBinary<32>;
};
export type XcmV2NetworkId = Enum<{
  Any: undefined;
  Named: Binary;
  Polkadot: undefined;
  Kusama: undefined;
}>;
export declare const XcmV2NetworkId: GetEnum<XcmV2NetworkId>;
export type I73mah5ooc6vk = {
  network: XcmV2NetworkId;
  index: bigint;
};
export type I9kkjqh79doku3 = {
  network: XcmV2NetworkId;
  key: FixedSizeBinary<20>;
};
export type Iaqhvfsgakjhdq = {
  id: XcmV2BodyId;
  part: XcmV2JunctionBodyPart;
};
export type XcmV2BodyId = Enum<{
  Unit: undefined;
  Named: Binary;
  Index: number;
  Executive: undefined;
  Technical: undefined;
  Legislative: undefined;
  Judicial: undefined;
  Defense: undefined;
  Administration: undefined;
  Treasury: undefined;
}>;
export declare const XcmV2BodyId: GetEnum<XcmV2BodyId>;
export type I7tthuukjoks45 = FixedSizeArray<2, XcmV2Junction>;
export type Icpsqle8f7ccnh = FixedSizeArray<3, XcmV2Junction>;
export type Ifaduechfcq41r = FixedSizeArray<4, XcmV2Junction>;
export type Ifg30nsfqato4g = FixedSizeArray<5, XcmV2Junction>;
export type I8s2vh6qelslgu = FixedSizeArray<6, XcmV2Junction>;
export type I7r6q3396okion = FixedSizeArray<7, XcmV2Junction>;
export type I1d4fie0b78rtc = FixedSizeArray<8, XcmV2Junction>;
export type XcmV2MultiassetFungibility = Enum<{
  Fungible: bigint;
  NonFungible: XcmV2MultiassetAssetInstance;
}>;
export declare const XcmV2MultiassetFungibility: GetEnum<XcmV2MultiassetFungibility>;
export type XcmV2MultiassetAssetInstance = Enum<{
  Undefined: undefined;
  Index: bigint;
  Array4: FixedSizeBinary<4>;
  Array8: FixedSizeBinary<8>;
  Array16: FixedSizeBinary<16>;
  Array32: FixedSizeBinary<32>;
  Blob: Binary;
}>;
export declare const XcmV2MultiassetAssetInstance: GetEnum<XcmV2MultiassetAssetInstance>;
export type Iai6dhqiq3bach = Array<Anonymize<Idcm24504c8bkk>>;
export type Idcm24504c8bkk = {
  id: XcmV3MultiassetAssetId;
  fun: XcmV3MultiassetFungibility;
};
export type XcmV3MultiassetAssetId = Enum<{
  Concrete: Anonymize<I4c0s5cioidn76>;
  Abstract: FixedSizeBinary<32>;
}>;
export declare const XcmV3MultiassetAssetId: GetEnum<XcmV3MultiassetAssetId>;
export type Ic8hi3qr11vngc = {
  destination: Anonymize<I4c0s5cioidn76>;
  result: number;
  cost: Anonymize<I50mli3hb64f9b>;
  message_id: FixedSizeBinary<32>;
};
export type Iabk8ljl5g8c86 = {
  location: Anonymize<I4c0s5cioidn76>;
  version: number;
};
export type Ibjdlecumfu7q7 = {
  location: Anonymize<I4c0s5cioidn76>;
  query_id: bigint;
  error: XcmV3TraitsError;
};
export type Ia9ems1kg7laoc = {
  location: XcmVersionedLocation;
  query_id: bigint;
};
export type XcmVersionedLocation = Enum<{
  V2: Anonymize<I4frqunb5hj2km>;
  V3: Anonymize<I4c0s5cioidn76>;
  V4: Anonymize<I4c0s5cioidn76>;
}>;
export declare const XcmVersionedLocation: GetEnum<XcmVersionedLocation>;
export type I92fq0fa45vi3 = {
  origin: Anonymize<I4c0s5cioidn76>;
  query_id: bigint;
  expected_querier: Anonymize<I4c0s5cioidn76>;
  maybe_actual_querier?: Anonymize<Ia9cgf4r40b26h>;
};
export type Id01dpp0dn2cj0 = {
  destination: Anonymize<I4c0s5cioidn76>;
  cost: Anonymize<I50mli3hb64f9b>;
  message_id: FixedSizeBinary<32>;
};
export type I6nu8k62ck9o8o = {
  paying: Anonymize<I4c0s5cioidn76>;
  fees: Anonymize<I50mli3hb64f9b>;
};
export type I6s1nbislhk619 = {
  version: number;
};
export type Ibvp9t1gqae5ct = AnonymousEnum<{
  /**
   *Downward message is invalid XCM.
   *\[ id \]
   */
  InvalidFormat: FixedSizeBinary<32>;
  /**
   *Downward message is unsupported version of XCM.
   *\[ id \]
   */
  UnsupportedVersion: FixedSizeBinary<32>;
  /**
   *Downward message executed with the given outcome.
   *\[ id, outcome \]
   */
  ExecutedDownward: Anonymize<Iea25i7vqm7ot3>;
}>;
export type Iea25i7vqm7ot3 = [FixedSizeBinary<32>, XcmV4TraitsOutcome];
export type I2kosejppk3jon = AnonymousEnum<{
  /**
   *Message discarded due to an error in the `MessageProcessor` (usually a format error).
   */
  ProcessingFailed: Anonymize<I1rvj4ubaplho0>;
  /**
   *Message is processed.
   */
  Processed: Anonymize<Ia3uu7lqcc1q1i>;
  /**
   *Message placed in overweight queue.
   */
  OverweightEnqueued: Anonymize<I7crucfnonitkn>;
  /**
   *This page was reaped.
   */
  PageReaped: Anonymize<I7tmrp94r9sq4n>;
}>;
export type I1rvj4ubaplho0 = {
  /**
   *The `blake2_256` hash of the message.
   */
  id: FixedSizeBinary<32>;
  /**
   *The queue of the message.
   */
  origin: Anonymize<Iejeo53sea6n4q>;
  /**
   *The error that occurred.
   *
   *This error is pretty opaque. More fine-grained errors need to be emitted as events
   *by the `MessageProcessor`.
   */
  error: Anonymize<I5hhsj7l9obr84>;
};
export type Iejeo53sea6n4q = AnonymousEnum<{
  Here: undefined;
  Parent: undefined;
  Sibling: number;
}>;
export type I5hhsj7l9obr84 = AnonymousEnum<{
  BadFormat: undefined;
  Corrupt: undefined;
  Unsupported: undefined;
  Overweight: Anonymize<I4q39t5hn830vp>;
  Yield: undefined;
  StackLimitReached: undefined;
}>;
export type Ia3uu7lqcc1q1i = {
  /**
   *The `blake2_256` hash of the message.
   */
  id: FixedSizeBinary<32>;
  /**
   *The queue of the message.
   */
  origin: Anonymize<Iejeo53sea6n4q>;
  /**
   *How much weight was used to process the message.
   */
  weight_used: Anonymize<I4q39t5hn830vp>;
  /**
   *Whether the message was processed.
   *
   *Note that this does not mean that the underlying `MessageProcessor` was internally
   *successful. It *solely* means that the MQ pallet will treat this as a success
   *condition and discard the message. Any internal error needs to be emitted as events
   *by the `MessageProcessor`.
   */
  success: boolean;
};
export type I7crucfnonitkn = {
  /**
   *The `blake2_256` hash of the message.
   */
  id: FixedSizeBinary<32>;
  /**
   *The queue of the message.
   */
  origin: Anonymize<Iejeo53sea6n4q>;
  /**
   *The page of the message.
   */
  page_index: number;
  /**
   *The index of the message within the page.
   */
  message_index: number;
};
export type I7tmrp94r9sq4n = {
  /**
   *The queue of the page.
   */
  origin: Anonymize<Iejeo53sea6n4q>;
  /**
   *The index of the page.
   */
  index: number;
};
export type I45vovbl28u5ob = AnonymousEnum<{
  /**
   *Batch of dispatches did not complete fully. Index of first failing dispatch given, as
   *well as the error.
   */
  BatchInterrupted: Anonymize<Ia916s7j8ucmdd>;
  /**
   *Batch of dispatches completed fully with no error.
   */
  BatchCompleted: undefined;
  /**
   *Batch of dispatches completed but has errors.
   */
  BatchCompletedWithErrors: undefined;
  /**
   *A single item within a Batch of dispatches has completed with no error.
   */
  ItemCompleted: undefined;
  /**
   *A single item within a Batch of dispatches has completed with error.
   */
  ItemFailed: Anonymize<I6a0k8t8strmou>;
  /**
   *A call was dispatched.
   */
  DispatchedAs: Anonymize<Iboobuvtv2hqbg>;
}>;
export type Ia916s7j8ucmdd = {
  index: number;
  error: Anonymize<Icogrvf0inr18b>;
};
export type I6a0k8t8strmou = {
  error: Anonymize<Icogrvf0inr18b>;
};
export type Iboobuvtv2hqbg = {
  result: Anonymize<I6sjjdpu2cscpe>;
};
export type I6sjjdpu2cscpe = ResultPayload<
  undefined,
  Anonymize<Icogrvf0inr18b>
>;
export type Icjl5oqk1eo6sb = AnonymousEnum<{
  /**
   *A new multisig operation has begun.
   */
  NewMultisig: Anonymize<Iep27ialq4a7o7>;
  /**
   *A multisig operation has been approved by someone.
   */
  MultisigApproval: Anonymize<Iasu5jvoqr43mv>;
  /**
   *A multisig operation has been executed.
   */
  MultisigExecuted: Anonymize<I5f1j6imiigvdh>;
  /**
   *A multisig operation has been cancelled.
   */
  MultisigCancelled: Anonymize<I5qolde99acmd1>;
}>;
export type Iep27ialq4a7o7 = {
  approving: SS58String;
  multisig: SS58String;
  call_hash: FixedSizeBinary<32>;
};
export type Iasu5jvoqr43mv = {
  approving: SS58String;
  timepoint: Anonymize<Itvprrpb0nm3o>;
  multisig: SS58String;
  call_hash: FixedSizeBinary<32>;
};
export type Itvprrpb0nm3o = {
  height: number;
  index: number;
};
export type I5f1j6imiigvdh = {
  approving: SS58String;
  timepoint: Anonymize<Itvprrpb0nm3o>;
  multisig: SS58String;
  call_hash: FixedSizeBinary<32>;
  result: Anonymize<I6sjjdpu2cscpe>;
};
export type I5qolde99acmd1 = {
  cancelling: SS58String;
  timepoint: Anonymize<Itvprrpb0nm3o>;
  multisig: SS58String;
  call_hash: FixedSizeBinary<32>;
};
export type I8qme4qa965a0r = AnonymousEnum<{
  /**
   *A proxy was executed correctly, with the given.
   */
  ProxyExecuted: Anonymize<Iboobuvtv2hqbg>;
  /**
   *A pure account has been created by new proxy with given
   *disambiguation index and proxy type.
   */
  PureCreated: Anonymize<Ie7cuj84ohvg56>;
  /**
   *An announcement was placed to make a call in the future.
   */
  Announced: Anonymize<I2ur0oeqg495j8>;
  /**
   *A proxy was added.
   */
  ProxyAdded: Anonymize<I8ioopvokvl3ud>;
  /**
   *A proxy was removed.
   */
  ProxyRemoved: Anonymize<I8ioopvokvl3ud>;
}>;
export type Ie7cuj84ohvg56 = {
  pure: SS58String;
  who: SS58String;
  proxy_type: Anonymize<I5ftepkjop3g1u>;
  disambiguation_index: number;
};
export type I5ftepkjop3g1u = AnonymousEnum<{
  Any: undefined;
  NonTransfer: undefined;
  CancelProxy: undefined;
  Assets: undefined;
  AssetOwner: undefined;
  AssetManager: undefined;
  Collator: undefined;
}>;
export type I2ur0oeqg495j8 = {
  real: SS58String;
  proxy: SS58String;
  call_hash: FixedSizeBinary<32>;
};
export type I8ioopvokvl3ud = {
  delegator: SS58String;
  delegatee: SS58String;
  proxy_type: Anonymize<I5ftepkjop3g1u>;
  delay: number;
};
export type I6avancvg8fd05 = AnonymousEnum<{
  /**
   *Some asset class was created.
   */
  Created: Anonymize<I88ff3u4dpivk>;
  /**
   *Some assets were issued.
   */
  Issued: Anonymize<I33cp947glv1ks>;
  /**
   *Some assets were transferred.
   */
  Transferred: Anonymize<Ic9om1gmmqu7rq>;
  /**
   *Some assets were destroyed.
   */
  Burned: Anonymize<I5hfov2b68ppb6>;
  /**
   *The management team changed.
   */
  TeamChanged: Anonymize<Ibthhb2m9vneds>;
  /**
   *The owner changed.
   */
  OwnerChanged: Anonymize<Iaitn5bqfacj7k>;
  /**
   *Some account `who` was frozen.
   */
  Frozen: Anonymize<If4ebvclj2ugvi>;
  /**
   *Some account `who` was thawed.
   */
  Thawed: Anonymize<If4ebvclj2ugvi>;
  /**
   *Some asset `asset_id` was frozen.
   */
  AssetFrozen: Anonymize<Ia5le7udkgbaq9>;
  /**
   *Some asset `asset_id` was thawed.
   */
  AssetThawed: Anonymize<Ia5le7udkgbaq9>;
  /**
   *Accounts were destroyed for given asset.
   */
  AccountsDestroyed: Anonymize<Ieduc1e6frq8rb>;
  /**
   *Approvals were destroyed for given asset.
   */
  ApprovalsDestroyed: Anonymize<I9h6gbtabovtm4>;
  /**
   *An asset class is in the process of being destroyed.
   */
  DestructionStarted: Anonymize<Ia5le7udkgbaq9>;
  /**
   *An asset class was destroyed.
   */
  Destroyed: Anonymize<Ia5le7udkgbaq9>;
  /**
   *Some asset class was force-created.
   */
  ForceCreated: Anonymize<Iaitn5bqfacj7k>;
  /**
   *New metadata has been set for an asset.
   */
  MetadataSet: Anonymize<Ifnsa0dkkpf465>;
  /**
   *Metadata has been cleared for an asset.
   */
  MetadataCleared: Anonymize<Ia5le7udkgbaq9>;
  /**
   *(Additional) funds have been approved for transfer to a destination account.
   */
  ApprovedTransfer: Anonymize<I65dtqr2egjbc3>;
  /**
   *An approval for account `delegate` was cancelled by `owner`.
   */
  ApprovalCancelled: Anonymize<Ibqj3vg5s5lk0c>;
  /**
   *An `amount` was transferred in its entirety from `owner` to `destination` by
   *the approved `delegate`.
   */
  TransferredApproved: Anonymize<I6l73u513p8rna>;
  /**
   *An asset has had its attributes changed by the `Force` origin.
   */
  AssetStatusChanged: Anonymize<Ia5le7udkgbaq9>;
  /**
   *The min_balance of an asset has been updated by the asset owner.
   */
  AssetMinBalanceChanged: Anonymize<Iefqmt2htu1dlu>;
  /**
   *Some account `who` was created with a deposit from `depositor`.
   */
  Touched: Anonymize<If8bgtgqrchjtu>;
  /**
   *Some account `who` was blocked.
   */
  Blocked: Anonymize<If4ebvclj2ugvi>;
  /**
   *Some assets were deposited (e.g. for transaction fees).
   */
  Deposited: Anonymize<Idusmq77988cmt>;
  /**
   *Some assets were withdrawn from the account (e.g. for transaction fees).
   */
  Withdrawn: Anonymize<Idusmq77988cmt>;
}>;
export type I88ff3u4dpivk = {
  asset_id: number;
  creator: SS58String;
  owner: SS58String;
};
export type I33cp947glv1ks = {
  asset_id: number;
  owner: SS58String;
  amount: bigint;
};
export type Ic9om1gmmqu7rq = {
  asset_id: number;
  from: SS58String;
  to: SS58String;
  amount: bigint;
};
export type I5hfov2b68ppb6 = {
  asset_id: number;
  owner: SS58String;
  balance: bigint;
};
export type Ibthhb2m9vneds = {
  asset_id: number;
  issuer: SS58String;
  admin: SS58String;
  freezer: SS58String;
};
export type Iaitn5bqfacj7k = {
  asset_id: number;
  owner: SS58String;
};
export type If4ebvclj2ugvi = {
  asset_id: number;
  who: SS58String;
};
export type Ia5le7udkgbaq9 = {
  asset_id: number;
};
export type Ieduc1e6frq8rb = {
  asset_id: number;
  accounts_destroyed: number;
  accounts_remaining: number;
};
export type I9h6gbtabovtm4 = {
  asset_id: number;
  approvals_destroyed: number;
  approvals_remaining: number;
};
export type Ifnsa0dkkpf465 = {
  asset_id: number;
  name: Binary;
  symbol: Binary;
  decimals: number;
  is_frozen: boolean;
};
export type I65dtqr2egjbc3 = {
  asset_id: number;
  source: SS58String;
  delegate: SS58String;
  amount: bigint;
};
export type Ibqj3vg5s5lk0c = {
  asset_id: number;
  owner: SS58String;
  delegate: SS58String;
};
export type I6l73u513p8rna = {
  asset_id: number;
  owner: SS58String;
  delegate: SS58String;
  destination: SS58String;
  amount: bigint;
};
export type Iefqmt2htu1dlu = {
  asset_id: number;
  new_min_balance: bigint;
};
export type If8bgtgqrchjtu = {
  asset_id: number;
  who: SS58String;
  depositor: SS58String;
};
export type Idusmq77988cmt = {
  asset_id: number;
  who: SS58String;
  amount: bigint;
};
export type Ia0j71vjrjqu9p = AnonymousEnum<{
  /**
   *A `collection` was created.
   */
  Created: Anonymize<I9gqanbbbe917p>;
  /**
   *A `collection` was force-created.
   */
  ForceCreated: Anonymize<Id1m1230297f7a>;
  /**
   *A `collection` was destroyed.
   */
  Destroyed: Anonymize<I6cu7obfo0rr0o>;
  /**
   *An `item` was issued.
   */
  Issued: Anonymize<Ifvb1p5munhhv4>;
  /**
   *An `item` was transferred.
   */
  Transferred: Anonymize<I46h83ilqeed3g>;
  /**
   *An `item` was destroyed.
   */
  Burned: Anonymize<Ifvb1p5munhhv4>;
  /**
   *Some `item` was frozen.
   */
  Frozen: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Some `item` was thawed.
   */
  Thawed: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Some `collection` was frozen.
   */
  CollectionFrozen: Anonymize<I6cu7obfo0rr0o>;
  /**
   *Some `collection` was thawed.
   */
  CollectionThawed: Anonymize<I6cu7obfo0rr0o>;
  /**
   *The owner changed.
   */
  OwnerChanged: Anonymize<Icahse3uoi76n7>;
  /**
   *The management team changed.
   */
  TeamChanged: Anonymize<I75sj3uv7gnemk>;
  /**
   *An `item` of a `collection` has been approved by the `owner` for transfer by
   *a `delegate`.
   */
  ApprovedTransfer: Anonymize<I5fjkvcb5vr6nb>;
  /**
   *An approval for a `delegate` account to transfer the `item` of an item
   *`collection` was cancelled by its `owner`.
   */
  ApprovalCancelled: Anonymize<I5fjkvcb5vr6nb>;
  /**
   *A `collection` has had its attributes changed by the `Force` origin.
   */
  ItemStatusChanged: Anonymize<I6cu7obfo0rr0o>;
  /**
   *New metadata has been set for a `collection`.
   */
  CollectionMetadataSet: Anonymize<I9viqhmdtuof5e>;
  /**
   *Metadata has been cleared for a `collection`.
   */
  CollectionMetadataCleared: Anonymize<I6cu7obfo0rr0o>;
  /**
   *New metadata has been set for an item.
   */
  MetadataSet: Anonymize<Iceq9fmmp9aeqv>;
  /**
   *Metadata has been cleared for an item.
   */
  MetadataCleared: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Metadata has been cleared for an item.
   */
  Redeposited: Anonymize<I2gr1toekv86b9>;
  /**
   *New attribute metadata has been set for a `collection` or `item`.
   */
  AttributeSet: Anonymize<I5tvvgui05tn6e>;
  /**
   *Attribute metadata has been cleared for a `collection` or `item`.
   */
  AttributeCleared: Anonymize<Ibal0joadvdc2h>;
  /**
   *Ownership acceptance has changed for an account.
   */
  OwnershipAcceptanceChanged: Anonymize<I2v2ikqt2trp52>;
  /**
   *Max supply has been set for a collection.
   */
  CollectionMaxSupplySet: Anonymize<I6h88h8vba22v8>;
  /**
   *The price was set for the instance.
   */
  ItemPriceSet: Anonymize<If3057hi1g5qlo>;
  /**
   *The price for the instance was removed.
   */
  ItemPriceRemoved: Anonymize<Iafkqus0ohh6l6>;
  /**
   *An item was bought.
   */
  ItemBought: Anonymize<Iaii5qf41d5n3d>;
}>;
export type I9gqanbbbe917p = {
  collection: number;
  creator: SS58String;
  owner: SS58String;
};
export type Id1m1230297f7a = {
  collection: number;
  owner: SS58String;
};
export type I6cu7obfo0rr0o = {
  collection: number;
};
export type Ifvb1p5munhhv4 = {
  collection: number;
  item: number;
  owner: SS58String;
};
export type I46h83ilqeed3g = {
  collection: number;
  item: number;
  from: SS58String;
  to: SS58String;
};
export type Iafkqus0ohh6l6 = {
  collection: number;
  item: number;
};
export type Icahse3uoi76n7 = {
  collection: number;
  new_owner: SS58String;
};
export type I75sj3uv7gnemk = {
  collection: number;
  issuer: SS58String;
  admin: SS58String;
  freezer: SS58String;
};
export type I5fjkvcb5vr6nb = {
  collection: number;
  item: number;
  owner: SS58String;
  delegate: SS58String;
};
export type I9viqhmdtuof5e = {
  collection: number;
  data: Binary;
  is_frozen: boolean;
};
export type Iceq9fmmp9aeqv = {
  collection: number;
  item: number;
  data: Binary;
  is_frozen: boolean;
};
export type I2gr1toekv86b9 = {
  collection: number;
  successful_items: Anonymize<Icgljjb6j82uhn>;
};
export type Icgljjb6j82uhn = Array<number>;
export type I5tvvgui05tn6e = {
  collection: number;
  maybe_item?: Anonymize<I4arjljr6dpflb>;
  key: Binary;
  value: Binary;
};
export type I4arjljr6dpflb = number | undefined;
export type Ibal0joadvdc2h = {
  collection: number;
  maybe_item?: Anonymize<I4arjljr6dpflb>;
  key: Binary;
};
export type I2v2ikqt2trp52 = {
  who: SS58String;
  maybe_collection?: Anonymize<I4arjljr6dpflb>;
};
export type I6h88h8vba22v8 = {
  collection: number;
  max_supply: number;
};
export type If3057hi1g5qlo = {
  collection: number;
  item: number;
  price: bigint;
  whitelisted_buyer?: Anonymize<Ihfphjolmsqq1>;
};
export type Ihfphjolmsqq1 = SS58String | undefined;
export type Iaii5qf41d5n3d = {
  collection: number;
  item: number;
  price: bigint;
  seller: SS58String;
  buyer: SS58String;
};
export type I6qicn8jn4fftj = AnonymousEnum<{
  /**
   *A `collection` was created.
   */
  Created: Anonymize<I9gqanbbbe917p>;
  /**
   *A `collection` was force-created.
   */
  ForceCreated: Anonymize<Id1m1230297f7a>;
  /**
   *A `collection` was destroyed.
   */
  Destroyed: Anonymize<I6cu7obfo0rr0o>;
  /**
   *An `item` was issued.
   */
  Issued: Anonymize<Ifvb1p5munhhv4>;
  /**
   *An `item` was transferred.
   */
  Transferred: Anonymize<I46h83ilqeed3g>;
  /**
   *An `item` was destroyed.
   */
  Burned: Anonymize<Ifvb1p5munhhv4>;
  /**
   *An `item` became non-transferable.
   */
  ItemTransferLocked: Anonymize<Iafkqus0ohh6l6>;
  /**
   *An `item` became transferable.
   */
  ItemTransferUnlocked: Anonymize<Iafkqus0ohh6l6>;
  /**
   *`item` metadata or attributes were locked.
   */
  ItemPropertiesLocked: Anonymize<I1jj31tn29ie3c>;
  /**
   *Some `collection` was locked.
   */
  CollectionLocked: Anonymize<I6cu7obfo0rr0o>;
  /**
   *The owner changed.
   */
  OwnerChanged: Anonymize<Icahse3uoi76n7>;
  /**
   *The management team changed.
   */
  TeamChanged: Anonymize<Ico8bnjc6taa27>;
  /**
   *An `item` of a `collection` has been approved by the `owner` for transfer by
   *a `delegate`.
   */
  TransferApproved: Anonymize<I78i1bvlonei69>;
  /**
   *An approval for a `delegate` account to transfer the `item` of an item
   *`collection` was cancelled by its `owner`.
   */
  ApprovalCancelled: Anonymize<I5fjkvcb5vr6nb>;
  /**
   *All approvals of an item got cancelled.
   */
  AllApprovalsCancelled: Anonymize<Ifvb1p5munhhv4>;
  /**
   *A `collection` has had its config changed by the `Force` origin.
   */
  CollectionConfigChanged: Anonymize<I6cu7obfo0rr0o>;
  /**
   *New metadata has been set for a `collection`.
   */
  CollectionMetadataSet: Anonymize<I78u60nqh0etah>;
  /**
   *Metadata has been cleared for a `collection`.
   */
  CollectionMetadataCleared: Anonymize<I6cu7obfo0rr0o>;
  /**
   *New metadata has been set for an item.
   */
  ItemMetadataSet: Anonymize<Icrkms46uh8tpb>;
  /**
   *Metadata has been cleared for an item.
   */
  ItemMetadataCleared: Anonymize<Iafkqus0ohh6l6>;
  /**
   *The deposit for a set of `item`s within a `collection` has been updated.
   */
  Redeposited: Anonymize<I2gr1toekv86b9>;
  /**
   *New attribute metadata has been set for a `collection` or `item`.
   */
  AttributeSet: Anonymize<I5llu6o6a0go5i>;
  /**
   *Attribute metadata has been cleared for a `collection` or `item`.
   */
  AttributeCleared: Anonymize<I93r2effh7od84>;
  /**
   *A new approval to modify item attributes was added.
   */
  ItemAttributesApprovalAdded: Anonymize<I9i1f9mrso1hmf>;
  /**
   *A new approval to modify item attributes was removed.
   */
  ItemAttributesApprovalRemoved: Anonymize<I9i1f9mrso1hmf>;
  /**
   *Ownership acceptance has changed for an account.
   */
  OwnershipAcceptanceChanged: Anonymize<I2v2ikqt2trp52>;
  /**
   *Max supply has been set for a collection.
   */
  CollectionMaxSupplySet: Anonymize<I6h88h8vba22v8>;
  /**
   *Mint settings for a collection had changed.
   */
  CollectionMintSettingsUpdated: Anonymize<I6cu7obfo0rr0o>;
  /**
   *Event gets emitted when the `NextCollectionId` gets incremented.
   */
  NextCollectionIdIncremented: Anonymize<I9ksla2si91s56>;
  /**
   *The price was set for the item.
   */
  ItemPriceSet: Anonymize<If3057hi1g5qlo>;
  /**
   *The price for the item was removed.
   */
  ItemPriceRemoved: Anonymize<Iafkqus0ohh6l6>;
  /**
   *An item was bought.
   */
  ItemBought: Anonymize<Iaii5qf41d5n3d>;
  /**
   *A tip was sent.
   */
  TipSent: Anonymize<Id9j7b85otvjru>;
  /**
   *An `item` swap intent was created.
   */
  SwapCreated: Anonymize<Iaihk9pek2ajl9>;
  /**
   *The swap was cancelled.
   */
  SwapCancelled: Anonymize<Iaihk9pek2ajl9>;
  /**
   *The swap has been claimed.
   */
  SwapClaimed: Anonymize<Id9av23h47ufb2>;
  /**
   *New attributes have been set for an `item` of the `collection`.
   */
  PreSignedAttributesSet: Anonymize<Ib4kpnijas4jqp>;
  /**
   *A new attribute in the `Pallet` namespace was set for the `collection` or an `item`
   *within that `collection`.
   */
  PalletAttributeSet: Anonymize<I2vnu5k0u1i65h>;
}>;
export type I1jj31tn29ie3c = {
  collection: number;
  item: number;
  lock_metadata: boolean;
  lock_attributes: boolean;
};
export type Ico8bnjc6taa27 = {
  collection: number;
  issuer?: Anonymize<Ihfphjolmsqq1>;
  admin?: Anonymize<Ihfphjolmsqq1>;
  freezer?: Anonymize<Ihfphjolmsqq1>;
};
export type I78i1bvlonei69 = {
  collection: number;
  item: number;
  owner: SS58String;
  delegate: SS58String;
  deadline?: Anonymize<I4arjljr6dpflb>;
};
export type I78u60nqh0etah = {
  collection: number;
  data: Binary;
};
export type Icrkms46uh8tpb = {
  collection: number;
  item: number;
  data: Binary;
};
export type I5llu6o6a0go5i = {
  collection: number;
  maybe_item?: Anonymize<I4arjljr6dpflb>;
  key: Binary;
  value: Binary;
  namespace: Anonymize<If3jjadhmug6qc>;
};
export type If3jjadhmug6qc = AnonymousEnum<{
  Pallet: undefined;
  CollectionOwner: undefined;
  ItemOwner: undefined;
  Account: SS58String;
}>;
export type I93r2effh7od84 = {
  collection: number;
  maybe_item?: Anonymize<I4arjljr6dpflb>;
  key: Binary;
  namespace: Anonymize<If3jjadhmug6qc>;
};
export type I9i1f9mrso1hmf = {
  collection: number;
  item: number;
  delegate: SS58String;
};
export type I9ksla2si91s56 = {
  next_id?: Anonymize<I4arjljr6dpflb>;
};
export type Id9j7b85otvjru = {
  collection: number;
  item: number;
  sender: SS58String;
  receiver: SS58String;
  amount: bigint;
};
export type Iaihk9pek2ajl9 = {
  offered_collection: number;
  offered_item: number;
  desired_collection: number;
  desired_item?: Anonymize<I4arjljr6dpflb>;
  price?: Anonymize<I6oogc1jbmmi81>;
  deadline: number;
};
export type I6oogc1jbmmi81 = Anonymize<I9b1jgmi22enn5> | undefined;
export type I9b1jgmi22enn5 = {
  amount: bigint;
  direction: Anonymize<I1p7rj0j3gmh73>;
};
export type I1p7rj0j3gmh73 = AnonymousEnum<{
  Send: undefined;
  Receive: undefined;
}>;
export type Id9av23h47ufb2 = {
  sent_collection: number;
  sent_item: number;
  sent_item_owner: SS58String;
  received_collection: number;
  received_item: number;
  received_item_owner: SS58String;
  price?: Anonymize<I6oogc1jbmmi81>;
  deadline: number;
};
export type Ib4kpnijas4jqp = {
  collection: number;
  item: number;
  namespace: Anonymize<If3jjadhmug6qc>;
};
export type I2vnu5k0u1i65h = {
  collection: number;
  item?: Anonymize<I4arjljr6dpflb>;
  attribute: Anonymize<I75km45qj0eg5n>;
  value: Binary;
};
export type I75km45qj0eg5n = AnonymousEnum<{
  UsedToClaim: number;
  TransferDisabled: undefined;
}>;
export type I81i2fkdo6nple = AnonymousEnum<{
  /**
   *Some asset class was created.
   */
  Created: Anonymize<I36h211fbvstks>;
  /**
   *Some assets were issued.
   */
  Issued: Anonymize<I2k9iu40qhp841>;
  /**
   *Some assets were transferred.
   */
  Transferred: Anonymize<I3dufa2gr145hf>;
  /**
   *Some assets were destroyed.
   */
  Burned: Anonymize<Ie66s9cr50m7sr>;
  /**
   *The management team changed.
   */
  TeamChanged: Anonymize<I3msvtljqnu799>;
  /**
   *The owner changed.
   */
  OwnerChanged: Anonymize<I467a79vcdbrec>;
  /**
   *Some account `who` was frozen.
   */
  Frozen: Anonymize<Ia8imt144v3n25>;
  /**
   *Some account `who` was thawed.
   */
  Thawed: Anonymize<Ia8imt144v3n25>;
  /**
   *Some asset `asset_id` was frozen.
   */
  AssetFrozen: Anonymize<I35uvf5ij009e8>;
  /**
   *Some asset `asset_id` was thawed.
   */
  AssetThawed: Anonymize<I35uvf5ij009e8>;
  /**
   *Accounts were destroyed for given asset.
   */
  AccountsDestroyed: Anonymize<I1mmtcsmkng8nj>;
  /**
   *Approvals were destroyed for given asset.
   */
  ApprovalsDestroyed: Anonymize<I30qmuqbs4i8i4>;
  /**
   *An asset class is in the process of being destroyed.
   */
  DestructionStarted: Anonymize<I35uvf5ij009e8>;
  /**
   *An asset class was destroyed.
   */
  Destroyed: Anonymize<I35uvf5ij009e8>;
  /**
   *Some asset class was force-created.
   */
  ForceCreated: Anonymize<I467a79vcdbrec>;
  /**
   *New metadata has been set for an asset.
   */
  MetadataSet: Anonymize<Iarmm62t3lm37e>;
  /**
   *Metadata has been cleared for an asset.
   */
  MetadataCleared: Anonymize<I35uvf5ij009e8>;
  /**
   *(Additional) funds have been approved for transfer to a destination account.
   */
  ApprovedTransfer: Anonymize<I9nm7qticlhmgl>;
  /**
   *An approval for account `delegate` was cancelled by `owner`.
   */
  ApprovalCancelled: Anonymize<Iev4iv86ng02ck>;
  /**
   *An `amount` was transferred in its entirety from `owner` to `destination` by
   *the approved `delegate`.
   */
  TransferredApproved: Anonymize<I5s8p7gejoudvh>;
  /**
   *An asset has had its attributes changed by the `Force` origin.
   */
  AssetStatusChanged: Anonymize<I35uvf5ij009e8>;
  /**
   *The min_balance of an asset has been updated by the asset owner.
   */
  AssetMinBalanceChanged: Anonymize<If4jtj68r1gabq>;
  /**
   *Some account `who` was created with a deposit from `depositor`.
   */
  Touched: Anonymize<I8s66oebjsgqga>;
  /**
   *Some account `who` was blocked.
   */
  Blocked: Anonymize<Ia8imt144v3n25>;
  /**
   *Some assets were deposited (e.g. for transaction fees).
   */
  Deposited: Anonymize<I42gee3b9iotl3>;
  /**
   *Some assets were withdrawn from the account (e.g. for transaction fees).
   */
  Withdrawn: Anonymize<I42gee3b9iotl3>;
}>;
export type I36h211fbvstks = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  creator: SS58String;
  owner: SS58String;
};
export type I2k9iu40qhp841 = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  owner: SS58String;
  amount: bigint;
};
export type I3dufa2gr145hf = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  from: SS58String;
  to: SS58String;
  amount: bigint;
};
export type Ie66s9cr50m7sr = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  owner: SS58String;
  balance: bigint;
};
export type I3msvtljqnu799 = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  issuer: SS58String;
  admin: SS58String;
  freezer: SS58String;
};
export type I467a79vcdbrec = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  owner: SS58String;
};
export type Ia8imt144v3n25 = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  who: SS58String;
};
export type I35uvf5ij009e8 = {
  asset_id: Anonymize<I4c0s5cioidn76>;
};
export type I1mmtcsmkng8nj = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  accounts_destroyed: number;
  accounts_remaining: number;
};
export type I30qmuqbs4i8i4 = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  approvals_destroyed: number;
  approvals_remaining: number;
};
export type Iarmm62t3lm37e = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  name: Binary;
  symbol: Binary;
  decimals: number;
  is_frozen: boolean;
};
export type I9nm7qticlhmgl = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  source: SS58String;
  delegate: SS58String;
  amount: bigint;
};
export type Iev4iv86ng02ck = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  owner: SS58String;
  delegate: SS58String;
};
export type I5s8p7gejoudvh = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  owner: SS58String;
  delegate: SS58String;
  destination: SS58String;
  amount: bigint;
};
export type If4jtj68r1gabq = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  new_min_balance: bigint;
};
export type I8s66oebjsgqga = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  who: SS58String;
  depositor: SS58String;
};
export type I42gee3b9iotl3 = {
  asset_id: Anonymize<I4c0s5cioidn76>;
  who: SS58String;
  amount: bigint;
};
export type I31lqq0fjfmnfv = AnonymousEnum<{
  /**
   *A successful call of the `CreatePool` extrinsic will create this event.
   */
  PoolCreated: Anonymize<I9eo7u28un09g0>;
  /**
   *A successful call of the `AddLiquidity` extrinsic will create this event.
   */
  LiquidityAdded: Anonymize<I99d21a0mjv4oo>;
  /**
   *A successful call of the `RemoveLiquidity` extrinsic will create this event.
   */
  LiquidityRemoved: Anonymize<I6l4cdn6bhfq84>;
  /**
   *Assets have been converted from one to another. Both `SwapExactTokenForToken`
   *and `SwapTokenForExactToken` will generate this event.
   */
  SwapExecuted: Anonymize<Iduk3pajm13p5c>;
  /**
   *Assets have been converted from one to another.
   */
  SwapCreditExecuted: Anonymize<I9cgel74dg00ig>;
  /**
   *Pool has been touched in order to fulfill operational requirements.
   */
  Touched: Anonymize<Ibkbs6pj6cn1hv>;
}>;
export type I9eo7u28un09g0 = {
  /**
   *The account that created the pool.
   */
  creator: SS58String;
  /**
   *The pool id associated with the pool. Note that the order of the assets may not be
   *the same as the order specified in the create pool extrinsic.
   */
  pool_id: Anonymize<Id0as9l3s817qs>;
  /**
   *The account ID of the pool.
   */
  pool_account: SS58String;
  /**
   *The id of the liquidity tokens that will be minted when assets are added to this
   *pool.
   */
  lp_token: number;
};
export type Id0as9l3s817qs = FixedSizeArray<2, Anonymize<I4c0s5cioidn76>>;
export type I99d21a0mjv4oo = {
  /**
   *The account that the liquidity was taken from.
   */
  who: SS58String;
  /**
   *The account that the liquidity tokens were minted to.
   */
  mint_to: SS58String;
  /**
   *The pool id of the pool that the liquidity was added to.
   */
  pool_id: Anonymize<Id0as9l3s817qs>;
  /**
   *The amount of the first asset that was added to the pool.
   */
  amount1_provided: bigint;
  /**
   *The amount of the second asset that was added to the pool.
   */
  amount2_provided: bigint;
  /**
   *The id of the lp token that was minted.
   */
  lp_token: number;
  /**
   *The amount of lp tokens that were minted of that id.
   */
  lp_token_minted: bigint;
};
export type I6l4cdn6bhfq84 = {
  /**
   *The account that the liquidity tokens were burned from.
   */
  who: SS58String;
  /**
   *The account that the assets were transferred to.
   */
  withdraw_to: SS58String;
  /**
   *The pool id that the liquidity was removed from.
   */
  pool_id: Anonymize<Id0as9l3s817qs>;
  /**
   *The amount of the first asset that was removed from the pool.
   */
  amount1: bigint;
  /**
   *The amount of the second asset that was removed from the pool.
   */
  amount2: bigint;
  /**
   *The id of the lp token that was burned.
   */
  lp_token: number;
  /**
   *The amount of lp tokens that were burned of that id.
   */
  lp_token_burned: bigint;
  /**
   *Liquidity withdrawal fee (%).
   */
  withdrawal_fee: number;
};
export type Iduk3pajm13p5c = {
  /**
   *Which account was the instigator of the swap.
   */
  who: SS58String;
  /**
   *The account that the assets were transferred to.
   */
  send_to: SS58String;
  /**
   *The amount of the first asset that was swapped.
   */
  amount_in: bigint;
  /**
   *The amount of the second asset that was received.
   */
  amount_out: bigint;
  /**
   *The route of asset IDs with amounts that the swap went through.
   *E.g. (A, amount_in) -> (Dot, amount_out) -> (B, amount_out)
   */
  path: Anonymize<Ibirh7ova056d>;
};
export type Ibirh7ova056d = Array<Anonymize<Iadrpn9mhdu2rp>>;
export type Iadrpn9mhdu2rp = [Anonymize<I4c0s5cioidn76>, bigint];
export type I9cgel74dg00ig = {
  /**
   *The amount of the first asset that was swapped.
   */
  amount_in: bigint;
  /**
   *The amount of the second asset that was received.
   */
  amount_out: bigint;
  /**
   *The route of asset IDs with amounts that the swap went through.
   *E.g. (A, amount_in) -> (Dot, amount_out) -> (B, amount_out)
   */
  path: Anonymize<Ibirh7ova056d>;
};
export type Ibkbs6pj6cn1hv = {
  /**
   *The ID of the pool.
   */
  pool_id: Anonymize<Id0as9l3s817qs>;
  /**
   *The account initiating the touch.
   */
  who: SS58String;
};
export type Ic5m5lp1oioo8r = Array<FixedSizeBinary<32>>;
export type I95g6i7ilua7lq = Array<Anonymize<I9jd27rnpm8ttv>>;
export type I9jd27rnpm8ttv = FixedSizeArray<2, number>;
export type Ieniouoqkq4icf = {
  spec_version: number;
  spec_name: string;
};
export type I1v7jbnil3tjns = Array<Anonymize<Ifv73m0cjq92it>>;
export type Ifv73m0cjq92it = {
  used_bandwidth: Anonymize<Ieafp1gui1o4cl>;
  para_head_hash?: Anonymize<I4s6vifaf8k998>;
  consumed_go_ahead_signal?: Anonymize<Iav8k1edbj86k7>;
};
export type Ieafp1gui1o4cl = {
  ump_msg_count: number;
  ump_total_bytes: number;
  hrmp_outgoing: Anonymize<I68brng9hc4b57>;
};
export type I68brng9hc4b57 = Array<Anonymize<I2hfpgo4vigap7>>;
export type I2hfpgo4vigap7 = [number, Anonymize<I37lfg356jmoof>];
export type I37lfg356jmoof = {
  msg_count: number;
  total_bytes: number;
};
export type Iav8k1edbj86k7 = UpgradeGoAhead | undefined;
export type UpgradeGoAhead = Enum<{
  Abort: undefined;
  GoAhead: undefined;
}>;
export declare const UpgradeGoAhead: GetEnum<UpgradeGoAhead>;
export type I8jgj1nhcr2dg8 = {
  used_bandwidth: Anonymize<Ieafp1gui1o4cl>;
  hrmp_watermark?: Anonymize<I4arjljr6dpflb>;
  consumed_go_ahead_signal?: Anonymize<Iav8k1edbj86k7>;
};
export type Ifn6q3equiq9qi = {
  parent_head: Binary;
  relay_parent_number: number;
  relay_parent_storage_root: FixedSizeBinary<32>;
  max_pov_size: number;
};
export type Ia3sb0vgvovhtg = UpgradeRestriction | undefined;
export type UpgradeRestriction = Enum<{
  Present: undefined;
}>;
export declare const UpgradeRestriction: GetEnum<UpgradeRestriction>;
export type Itom7fk49o0c9 = Array<Binary>;
export type I4i91h98n3cv1b = {
  dmq_mqc_head: FixedSizeBinary<32>;
  relay_dispatch_queue_remaining_capacity: Anonymize<I3j1v1c2btq4bd>;
  ingress_channels: Anonymize<I2d966pi8ko0ts>;
  egress_channels: Anonymize<I2d966pi8ko0ts>;
};
export type I3j1v1c2btq4bd = {
  remaining_count: number;
  remaining_size: number;
};
export type I2d966pi8ko0ts = Array<Anonymize<Ib4li5mtsch8a1>>;
export type Ib4li5mtsch8a1 = [number, Anonymize<Ivvvdad7teq4e>];
export type Ivvvdad7teq4e = {
  max_capacity: number;
  max_total_size: number;
  max_message_size: number;
  msg_count: number;
  total_size: number;
  mqc_head?: Anonymize<I4s6vifaf8k998>;
};
export type I4iumukclgj8ej = {
  max_code_size: number;
  max_head_data_size: number;
  max_upward_queue_count: number;
  max_upward_queue_size: number;
  max_upward_message_size: number;
  max_upward_message_num_per_candidate: number;
  hrmp_max_message_num_per_candidate: number;
  validation_upgrade_cooldown: number;
  validation_upgrade_delay: number;
  async_backing_params: Anonymize<Iavuvfkop6318c>;
};
export type Iavuvfkop6318c = {
  max_candidate_depth: number;
  allowed_ancestry_len: number;
};
export type Iqnbvitf7a7l3 = Array<Anonymize<I4p5t2krb1gmvp>>;
export type I4p5t2krb1gmvp = [number, FixedSizeBinary<32>];
export type I6r5cbv8ttrb09 = Array<Anonymize<I958l48g4qg5rf>>;
export type I958l48g4qg5rf = {
  recipient: number;
  data: Binary;
};
export type I8ds64oj6581v0 = Array<Anonymize<Ifd60g9ld04ljn>>;
export type Ifd60g9ld04ljn = {
  id: FixedSizeBinary<8>;
  amount: bigint;
  reasons: BalancesTypesReasons;
};
export type BalancesTypesReasons = Enum<{
  Fee: undefined;
  Misc: undefined;
  All: undefined;
}>;
export declare const BalancesTypesReasons: GetEnum<BalancesTypesReasons>;
export type Ia7pdug7cdsg8g = Array<Anonymize<I1basc5up2fk73>>;
export type I1basc5up2fk73 = {
  id: FixedSizeBinary<8>;
  amount: bigint;
};
export type I9bin2jc70qt6q = Array<Anonymize<I3qt1hgg4djhgb>>;
export type TransactionPaymentReleases = Enum<{
  V1Ancient: undefined;
  V2: undefined;
}>;
export declare const TransactionPaymentReleases: GetEnum<TransactionPaymentReleases>;
export type Ifble4juuml5ig = Array<Anonymize<I4aro1m78pdrtt>>;
export type I4aro1m78pdrtt = {
  locked: bigint;
  per_block: bigint;
  starting_block: number;
};
export type Version = Enum<{
  V0: undefined;
  V1: undefined;
}>;
export declare const Version: GetEnum<Version>;
export type Ifi4da1gej1fri = Array<Anonymize<Iep1lmt6q3s6r3>>;
export type Iep1lmt6q3s6r3 = {
  who: SS58String;
  deposit: bigint;
};
export type Ifvgo9568rpmqc = Array<Anonymize<I8uo3fpd3bcc6f>>;
export type I8uo3fpd3bcc6f = [SS58String, FixedSizeBinary<32>];
export type I6cs1itejju2vv = [bigint, number];
export type Ib77b0fp1a6mjr = Array<Anonymize<I1tbd609kokm4d>>;
export type I1tbd609kokm4d = {
  recipient: number;
  state: Anonymize<Ic2gg6ldfq068e>;
  signals_exist: boolean;
  first_index: number;
  last_index: number;
};
export type Ic2gg6ldfq068e = AnonymousEnum<{
  Ok: undefined;
  Suspended: undefined;
}>;
export type I5g2vv0ckl2m8b = [number, number];
export type Ifup3lg9ro8a0f = {
  suspend_threshold: number;
  drop_threshold: number;
  resume_threshold: number;
};
export type XcmPalletQueryStatus = Enum<{
  Pending: Anonymize<I9cig2tff0h7a2>;
  VersionNotifier: Anonymize<I5c2ss6qk7lue3>;
  Ready: Anonymize<I2rikk3g9dnfdf>;
}>;
export declare const XcmPalletQueryStatus: GetEnum<XcmPalletQueryStatus>;
export type I9cig2tff0h7a2 = {
  responder: XcmVersionedLocation;
  maybe_match_querier?: Anonymize<Ichrhugqpl0jbb>;
  maybe_notify?: Anonymize<I1faufi0iffstp>;
  timeout: number;
};
export type Ichrhugqpl0jbb = XcmVersionedLocation | undefined;
export type I1faufi0iffstp = FixedSizeBinary<2> | undefined;
export type I5c2ss6qk7lue3 = {
  origin: XcmVersionedLocation;
  is_active: boolean;
};
export type I2rikk3g9dnfdf = {
  response: XcmVersionedResponse;
  at: number;
};
export type XcmVersionedResponse = Enum<{
  V2: XcmV2Response;
  V3: XcmV3Response;
  V4: XcmV4Response;
}>;
export declare const XcmVersionedResponse: GetEnum<XcmVersionedResponse>;
export type XcmV2Response = Enum<{
  Null: undefined;
  Assets: Anonymize<I2sllmucln1iic>;
  ExecutionResult?: Anonymize<Ic6k45vtgiaa1s>;
  Version: number;
}>;
export declare const XcmV2Response: GetEnum<XcmV2Response>;
export type Ic6k45vtgiaa1s = Anonymize<Ifg18rrvb5cqli> | undefined;
export type Ifg18rrvb5cqli = [number, XcmV2TraitsError];
export type XcmV2TraitsError = Enum<{
  Overflow: undefined;
  Unimplemented: undefined;
  UntrustedReserveLocation: undefined;
  UntrustedTeleportLocation: undefined;
  MultiLocationFull: undefined;
  MultiLocationNotInvertible: undefined;
  BadOrigin: undefined;
  InvalidLocation: undefined;
  AssetNotFound: undefined;
  FailedToTransactAsset: undefined;
  NotWithdrawable: undefined;
  LocationCannotHold: undefined;
  ExceedsMaxMessageSize: undefined;
  DestinationUnsupported: undefined;
  Transport: undefined;
  Unroutable: undefined;
  UnknownClaim: undefined;
  FailedToDecode: undefined;
  MaxWeightInvalid: undefined;
  NotHoldingFees: undefined;
  TooExpensive: undefined;
  Trap: bigint;
  UnhandledXcmVersion: undefined;
  WeightLimitReached: bigint;
  Barrier: undefined;
  WeightNotComputable: undefined;
}>;
export declare const XcmV2TraitsError: GetEnum<XcmV2TraitsError>;
export type XcmV3Response = Enum<{
  Null: undefined;
  Assets: Anonymize<Iai6dhqiq3bach>;
  ExecutionResult?: Anonymize<I7sltvf8v2nure>;
  Version: number;
  PalletsInfo: Anonymize<I599u7h20b52at>;
  DispatchResult: XcmV3MaybeErrorCode;
}>;
export declare const XcmV3Response: GetEnum<XcmV3Response>;
export type Ic4qvh5df9s5gp = [number, XcmVersionedLocation];
export type I7vlvrrl2pnbgk = [bigint, Anonymize<I4q39t5hn830vp>, number];
export type I50sjs3s5lud21 = Array<Anonymize<I6vu59hrif6rva>>;
export type I6vu59hrif6rva = [XcmVersionedLocation, number];
export type XcmPalletVersionMigrationStage = Enum<{
  MigrateSupportedVersion: undefined;
  MigrateVersionNotifiers: undefined;
  NotifyCurrentTargets?: Anonymize<Iabpgqcjikia83>;
  MigrateAndNotifyOldTargets: undefined;
}>;
export declare const XcmPalletVersionMigrationStage: GetEnum<XcmPalletVersionMigrationStage>;
export type Iabpgqcjikia83 = Binary | undefined;
export type I50qp0ij7h62g2 = {
  amount: bigint;
  owner: XcmVersionedLocation;
  locker: XcmVersionedLocation;
  consumers: Anonymize<I2ia97v5nng96b>;
};
export type I2ia97v5nng96b = Array<Anonymize<I2a3me3o6q76s8>>;
export type I2a3me3o6q76s8 = [undefined, bigint];
export type Iteuj23is2ed5 = [number, SS58String, XcmVersionedAssetId];
export type XcmVersionedAssetId = Enum<{
  V3: XcmV3MultiassetAssetId;
  V4: Anonymize<I4c0s5cioidn76>;
}>;
export declare const XcmVersionedAssetId: GetEnum<XcmVersionedAssetId>;
export type I3rp19gb4dadaa = Array<Anonymize<I4arq5fbf241mq>>;
export type I4arq5fbf241mq = [bigint, XcmVersionedLocation];
export type I7f4alf2hnuu8s = {
  delivery_fee_factor: bigint;
  is_congested: boolean;
};
export type Idh2ug6ou4a8og = {
  begin: number;
  end: number;
  count: number;
  ready_neighbours?: Anonymize<Ignpjhsnd42fu>;
  message_count: bigint;
  size: bigint;
};
export type Ignpjhsnd42fu = Anonymize<I9d2uml1gs7v8> | undefined;
export type I9d2uml1gs7v8 = {
  prev: Anonymize<Iejeo53sea6n4q>;
  next: Anonymize<Iejeo53sea6n4q>;
};
export type I53esa2ms463bk = {
  remaining: number;
  remaining_size: number;
  first_index: number;
  first: number;
  last: number;
  heap: Binary;
};
export type Ib4jhb8tt3uung = [Anonymize<Iejeo53sea6n4q>, number];
export type Iag146hmjgqfgj = {
  when: Anonymize<Itvprrpb0nm3o>;
  deposit: bigint;
  depositor: SS58String;
  approvals: Anonymize<Ia2lhg7l2hilo3>;
};
export type I32or1mos65f9o = [Anonymize<I8r6bfjpbrc70c>, bigint];
export type I8r6bfjpbrc70c = Array<Anonymize<I5temii03lnchi>>;
export type I5temii03lnchi = {
  delegate: SS58String;
  proxy_type: Anonymize<I5ftepkjop3g1u>;
  delay: number;
};
export type I9p9lq3rej5bhc = [Anonymize<Ie1hjkhaoshr67>, bigint];
export type Ie1hjkhaoshr67 = Array<Anonymize<I70eqajm9p2sc5>>;
export type I70eqajm9p2sc5 = {
  real: SS58String;
  call_hash: FixedSizeBinary<32>;
  height: number;
};
export type I3qklfjubrljqh = {
  owner: SS58String;
  issuer: SS58String;
  admin: SS58String;
  freezer: SS58String;
  supply: bigint;
  deposit: bigint;
  min_balance: bigint;
  is_sufficient: boolean;
  accounts: number;
  sufficients: number;
  approvals: number;
  status: Anonymize<I3sd59779ndgs3>;
};
export type I3sd59779ndgs3 = AnonymousEnum<{
  Live: undefined;
  Frozen: undefined;
  Destroying: undefined;
}>;
export type Iag3f1hum3p4c8 = {
  balance: bigint;
  status: Anonymize<Icvjt1ogfma62c>;
  reason: Anonymize<Ia34prnt421tan>;
};
export type Icvjt1ogfma62c = AnonymousEnum<{
  Liquid: undefined;
  Frozen: undefined;
  Blocked: undefined;
}>;
export type Ia34prnt421tan = AnonymousEnum<{
  Consumer: undefined;
  Sufficient: undefined;
  DepositHeld: bigint;
  DepositRefunded: undefined;
  DepositFrom: Anonymize<I95l2k9b1re95f>;
}>;
export type I95l2k9b1re95f = [SS58String, bigint];
export type I7svnfko10tq2e = [number, SS58String];
export type I4s6jkha20aoh0 = {
  amount: bigint;
  deposit: bigint;
};
export type I2brm5b9jij1st = [number, SS58String, SS58String];
export type I78s05f59eoi8b = {
  deposit: bigint;
  name: Binary;
  symbol: Binary;
  decimals: number;
  is_frozen: boolean;
};
export type Ianufjuplcj6u4 = {
  owner: SS58String;
  issuer: SS58String;
  admin: SS58String;
  freezer: SS58String;
  total_deposit: bigint;
  free_holding: boolean;
  items: number;
  item_metadatas: number;
  attributes: number;
  is_frozen: boolean;
};
export type Id32h28hjj1tch = [SS58String, number, number];
export type I6ouflveob4eli = [SS58String, number];
export type I2mv9dvsaj3kcr = {
  owner: SS58String;
  approved?: Anonymize<Ihfphjolmsqq1>;
  is_frozen: boolean;
  deposit: bigint;
};
export type I7781vnk0rm9eq = {
  deposit: bigint;
  data: Binary;
  is_frozen: boolean;
};
export type Ie2iqtdb0stqo1 = [Binary, bigint];
export type I5irutptk105do = [number, Anonymize<I4arjljr6dpflb>, Binary];
export type Ic9nev69d8grv1 = [bigint, Anonymize<Ihfphjolmsqq1>];
export type I18m6a0sc4k7s9 = {
  owner: SS58String;
  owner_deposit: bigint;
  items: number;
  item_metadatas: number;
  item_configs: number;
  attributes: number;
};
export type Ic9iokm15iigt6 = {
  owner: SS58String;
  approvals: Anonymize<I4m61c4hi7qpuv>;
  deposit: Anonymize<Ic262ibdoec56a>;
};
export type I4m61c4hi7qpuv = Array<Anonymize<I2bebbvuje4ra8>>;
export type I2bebbvuje4ra8 = [SS58String, Anonymize<I4arjljr6dpflb>];
export type I35m96p3u4vl0p = {
  deposit: bigint;
  data: Binary;
};
export type Iapmji0h53pmkn = {
  deposit: Anonymize<I6e70ge7ubff75>;
  data: Binary;
};
export type I6e70ge7ubff75 = {
  account?: Anonymize<Ihfphjolmsqq1>;
  amount: bigint;
};
export type Idrr42svup341f = [Binary, Anonymize<I6e70ge7ubff75>];
export type I4ugih6gb4fmug = [
  number,
  Anonymize<I4arjljr6dpflb>,
  Anonymize<If3jjadhmug6qc>,
  Binary,
];
export type Idac0t49lnd4ls = {
  desired_collection: number;
  desired_item?: Anonymize<I4arjljr6dpflb>;
  price?: Anonymize<I6oogc1jbmmi81>;
  deadline: number;
};
export type I72ndo6phms8ik = {
  settings: bigint;
  max_supply?: Anonymize<I4arjljr6dpflb>;
  mint_settings: Anonymize<Ia3s8qquibn97v>;
};
export type Ia3s8qquibn97v = {
  mint_type: Anonymize<I41p72ko7duf22>;
  price?: Anonymize<I35p85j063s0il>;
  start_block?: Anonymize<I4arjljr6dpflb>;
  end_block?: Anonymize<I4arjljr6dpflb>;
  default_item_settings: bigint;
};
export type I41p72ko7duf22 = AnonymousEnum<{
  Issuer: undefined;
  Public: undefined;
  HolderOf: number;
}>;
export type I35p85j063s0il = bigint | undefined;
export type I7rv8d2nr55kkq = [Anonymize<I4c0s5cioidn76>, SS58String];
export type I6lh06el3bdfqq = [
  Anonymize<I4c0s5cioidn76>,
  SS58String,
  SS58String,
];
export type In7a38730s6qs = {
  base_block: Anonymize<I4q39t5hn830vp>;
  max_block: Anonymize<I4q39t5hn830vp>;
  per_class: Anonymize<I79te2qqsklnbd>;
};
export type I79te2qqsklnbd = {
  normal: Anonymize<Ia78ef0a3p5958>;
  operational: Anonymize<Ia78ef0a3p5958>;
  mandatory: Anonymize<Ia78ef0a3p5958>;
};
export type Ia78ef0a3p5958 = {
  base_extrinsic: Anonymize<I4q39t5hn830vp>;
  max_extrinsic?: Anonymize<Iasb8k6ash5mjn>;
  max_total?: Anonymize<Iasb8k6ash5mjn>;
  reserved?: Anonymize<Iasb8k6ash5mjn>;
};
export type Iasb8k6ash5mjn = Anonymize<I4q39t5hn830vp> | undefined;
export type If15el53dd76v9 = {
  normal: number;
  operational: number;
  mandatory: number;
};
export type I9s0ave7t0vnrk = {
  read: bigint;
  write: bigint;
};
export type Ic6nglu2db2c36 = {
  spec_name: string;
  impl_name: string;
  authoring_version: number;
  spec_version: number;
  impl_version: number;
  apis: Anonymize<Ic9hg6pp5pkea5>;
  transaction_version: number;
  state_version: number;
};
export type Ic9hg6pp5pkea5 = Array<Anonymize<I85u3mm1me217a>>;
export type I85u3mm1me217a = [FixedSizeBinary<8>, number];
export type Iekve0i6djpd9f = AnonymousEnum<{
  /**
   *Make some on-chain remark.
   *
   *Can be executed by every `origin`.
   */
  remark: Anonymize<I8ofcg5rbj0g2c>;
  /**
   *Set the number of pages in the WebAssembly environment's heap.
   */
  set_heap_pages: Anonymize<I4adgbll7gku4i>;
  /**
   *Set the new runtime code.
   */
  set_code: Anonymize<I6pjjpfvhvcfru>;
  /**
   *Set the new runtime code without doing any checks of the given `code`.
   *
   *Note that runtime upgrades will not run if this is called with a not-increasing spec
   *version!
   */
  set_code_without_checks: Anonymize<I6pjjpfvhvcfru>;
  /**
   *Set some items of storage.
   */
  set_storage: Anonymize<I9pj91mj79qekl>;
  /**
   *Kill some items from storage.
   */
  kill_storage: Anonymize<I39uah9nss64h9>;
  /**
   *Kill all storage items with a key that starts with the given prefix.
   *
   ***NOTE:** We rely on the Root origin to provide us the number of subkeys under
   *the prefix we are removing to accurately calculate the weight of this function.
   */
  kill_prefix: Anonymize<Ik64dknsq7k08>;
  /**
   *Make some on-chain remark and emit event.
   */
  remark_with_event: Anonymize<I8ofcg5rbj0g2c>;
  /**
   *Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
   *later.
   *
   *This call requires Root origin.
   */
  authorize_upgrade: Anonymize<Ib51vk42m1po4n>;
  /**
   *Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
   *later.
   *
   *WARNING: This authorizes an upgrade that will take place without any safety checks, for
   *example that the spec name remains the same and that the version number increases. Not
   *recommended for normal use. Use `authorize_upgrade` instead.
   *
   *This call requires Root origin.
   */
  authorize_upgrade_without_checks: Anonymize<Ib51vk42m1po4n>;
  /**
   *Provide the preimage (runtime binary) `code` for an upgrade that has been authorized.
   *
   *If the authorization required a version check, this call will ensure the spec name
   *remains unchanged and that the spec version has increased.
   *
   *Depending on the runtime's `OnSetCode` configuration, this function may directly apply
   *the new `code` in the same block or attempt to schedule the upgrade.
   *
   *All origins are allowed.
   */
  apply_authorized_upgrade: Anonymize<I6pjjpfvhvcfru>;
}>;
export type I8ofcg5rbj0g2c = {
  remark: Binary;
};
export type I4adgbll7gku4i = {
  pages: bigint;
};
export type I6pjjpfvhvcfru = {
  code: Binary;
};
export type I9pj91mj79qekl = {
  items: Anonymize<I6pi5ou8r1hblk>;
};
export type I6pi5ou8r1hblk = Array<Anonymize<Idkbvh6dahk1v7>>;
export type Idkbvh6dahk1v7 = FixedSizeArray<2, Binary>;
export type I39uah9nss64h9 = {
  keys: Anonymize<Itom7fk49o0c9>;
};
export type Ik64dknsq7k08 = {
  prefix: Binary;
  subkeys: number;
};
export type Ib51vk42m1po4n = {
  code_hash: FixedSizeBinary<32>;
};
export type I3jmip7qjlcqot = AnonymousEnum<{
  /**
   *Set the current validation data.
   *
   *This should be invoked exactly once per block. It will panic at the finalization
   *phase if the call was not invoked.
   *
   *The dispatch origin for this call must be `Inherent`
   *
   *As a side effect, this function upgrades the current validation function
   *if the appropriate time has come.
   */
  set_validation_data: Anonymize<I60v7bikk54tpu>;
  sudo_send_upward_message: Anonymize<Ifpj261e8s63m3>;
  /**
   *Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
   *later.
   *
   *The `check_version` parameter sets a boolean flag for whether or not the runtime's spec
   *version and name should be verified on upgrade. Since the authorization only has a hash,
   *it cannot actually perform the verification.
   *
   *This call requires Root origin.
   */
  authorize_upgrade: Anonymize<Ibgl04rn6nbfm6>;
  /**
   *Provide the preimage (runtime binary) `code` for an upgrade that has been authorized.
   *
   *If the authorization required a version check, this call will ensure the spec name
   *remains unchanged and that the spec version has increased.
   *
   *Note that this function will not apply the new `code`, but only attempt to schedule the
   *upgrade with the Relay Chain.
   *
   *All origins are allowed.
   */
  enact_authorized_upgrade: Anonymize<I6pjjpfvhvcfru>;
}>;
export type I60v7bikk54tpu = {
  data: Anonymize<I1c673c4up9l62>;
};
export type I1c673c4up9l62 = {
  validation_data: Anonymize<Ifn6q3equiq9qi>;
  relay_chain_state: Anonymize<Itom7fk49o0c9>;
  downward_messages: Anonymize<I6ljjd4b5fa4ov>;
  horizontal_messages: Anonymize<I2pf0b05mc7sdr>;
};
export type I6ljjd4b5fa4ov = Array<Anonymize<I60847k37jfcc6>>;
export type I60847k37jfcc6 = {
  sent_at: number;
  msg: Binary;
};
export type I2pf0b05mc7sdr = Array<Anonymize<I9hvej6h53dqj0>>;
export type I9hvej6h53dqj0 = [number, Anonymize<Iev3u09i2vqn93>];
export type Iev3u09i2vqn93 = Array<Anonymize<I409qo0sfkbh16>>;
export type I409qo0sfkbh16 = {
  sent_at: number;
  data: Binary;
};
export type Ifpj261e8s63m3 = {
  message: Binary;
};
export type I7d75gqfg6jh9c = AnonymousEnum<{
  /**
   *Set the current time.
   *
   *This call should be invoked exactly once per block. It will panic at the finalization
   *phase, if this call hasn't been invoked by that time.
   *
   *The timestamp should be greater than the previous one by the amount specified by
   *[`Config::MinimumPeriod`].
   *
   *The dispatch origin for this call must be _None_.
   *
   *This dispatch class is _Mandatory_ to ensure it gets executed in the block. Be aware
   *that changing the complexity of this call could result exhausting the resources in a
   *block to execute any other calls.
   *
   *## Complexity
   *- `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
   *- 1 storage read and 1 storage mutation (codec `O(1)` because of `DidUpdate::take` in
   *  `on_finalize`)
   *- 1 event handler `on_timestamp_set`. Must be `O(1)`.
   */
  set: Anonymize<Idcr6u6361oad9>;
}>;
export type Idcr6u6361oad9 = {
  now: bigint;
};
export type I9svldsp29mh87 = AnonymousEnum<{
  /**
   *Transfer some liquid free balance to another account.
   *
   *`transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
   *If the sender's account is below the existential deposit as a result
   *of the transfer, the account will be reaped.
   *
   *The dispatch origin for this call must be `Signed` by the transactor.
   */
  transfer_allow_death: Anonymize<I4ktuaksf5i1gk>;
  /**
   *Exactly as `transfer_allow_death`, except the origin must be root and the source account
   *may be specified.
   */
  force_transfer: Anonymize<I9bqtpv2ii35mp>;
  /**
   *Same as the [`transfer_allow_death`] call, but with a check that the transfer will not
   *kill the origin account.
   *
   *99% of the time you want [`transfer_allow_death`] instead.
   *
   *[`transfer_allow_death`]: struct.Pallet.html#method.transfer
   */
  transfer_keep_alive: Anonymize<I4ktuaksf5i1gk>;
  /**
   *Transfer the entire transferable balance from the caller account.
   *
   *NOTE: This function only attempts to transfer _transferable_ balances. This means that
   *any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
   *transferred by this function. To ensure that this function results in a killed account,
   *you might need to prepare the account by removing any reference counters, storage
   *deposits, etc...
   *
   *The dispatch origin of this call must be Signed.
   *
   *- `dest`: The recipient of the transfer.
   *- `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
   *  of the funds the account has, causing the sender account to be killed (false), or
   *  transfer everything except at least the existential deposit, which will guarantee to
   *  keep the sender account alive (true).
   */
  transfer_all: Anonymize<I9j7pagd6d4bda>;
  /**
   *Unreserve some balance from a user by force.
   *
   *Can only be called by ROOT.
   */
  force_unreserve: Anonymize<I2h9pmio37r7fb>;
  /**
   *Upgrade a specified account.
   *
   *- `origin`: Must be `Signed`.
   *- `who`: The account to be upgraded.
   *
   *This will waive the transaction fee if at least all but 10% of the accounts needed to
   *be upgraded. (We let some not have to be upgraded just in order to allow for the
   *possibility of churn).
   */
  upgrade_accounts: Anonymize<Ibmr18suc9ikh9>;
  /**
   *Set the regular balance of a given account.
   *
   *The dispatch origin for this call is `root`.
   */
  force_set_balance: Anonymize<I9iq22t0burs89>;
  /**
   *Adjust the total issuance in a saturating way.
   *
   *Can only be called by root and always needs a positive `delta`.
   *
   *# Example
   */
  force_adjust_total_issuance: Anonymize<I5u8olqbbvfnvf>;
  /**
   *Burn the specified liquid free balance from the origin account.
   *
   *If the origin's account ends up below the existential deposit as a result
   *of the burn and `keep_alive` is false, the account will be reaped.
   *
   *Unlike sending funds to a _burn_ address, which merely makes the funds inaccessible,
   *this `burn` operation will reduce total issuance by the amount _burned_.
   */
  burn: Anonymize<I5utcetro501ir>;
}>;
export type I4ktuaksf5i1gk = {
  dest: MultiAddress;
  value: bigint;
};
export type MultiAddress = Enum<{
  Id: SS58String;
  Index: undefined;
  Raw: Binary;
  Address32: FixedSizeBinary<32>;
  Address20: FixedSizeBinary<20>;
}>;
export declare const MultiAddress: GetEnum<MultiAddress>;
export type I9bqtpv2ii35mp = {
  source: MultiAddress;
  dest: MultiAddress;
  value: bigint;
};
export type I9j7pagd6d4bda = {
  dest: MultiAddress;
  keep_alive: boolean;
};
export type I2h9pmio37r7fb = {
  who: MultiAddress;
  amount: bigint;
};
export type Ibmr18suc9ikh9 = {
  who: Anonymize<Ia2lhg7l2hilo3>;
};
export type I9iq22t0burs89 = {
  who: MultiAddress;
  new_free: bigint;
};
export type I5u8olqbbvfnvf = {
  direction: BalancesAdjustmentDirection;
  delta: bigint;
};
export type BalancesAdjustmentDirection = Enum<{
  Increase: undefined;
  Decrease: undefined;
}>;
export declare const BalancesAdjustmentDirection: GetEnum<BalancesAdjustmentDirection>;
export type I5utcetro501ir = {
  value: bigint;
  keep_alive: boolean;
};
export type Icgf8vmtkbnu4u = AnonymousEnum<{
  /**
   *Unlock any vested funds of the sender account.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have funds still
   *locked under this pallet.
   *
   *Emits either `VestingCompleted` or `VestingUpdated`.
   *
   *## Complexity
   *- `O(1)`.
   */
  vest: undefined;
  /**
   *Unlock any vested funds of a `target` account.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `target`: The account whose vested funds should be unlocked. Must have funds still
   *locked under this pallet.
   *
   *Emits either `VestingCompleted` or `VestingUpdated`.
   *
   *## Complexity
   *- `O(1)`.
   */
  vest_other: Anonymize<Id9uqtigc0il3v>;
  /**
   *Create a vested transfer.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `target`: The account receiving the vested funds.
   *- `schedule`: The vesting schedule attached to the transfer.
   *
   *Emits `VestingCreated`.
   *
   *NOTE: This will unlock all schedules through the current block.
   *
   *## Complexity
   *- `O(1)`.
   */
  vested_transfer: Anonymize<Iaa2o6cgjdpdn5>;
  /**
   *Force a vested transfer.
   *
   *The dispatch origin for this call must be _Root_.
   *
   *- `source`: The account whose funds should be transferred.
   *- `target`: The account that should be transferred the vested funds.
   *- `schedule`: The vesting schedule attached to the transfer.
   *
   *Emits `VestingCreated`.
   *
   *NOTE: This will unlock all schedules through the current block.
   *
   *## Complexity
   *- `O(1)`.
   */
  force_vested_transfer: Anonymize<Iam6hrl7ptd85l>;
  /**
   *Merge two vesting schedules together, creating a new vesting schedule that unlocks over
   *the highest possible start and end blocks. If both schedules have already started the
   *current block will be used as the schedule start; with the caveat that if one schedule
   *is finished by the current block, the other will be treated as the new merged schedule,
   *unmodified.
   *
   *NOTE: If `schedule1_index == schedule2_index` this is a no-op.
   *NOTE: This will unlock all schedules through the current block prior to merging.
   *NOTE: If both schedules have ended by the current block, no new schedule will be created
   *and both will be removed.
   *
   *Merged schedule attributes:
   *- `starting_block`: `MAX(schedule1.starting_block, scheduled2.starting_block,
   *  current_block)`.
   *- `ending_block`: `MAX(schedule1.ending_block, schedule2.ending_block)`.
   *- `locked`: `schedule1.locked_at(current_block) + schedule2.locked_at(current_block)`.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `schedule1_index`: index of the first schedule to merge.
   *- `schedule2_index`: index of the second schedule to merge.
   */
  merge_schedules: Anonymize<Ict9ivhr2c5hv0>;
  /**
   *Force remove a vesting schedule
   *
   *The dispatch origin for this call must be _Root_.
   *
   *- `target`: An account that has a vesting schedule
   *- `schedule_index`: The vesting schedule index that should be removed
   */
  force_remove_vesting_schedule: Anonymize<I8t4vv03357lk9>;
}>;
export type Id9uqtigc0il3v = {
  target: MultiAddress;
};
export type Iaa2o6cgjdpdn5 = {
  target: MultiAddress;
  schedule: Anonymize<I4aro1m78pdrtt>;
};
export type Iam6hrl7ptd85l = {
  source: MultiAddress;
  target: MultiAddress;
  schedule: Anonymize<I4aro1m78pdrtt>;
};
export type Ict9ivhr2c5hv0 = {
  schedule1_index: number;
  schedule2_index: number;
};
export type I8t4vv03357lk9 = {
  target: MultiAddress;
  schedule_index: number;
};
export type I9dpq5287dur8b = AnonymousEnum<{
  /**
   *Set the list of invulnerable (fixed) collators. These collators must do some
   *preparation, namely to have registered session keys.
   *
   *The call will remove any accounts that have not registered keys from the set. That is,
   *it is non-atomic; the caller accepts all `AccountId`s passed in `new` _individually_ as
   *acceptable Invulnerables, and is not proposing a _set_ of new Invulnerables.
   *
   *This call does not maintain mutual exclusivity of `Invulnerables` and `Candidates`. It
   *is recommended to use a batch of `add_invulnerable` and `remove_invulnerable` instead. A
   *`batch_all` can also be used to enforce atomicity. If any candidates are included in
   *`new`, they should be removed with `remove_invulnerable_candidate` after execution.
   *
   *Must be called by the `UpdateOrigin`.
   */
  set_invulnerables: Anonymize<Ifccifqltb5obi>;
  /**
   *Set the ideal number of non-invulnerable collators. If lowering this number, then the
   *number of running collators could be higher than this figure. Aside from that edge case,
   *there should be no other way to have more candidates than the desired number.
   *
   *The origin for this call must be the `UpdateOrigin`.
   */
  set_desired_candidates: Anonymize<Iadtsfv699cq8b>;
  /**
   *Set the candidacy bond amount.
   *
   *If the candidacy bond is increased by this call, all current candidates which have a
   *deposit lower than the new bond will be kicked from the list and get their deposits
   *back.
   *
   *The origin for this call must be the `UpdateOrigin`.
   */
  set_candidacy_bond: Anonymize<Ialpmgmhr3gk5r>;
  /**
   *Register this account as a collator candidate. The account must (a) already have
   *registered session keys and (b) be able to reserve the `CandidacyBond`.
   *
   *This call is not available to `Invulnerable` collators.
   */
  register_as_candidate: undefined;
  /**
   *Deregister `origin` as a collator candidate. Note that the collator can only leave on
   *session change. The `CandidacyBond` will be unreserved immediately.
   *
   *This call will fail if the total number of candidates would drop below
   *`MinEligibleCollators`.
   */
  leave_intent: undefined;
  /**
   *Add a new account `who` to the list of `Invulnerables` collators. `who` must have
   *registered session keys. If `who` is a candidate, they will be removed.
   *
   *The origin for this call must be the `UpdateOrigin`.
   */
  add_invulnerable: Anonymize<I4cbvqmqadhrea>;
  /**
   *Remove an account `who` from the list of `Invulnerables` collators. `Invulnerables` must
   *be sorted.
   *
   *The origin for this call must be the `UpdateOrigin`.
   */
  remove_invulnerable: Anonymize<I4cbvqmqadhrea>;
  /**
   *Update the candidacy bond of collator candidate `origin` to a new amount `new_deposit`.
   *
   *Setting a `new_deposit` that is lower than the current deposit while `origin` is
   *occupying a top-`DesiredCandidates` slot is not allowed.
   *
   *This call will fail if `origin` is not a collator candidate, the updated bond is lower
   *than the minimum candidacy bond, and/or the amount cannot be reserved.
   */
  update_bond: Anonymize<I3sdol54kg5jaq>;
  /**
   *The caller `origin` replaces a candidate `target` in the collator candidate list by
   *reserving `deposit`. The amount `deposit` reserved by the caller must be greater than
   *the existing bond of the target it is trying to replace.
   *
   *This call will fail if the caller is already a collator candidate or invulnerable, the
   *caller does not have registered session keys, the target is not a collator candidate,
   *and/or the `deposit` amount cannot be reserved.
   */
  take_candidate_slot: Anonymize<I8fougodaj6di6>;
}>;
export type Ifccifqltb5obi = {
  new: Anonymize<Ia2lhg7l2hilo3>;
};
export type Iadtsfv699cq8b = {
  max: number;
};
export type Ialpmgmhr3gk5r = {
  bond: bigint;
};
export type I3sdol54kg5jaq = {
  new_deposit: bigint;
};
export type I8fougodaj6di6 = {
  deposit: bigint;
  target: SS58String;
};
export type I77dda7hps0u37 = AnonymousEnum<{
  /**
   *Sets the session key(s) of the function caller to `keys`.
   *Allows an account to set its session key prior to becoming a validator.
   *This doesn't take effect until the next session.
   *
   *The dispatch origin of this function must be signed.
   *
   *## Complexity
   *- `O(1)`. Actual cost depends on the number of length of `T::Keys::key_ids()` which is
   *  fixed.
   */
  set_keys: Anonymize<I81vt5eq60l4b6>;
  /**
   *Removes any session key(s) of the function caller.
   *
   *This doesn't take effect until the next session.
   *
   *The dispatch origin of this function must be Signed and the account must be either be
   *convertible to a validator ID using the chain's typical addressing system (this usually
   *means being a controller account) or directly convertible into a validator ID (which
   *usually means being a stash account).
   *
   *## Complexity
   *- `O(1)` in number of key types. Actual cost depends on the number of length of
   *  `T::Keys::key_ids()` which is fixed.
   */
  purge_keys: undefined;
}>;
export type I81vt5eq60l4b6 = {
  keys: FixedSizeBinary<32>;
  proof: Binary;
};
export type Ib7tahn20bvsep = AnonymousEnum<{
  /**
   *Suspends all XCM executions for the XCMP queue, regardless of the sender's origin.
   *
   *- `origin`: Must pass `ControllerOrigin`.
   */
  suspend_xcm_execution: undefined;
  /**
   *Resumes all XCM executions for the XCMP queue.
   *
   *Note that this function doesn't change the status of the in/out bound channels.
   *
   *- `origin`: Must pass `ControllerOrigin`.
   */
  resume_xcm_execution: undefined;
  /**
   *Overwrites the number of pages which must be in the queue for the other side to be
   *told to suspend their sending.
   *
   *- `origin`: Must pass `Root`.
   *- `new`: Desired value for `QueueConfigData.suspend_value`
   */
  update_suspend_threshold: Anonymize<I3vh014cqgmrfd>;
  /**
   *Overwrites the number of pages which must be in the queue after which we drop any
   *further messages from the channel.
   *
   *- `origin`: Must pass `Root`.
   *- `new`: Desired value for `QueueConfigData.drop_threshold`
   */
  update_drop_threshold: Anonymize<I3vh014cqgmrfd>;
  /**
   *Overwrites the number of pages which the queue must be reduced to before it signals
   *that message sending may recommence after it has been suspended.
   *
   *- `origin`: Must pass `Root`.
   *- `new`: Desired value for `QueueConfigData.resume_threshold`
   */
  update_resume_threshold: Anonymize<I3vh014cqgmrfd>;
}>;
export type I3vh014cqgmrfd = {
  new: number;
};
export type I9nbjvlrb9bp1g = AnonymousEnum<{
  send: Anonymize<I9paqujeb1fpv6>;
  /**
   *Teleport some assets from the local chain to some destination chain.
   *
   ***This function is deprecated: Use `limited_teleport_assets` instead.**
   *
   *Fee payment on the destination side is made from the asset in the `assets` vector of
   *index `fee_asset_item`. The weight limit for fees is not provided and thus is unlimited,
   *with all fees taken as needed from the asset.
   *
   *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
   *- `dest`: Destination context for the assets. Will typically be `[Parent,
   *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
   *  relay to parachain.
   *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
   *  generally be an `AccountId32` value.
   *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
   *  fee on the `dest` chain.
   *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
   *  fees.
   */
  teleport_assets: Anonymize<Iakevv83i18n4r>;
  /**
   *Transfer some assets from the local chain to the destination chain through their local,
   *destination or remote reserve.
   *
   *`assets` must have same reserve location and may not be teleportable to `dest`.
   * - `assets` have local reserve: transfer assets to sovereign account of destination
   *   chain and forward a notification XCM to `dest` to mint and deposit reserve-based
   *   assets to `beneficiary`.
   * - `assets` have destination reserve: burn local assets and forward a notification to
   *   `dest` chain to withdraw the reserve assets from this chain's sovereign account and
   *   deposit them to `beneficiary`.
   * - `assets` have remote reserve: burn local assets, forward XCM to reserve chain to move
   *   reserves from this chain's SA to `dest` chain's SA, and forward another XCM to `dest`
   *   to mint and deposit reserve-based assets to `beneficiary`.
   *
   ***This function is deprecated: Use `limited_reserve_transfer_assets` instead.**
   *
   *Fee payment on the destination side is made from the asset in the `assets` vector of
   *index `fee_asset_item`. The weight limit for fees is not provided and thus is unlimited,
   *with all fees taken as needed from the asset.
   *
   *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
   *- `dest`: Destination context for the assets. Will typically be `[Parent,
   *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
   *  relay to parachain.
   *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
   *  generally be an `AccountId32` value.
   *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
   *  fee on the `dest` (and possibly reserve) chains.
   *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
   *  fees.
   */
  reserve_transfer_assets: Anonymize<Iakevv83i18n4r>;
  /**
   *Execute an XCM message from a local, signed, origin.
   *
   *An event is deposited indicating whether `msg` could be executed completely or only
   *partially.
   *
   *No more than `max_weight` will be used in its attempted execution. If this is less than
   *the maximum amount of weight that the message could take to be executed, then no
   *execution attempt will be made.
   */
  execute: Anonymize<If2ssl12kcglhg>;
  /**
   *Extoll that a particular destination can be communicated with through a particular
   *version of XCM.
   *
   *- `origin`: Must be an origin specified by AdminOrigin.
   *- `location`: The destination that is being described.
   *- `xcm_version`: The latest version of XCM that `location` supports.
   */
  force_xcm_version: Anonymize<Iabk8ljl5g8c86>;
  /**
   *Set a safe XCM version (the version that XCM should be encoded with if the most recent
   *version a destination can accept is unknown).
   *
   *- `origin`: Must be an origin specified by AdminOrigin.
   *- `maybe_xcm_version`: The default XCM encoding version, or `None` to disable.
   */
  force_default_xcm_version: Anonymize<Ic76kfh5ebqkpl>;
  /**
   *Ask a location to notify us regarding their XCM version and any changes to it.
   *
   *- `origin`: Must be an origin specified by AdminOrigin.
   *- `location`: The location to which we should subscribe for XCM version notifications.
   */
  force_subscribe_version_notify: Anonymize<Icrujen33bbibf>;
  /**
   *Require that a particular destination should no longer notify us regarding any XCM
   *version changes.
   *
   *- `origin`: Must be an origin specified by AdminOrigin.
   *- `location`: The location to which we are currently subscribed for XCM version
   *  notifications which we no longer desire.
   */
  force_unsubscribe_version_notify: Anonymize<Icrujen33bbibf>;
  /**
   *Transfer some assets from the local chain to the destination chain through their local,
   *destination or remote reserve.
   *
   *`assets` must have same reserve location and may not be teleportable to `dest`.
   * - `assets` have local reserve: transfer assets to sovereign account of destination
   *   chain and forward a notification XCM to `dest` to mint and deposit reserve-based
   *   assets to `beneficiary`.
   * - `assets` have destination reserve: burn local assets and forward a notification to
   *   `dest` chain to withdraw the reserve assets from this chain's sovereign account and
   *   deposit them to `beneficiary`.
   * - `assets` have remote reserve: burn local assets, forward XCM to reserve chain to move
   *   reserves from this chain's SA to `dest` chain's SA, and forward another XCM to `dest`
   *   to mint and deposit reserve-based assets to `beneficiary`.
   *
   *Fee payment on the destination side is made from the asset in the `assets` vector of
   *index `fee_asset_item`, up to enough to pay for `weight_limit` of weight. If more weight
   *is needed than `weight_limit`, then the operation will fail and the sent assets may be
   *at risk.
   *
   *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
   *- `dest`: Destination context for the assets. Will typically be `[Parent,
   *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
   *  relay to parachain.
   *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
   *  generally be an `AccountId32` value.
   *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
   *  fee on the `dest` (and possibly reserve) chains.
   *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
   *  fees.
   *- `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
   */
  limited_reserve_transfer_assets: Anonymize<I5gi8h3e5lkbeq>;
  /**
   *Teleport some assets from the local chain to some destination chain.
   *
   *Fee payment on the destination side is made from the asset in the `assets` vector of
   *index `fee_asset_item`, up to enough to pay for `weight_limit` of weight. If more weight
   *is needed than `weight_limit`, then the operation will fail and the sent assets may be
   *at risk.
   *
   *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
   *- `dest`: Destination context for the assets. Will typically be `[Parent,
   *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
   *  relay to parachain.
   *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
   *  generally be an `AccountId32` value.
   *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
   *  fee on the `dest` chain.
   *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
   *  fees.
   *- `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
   */
  limited_teleport_assets: Anonymize<I5gi8h3e5lkbeq>;
  /**
   *Set or unset the global suspension state of the XCM executor.
   *
   *- `origin`: Must be an origin specified by AdminOrigin.
   *- `suspended`: `true` to suspend, `false` to resume.
   */
  force_suspension: Anonymize<Ibgm4rnf22lal1>;
  /**
   *Transfer some assets from the local chain to the destination chain through their local,
   *destination or remote reserve, or through teleports.
   *
   *Fee payment on the destination side is made from the asset in the `assets` vector of
   *index `fee_asset_item` (hence referred to as `fees`), up to enough to pay for
   *`weight_limit` of weight. If more weight is needed than `weight_limit`, then the
   *operation will fail and the sent assets may be at risk.
   *
   *`assets` (excluding `fees`) must have same reserve location or otherwise be teleportable
   *to `dest`, no limitations imposed on `fees`.
   * - for local reserve: transfer assets to sovereign account of destination chain and
   *   forward a notification XCM to `dest` to mint and deposit reserve-based assets to
   *   `beneficiary`.
   * - for destination reserve: burn local assets and forward a notification to `dest` chain
   *   to withdraw the reserve assets from this chain's sovereign account and deposit them
   *   to `beneficiary`.
   * - for remote reserve: burn local assets, forward XCM to reserve chain to move reserves
   *   from this chain's SA to `dest` chain's SA, and forward another XCM to `dest` to mint
   *   and deposit reserve-based assets to `beneficiary`.
   * - for teleports: burn local assets and forward XCM to `dest` chain to mint/teleport
   *   assets and deposit them to `beneficiary`.
   *
   *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
   *- `dest`: Destination context for the assets. Will typically be `X2(Parent,
   *  Parachain(..))` to send from parachain to parachain, or `X1(Parachain(..))` to send
   *  from relay to parachain.
   *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
   *  generally be an `AccountId32` value.
   *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
   *  fee on the `dest` (and possibly reserve) chains.
   *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
   *  fees.
   *- `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
   */
  transfer_assets: Anonymize<I5gi8h3e5lkbeq>;
  /**
   *Claims assets trapped on this pallet because of leftover assets during XCM execution.
   *
   *- `origin`: Anyone can call this extrinsic.
   *- `assets`: The exact assets that were trapped. Use the version to specify what version
   *was the latest when they were trapped.
   *- `beneficiary`: The location/account where the claimed assets will be deposited.
   */
  claim_assets: Anonymize<I8mmaab8je28oo>;
  /**
   *Transfer assets from the local chain to the destination chain using explicit transfer
   *types for assets and fees.
   *
   *`assets` must have same reserve location or may be teleportable to `dest`. Caller must
   *provide the `assets_transfer_type` to be used for `assets`:
   * - `TransferType::LocalReserve`: transfer assets to sovereign account of destination
   *   chain and forward a notification XCM to `dest` to mint and deposit reserve-based
   *   assets to `beneficiary`.
   * - `TransferType::DestinationReserve`: burn local assets and forward a notification to
   *   `dest` chain to withdraw the reserve assets from this chain's sovereign account and
   *   deposit them to `beneficiary`.
   * - `TransferType::RemoteReserve(reserve)`: burn local assets, forward XCM to `reserve`
   *   chain to move reserves from this chain's SA to `dest` chain's SA, and forward another
   *   XCM to `dest` to mint and deposit reserve-based assets to `beneficiary`. Typically
   *   the remote `reserve` is Asset Hub.
   * - `TransferType::Teleport`: burn local assets and forward XCM to `dest` chain to
   *   mint/teleport assets and deposit them to `beneficiary`.
   *
   *On the destination chain, as well as any intermediary hops, `BuyExecution` is used to
   *buy execution using transferred `assets` identified by `remote_fees_id`.
   *Make sure enough of the specified `remote_fees_id` asset is included in the given list
   *of `assets`. `remote_fees_id` should be enough to pay for `weight_limit`. If more weight
   *is needed than `weight_limit`, then the operation will fail and the sent assets may be
   *at risk.
   *
   *`remote_fees_id` may use different transfer type than rest of `assets` and can be
   *specified through `fees_transfer_type`.
   *
   *The caller needs to specify what should happen to the transferred assets once they reach
   *the `dest` chain. This is done through the `custom_xcm_on_dest` parameter, which
   *contains the instructions to execute on `dest` as a final step.
   *  This is usually as simple as:
   *  `Xcm(vec![DepositAsset { assets: Wild(AllCounted(assets.len())), beneficiary }])`,
   *  but could be something more exotic like sending the `assets` even further.
   *
   *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
   *- `dest`: Destination context for the assets. Will typically be `[Parent,
   *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
   *  relay to parachain, or `(parents: 2, (GlobalConsensus(..), ..))` to send from
   *  parachain across a bridge to another ecosystem destination.
   *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
   *  fee on the `dest` (and possibly reserve) chains.
   *- `assets_transfer_type`: The XCM `TransferType` used to transfer the `assets`.
   *- `remote_fees_id`: One of the included `assets` to be used to pay fees.
   *- `fees_transfer_type`: The XCM `TransferType` used to transfer the `fees` assets.
   *- `custom_xcm_on_dest`: The XCM to be executed on `dest` chain as the last step of the
   *  transfer, which also determines what happens to the assets on the destination chain.
   *- `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
   */
  transfer_assets_using_type_and_then: Anonymize<I6r0pr82pbiftt>;
}>;
export type I9paqujeb1fpv6 = {
  dest: XcmVersionedLocation;
  message: XcmVersionedXcm;
};
export type XcmVersionedXcm = Enum<{
  V2: Anonymize<Iemqgk0vect4v7>;
  V3: Anonymize<Ianvng4e08j9ii>;
  V4: Anonymize<Iegrepoo0c1jc5>;
}>;
export declare const XcmVersionedXcm: GetEnum<XcmVersionedXcm>;
export type Iemqgk0vect4v7 = Array<XcmV2Instruction>;
export type XcmV2Instruction = Enum<{
  WithdrawAsset: Anonymize<I2sllmucln1iic>;
  ReserveAssetDeposited: Anonymize<I2sllmucln1iic>;
  ReceiveTeleportedAsset: Anonymize<I2sllmucln1iic>;
  QueryResponse: Anonymize<I1n70k431nr92>;
  TransferAsset: Anonymize<I800n35601gllq>;
  TransferReserveAsset: Anonymize<I4ahfnfo1h39ng>;
  Transact: Anonymize<Icoi0hvjidego7>;
  HrmpNewChannelOpenRequest: Anonymize<I5uhhrjqfuo4e5>;
  HrmpChannelAccepted: Anonymize<Ifij4jam0o7sub>;
  HrmpChannelClosing: Anonymize<Ieeb4svd9i8fji>;
  ClearOrigin: undefined;
  DescendOrigin: XcmV2MultilocationJunctions;
  ReportError: Anonymize<I9ts0mtbeaq84a>;
  DepositAsset: Anonymize<Ias146869ruhho>;
  DepositReserveAsset: Anonymize<I1upba6ju0ujgo>;
  ExchangeAsset: Anonymize<Id2jloidb259tk>;
  InitiateReserveWithdraw: Anonymize<I4dks21gdu9pr2>;
  InitiateTeleport: Anonymize<I4mu8vn87cfdeb>;
  QueryHolding: Anonymize<Ib0pr3c4bd0b1s>;
  BuyExecution: Anonymize<Id8o97c8tt042k>;
  RefundSurplus: undefined;
  SetErrorHandler: Anonymize<Iemqgk0vect4v7>;
  SetAppendix: Anonymize<Iemqgk0vect4v7>;
  ClearError: undefined;
  ClaimAsset: Anonymize<I2i62b6lp2e74f>;
  Trap: bigint;
  SubscribeVersion: Anonymize<Ido2s48ntevurj>;
  UnsubscribeVersion: undefined;
}>;
export declare const XcmV2Instruction: GetEnum<XcmV2Instruction>;
export type I1n70k431nr92 = {
  query_id: bigint;
  response: XcmV2Response;
  max_weight: bigint;
};
export type I800n35601gllq = {
  assets: Anonymize<I2sllmucln1iic>;
  beneficiary: Anonymize<I4frqunb5hj2km>;
};
export type I4ahfnfo1h39ng = {
  assets: Anonymize<I2sllmucln1iic>;
  dest: Anonymize<I4frqunb5hj2km>;
  xcm: Anonymize<Iemqgk0vect4v7>;
};
export type Icoi0hvjidego7 = {
  origin_type: XcmV2OriginKind;
  require_weight_at_most: bigint;
  call: Binary;
};
export type I9ts0mtbeaq84a = {
  query_id: bigint;
  dest: Anonymize<I4frqunb5hj2km>;
  max_response_weight: bigint;
};
export type Ias146869ruhho = {
  assets: XcmV2MultiAssetFilter;
  max_assets: number;
  beneficiary: Anonymize<I4frqunb5hj2km>;
};
export type XcmV2MultiAssetFilter = Enum<{
  Definite: Anonymize<I2sllmucln1iic>;
  Wild: XcmV2MultiassetWildMultiAsset;
}>;
export declare const XcmV2MultiAssetFilter: GetEnum<XcmV2MultiAssetFilter>;
export type XcmV2MultiassetWildMultiAsset = Enum<{
  All: undefined;
  AllOf: Anonymize<I8ojnukqr6c3j6>;
}>;
export declare const XcmV2MultiassetWildMultiAsset: GetEnum<XcmV2MultiassetWildMultiAsset>;
export type I8ojnukqr6c3j6 = {
  id: XcmV2MultiassetAssetId;
  fun: XcmV2MultiassetWildFungibility;
};
export type I1upba6ju0ujgo = {
  assets: XcmV2MultiAssetFilter;
  max_assets: number;
  dest: Anonymize<I4frqunb5hj2km>;
  xcm: Anonymize<Iemqgk0vect4v7>;
};
export type Id2jloidb259tk = {
  give: XcmV2MultiAssetFilter;
  receive: Anonymize<I2sllmucln1iic>;
};
export type I4dks21gdu9pr2 = {
  assets: XcmV2MultiAssetFilter;
  reserve: Anonymize<I4frqunb5hj2km>;
  xcm: Anonymize<Iemqgk0vect4v7>;
};
export type I4mu8vn87cfdeb = {
  assets: XcmV2MultiAssetFilter;
  dest: Anonymize<I4frqunb5hj2km>;
  xcm: Anonymize<Iemqgk0vect4v7>;
};
export type Ib0pr3c4bd0b1s = {
  query_id: bigint;
  dest: Anonymize<I4frqunb5hj2km>;
  assets: XcmV2MultiAssetFilter;
  max_response_weight: bigint;
};
export type Id8o97c8tt042k = {
  fees: Anonymize<Id8h647t880l31>;
  weight_limit: XcmV2WeightLimit;
};
export type XcmV2WeightLimit = Enum<{
  Unlimited: undefined;
  Limited: bigint;
}>;
export declare const XcmV2WeightLimit: GetEnum<XcmV2WeightLimit>;
export type I2i62b6lp2e74f = {
  assets: Anonymize<I2sllmucln1iic>;
  ticket: Anonymize<I4frqunb5hj2km>;
};
export type Ido2s48ntevurj = {
  query_id: bigint;
  max_response_weight: bigint;
};
export type Ianvng4e08j9ii = Array<XcmV3Instruction>;
export type XcmV3Instruction = Enum<{
  WithdrawAsset: Anonymize<Iai6dhqiq3bach>;
  ReserveAssetDeposited: Anonymize<Iai6dhqiq3bach>;
  ReceiveTeleportedAsset: Anonymize<Iai6dhqiq3bach>;
  QueryResponse: Anonymize<I6g12ltekg2vaj>;
  TransferAsset: Anonymize<I8d6ni89sh0qmn>;
  TransferReserveAsset: Anonymize<Ib2euffogp56pp>;
  Transact: Anonymize<I92p6l5cs3fr50>;
  HrmpNewChannelOpenRequest: Anonymize<I5uhhrjqfuo4e5>;
  HrmpChannelAccepted: Anonymize<Ifij4jam0o7sub>;
  HrmpChannelClosing: Anonymize<Ieeb4svd9i8fji>;
  ClearOrigin: undefined;
  DescendOrigin: XcmV3Junctions;
  ReportError: Anonymize<I4r3v6e91d1qbs>;
  DepositAsset: Anonymize<Ia848euuv1lip6>;
  DepositReserveAsset: Anonymize<I3m8e0mi6lq6fj>;
  ExchangeAsset: Anonymize<Ich3d4125568vq>;
  InitiateReserveWithdraw: Anonymize<I3k3ia72gehj6b>;
  InitiateTeleport: Anonymize<I3m8e0mi6lq6fj>;
  ReportHolding: Anonymize<I4qgd1h8m3umqc>;
  BuyExecution: Anonymize<I9ff02md5rmeur>;
  RefundSurplus: undefined;
  SetErrorHandler: Anonymize<Ianvng4e08j9ii>;
  SetAppendix: Anonymize<Ianvng4e08j9ii>;
  ClearError: undefined;
  ClaimAsset: Anonymize<I8pu3j74el68mi>;
  Trap: bigint;
  SubscribeVersion: Anonymize<Ieprdqqu7ildvr>;
  UnsubscribeVersion: undefined;
  BurnAsset: Anonymize<Iai6dhqiq3bach>;
  ExpectAsset: Anonymize<Iai6dhqiq3bach>;
  ExpectOrigin?: Anonymize<Ia9cgf4r40b26h>;
  ExpectError?: Anonymize<I7sltvf8v2nure>;
  ExpectTransactStatus: XcmV3MaybeErrorCode;
  QueryPallet: Anonymize<Iba5bdbapp16oo>;
  ExpectPallet: Anonymize<Id7mf37dkpgfjs>;
  ReportTransactStatus: Anonymize<I4r3v6e91d1qbs>;
  ClearTransactStatus: undefined;
  UniversalOrigin: XcmV3Junction;
  ExportMessage: Anonymize<I8up5nu6gcp077>;
  LockAsset: Anonymize<I2ieo5vo1bi5a0>;
  UnlockAsset: Anonymize<I3u52dm5pikv6l>;
  NoteUnlockable: Anonymize<Idu2tro9aukpp8>;
  RequestUnlock: Anonymize<Iarqpt33435e7r>;
  SetFeesMode: Anonymize<I4nae9rsql8fa7>;
  SetTopic: FixedSizeBinary<32>;
  ClearTopic: undefined;
  AliasOrigin: Anonymize<I4c0s5cioidn76>;
  UnpaidExecution: Anonymize<I40d50jeai33oq>;
}>;
export declare const XcmV3Instruction: GetEnum<XcmV3Instruction>;
export type I6g12ltekg2vaj = {
  query_id: bigint;
  response: XcmV3Response;
  max_weight: Anonymize<I4q39t5hn830vp>;
  querier?: Anonymize<Ia9cgf4r40b26h>;
};
export type I8d6ni89sh0qmn = {
  assets: Anonymize<Iai6dhqiq3bach>;
  beneficiary: Anonymize<I4c0s5cioidn76>;
};
export type Ib2euffogp56pp = {
  assets: Anonymize<Iai6dhqiq3bach>;
  dest: Anonymize<I4c0s5cioidn76>;
  xcm: Anonymize<Ianvng4e08j9ii>;
};
export type Ia848euuv1lip6 = {
  assets: XcmV3MultiassetMultiAssetFilter;
  beneficiary: Anonymize<I4c0s5cioidn76>;
};
export type XcmV3MultiassetMultiAssetFilter = Enum<{
  Definite: Anonymize<Iai6dhqiq3bach>;
  Wild: XcmV3MultiassetWildMultiAsset;
}>;
export declare const XcmV3MultiassetMultiAssetFilter: GetEnum<XcmV3MultiassetMultiAssetFilter>;
export type XcmV3MultiassetWildMultiAsset = Enum<{
  All: undefined;
  AllOf: Anonymize<Iemi0m9547o42b>;
  AllCounted: number;
  AllOfCounted: Anonymize<I2ii8gjc2m1ca3>;
}>;
export declare const XcmV3MultiassetWildMultiAsset: GetEnum<XcmV3MultiassetWildMultiAsset>;
export type Iemi0m9547o42b = {
  id: XcmV3MultiassetAssetId;
  fun: XcmV2MultiassetWildFungibility;
};
export type I2ii8gjc2m1ca3 = {
  id: XcmV3MultiassetAssetId;
  fun: XcmV2MultiassetWildFungibility;
  count: number;
};
export type I3m8e0mi6lq6fj = {
  assets: XcmV3MultiassetMultiAssetFilter;
  dest: Anonymize<I4c0s5cioidn76>;
  xcm: Anonymize<Ianvng4e08j9ii>;
};
export type Ich3d4125568vq = {
  give: XcmV3MultiassetMultiAssetFilter;
  want: Anonymize<Iai6dhqiq3bach>;
  maximal: boolean;
};
export type I3k3ia72gehj6b = {
  assets: XcmV3MultiassetMultiAssetFilter;
  reserve: Anonymize<I4c0s5cioidn76>;
  xcm: Anonymize<Ianvng4e08j9ii>;
};
export type I4qgd1h8m3umqc = {
  response_info: Anonymize<I4r3v6e91d1qbs>;
  assets: XcmV3MultiassetMultiAssetFilter;
};
export type I9ff02md5rmeur = {
  fees: Anonymize<Idcm24504c8bkk>;
  weight_limit: XcmV3WeightLimit;
};
export type I8pu3j74el68mi = {
  assets: Anonymize<Iai6dhqiq3bach>;
  ticket: Anonymize<I4c0s5cioidn76>;
};
export type I8up5nu6gcp077 = {
  network: XcmV3JunctionNetworkId;
  destination: XcmV3Junctions;
  xcm: Anonymize<Ianvng4e08j9ii>;
};
export type I2ieo5vo1bi5a0 = {
  asset: Anonymize<Idcm24504c8bkk>;
  unlocker: Anonymize<I4c0s5cioidn76>;
};
export type I3u52dm5pikv6l = {
  asset: Anonymize<Idcm24504c8bkk>;
  target: Anonymize<I4c0s5cioidn76>;
};
export type Idu2tro9aukpp8 = {
  asset: Anonymize<Idcm24504c8bkk>;
  owner: Anonymize<I4c0s5cioidn76>;
};
export type Iarqpt33435e7r = {
  asset: Anonymize<Idcm24504c8bkk>;
  locker: Anonymize<I4c0s5cioidn76>;
};
export type Iakevv83i18n4r = {
  dest: XcmVersionedLocation;
  beneficiary: XcmVersionedLocation;
  assets: XcmVersionedAssets;
  fee_asset_item: number;
};
export type If2ssl12kcglhg = {
  message: XcmVersionedXcm;
  max_weight: Anonymize<I4q39t5hn830vp>;
};
export type Ic76kfh5ebqkpl = {
  maybe_xcm_version?: Anonymize<I4arjljr6dpflb>;
};
export type Icrujen33bbibf = {
  location: XcmVersionedLocation;
};
export type I5gi8h3e5lkbeq = {
  dest: XcmVersionedLocation;
  beneficiary: XcmVersionedLocation;
  assets: XcmVersionedAssets;
  fee_asset_item: number;
  weight_limit: XcmV3WeightLimit;
};
export type Ibgm4rnf22lal1 = {
  suspended: boolean;
};
export type I8mmaab8je28oo = {
  assets: XcmVersionedAssets;
  beneficiary: XcmVersionedLocation;
};
export type I6r0pr82pbiftt = {
  dest: XcmVersionedLocation;
  assets: XcmVersionedAssets;
  assets_transfer_type: Anonymize<Ifkg2rgjl54s88>;
  remote_fees_id: XcmVersionedAssetId;
  fees_transfer_type: Anonymize<Ifkg2rgjl54s88>;
  custom_xcm_on_dest: XcmVersionedXcm;
  weight_limit: XcmV3WeightLimit;
};
export type Ifkg2rgjl54s88 = AnonymousEnum<{
  Teleport: undefined;
  LocalReserve: undefined;
  DestinationReserve: undefined;
  RemoteReserve: XcmVersionedLocation;
}>;
export type I6epb28bkd5aqn = AnonymousEnum<{
  /**
   *Notification about congested bridge queue.
   */
  report_bridge_status: Anonymize<Idlampfle3vh6q>;
}>;
export type Idlampfle3vh6q = {
  bridge_id: FixedSizeBinary<32>;
  is_congested: boolean;
};
export type Ic2uoe7jdksosp = AnonymousEnum<{
  /**
   *Remove a page which has no more messages remaining to be processed or is stale.
   */
  reap_page: Anonymize<I40pqum1mu8qg3>;
  /**
   *Execute an overweight message.
   *
   *Temporary processing errors will be propagated whereas permanent errors are treated
   *as success condition.
   *
   *- `origin`: Must be `Signed`.
   *- `message_origin`: The origin from which the message to be executed arrived.
   *- `page`: The page in the queue in which the message to be executed is sitting.
   *- `index`: The index into the queue of the message to be executed.
   *- `weight_limit`: The maximum amount of weight allowed to be consumed in the execution
   *  of the message.
   *
   *Benchmark complexity considerations: O(index + weight_limit).
   */
  execute_overweight: Anonymize<I1r4c2ghbtvjuc>;
}>;
export type I40pqum1mu8qg3 = {
  message_origin: Anonymize<Iejeo53sea6n4q>;
  page_index: number;
};
export type I1r4c2ghbtvjuc = {
  message_origin: Anonymize<Iejeo53sea6n4q>;
  page: number;
  index: number;
  weight_limit: Anonymize<I4q39t5hn830vp>;
};
export type I8ikgojd2kp4nr = AnonymousEnum<{
  /**
   *Send a batch of dispatch calls.
   *
   *May be called from any origin except `None`.
   *
   *- `calls`: The calls to be dispatched from the same origin. The number of call must not
   *  exceed the constant: `batched_calls_limit` (available in constant metadata).
   *
   *If origin is root then the calls are dispatched without checking origin filter. (This
   *includes bypassing `frame_system::Config::BaseCallFilter`).
   *
   *## Complexity
   *- O(C) where C is the number of calls to be batched.
   *
   *This will return `Ok` in all circumstances. To determine the success of the batch, an
   *event is deposited. If a call failed and the batch was interrupted, then the
   *`BatchInterrupted` event is deposited, along with the number of successful calls made
   *and the error of the failed call. If all were successful, then the `BatchCompleted`
   *event is deposited.
   */
  batch: Anonymize<Ia6kc29epld8oe>;
  /**
   *Send a call through an indexed pseudonym of the sender.
   *
   *Filter from origin are passed along. The call will be dispatched with an origin which
   *use the same filter as the origin of this call.
   *
   *NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
   *because you expect `proxy` to have been used prior in the call stack and you do not want
   *the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
   *in the Multisig pallet instead.
   *
   *NOTE: Prior to version *12, this was called `as_limited_sub`.
   *
   *The dispatch origin for this call must be _Signed_.
   */
  as_derivative: Anonymize<Icjjfgkss9ab50>;
  /**
   *Send a batch of dispatch calls and atomically execute them.
   *The whole transaction will rollback and fail if any of the calls failed.
   *
   *May be called from any origin except `None`.
   *
   *- `calls`: The calls to be dispatched from the same origin. The number of call must not
   *  exceed the constant: `batched_calls_limit` (available in constant metadata).
   *
   *If origin is root then the calls are dispatched without checking origin filter. (This
   *includes bypassing `frame_system::Config::BaseCallFilter`).
   *
   *## Complexity
   *- O(C) where C is the number of calls to be batched.
   */
  batch_all: Anonymize<Ia6kc29epld8oe>;
  /**
   *Dispatches a function call with a provided origin.
   *
   *The dispatch origin for this call must be _Root_.
   *
   *## Complexity
   *- O(1).
   */
  dispatch_as: Anonymize<Ifabdf8qm932q0>;
  /**
   *Send a batch of dispatch calls.
   *Unlike `batch`, it allows errors and won't interrupt.
   *
   *May be called from any origin except `None`.
   *
   *- `calls`: The calls to be dispatched from the same origin. The number of call must not
   *  exceed the constant: `batched_calls_limit` (available in constant metadata).
   *
   *If origin is root then the calls are dispatch without checking origin filter. (This
   *includes bypassing `frame_system::Config::BaseCallFilter`).
   *
   *## Complexity
   *- O(C) where C is the number of calls to be batched.
   */
  force_batch: Anonymize<Ia6kc29epld8oe>;
  /**
   *Dispatch a function call with a specified weight.
   *
   *This function does not check the weight of the call, and instead allows the
   *Root origin to specify the weight of the call.
   *
   *The dispatch origin for this call must be _Root_.
   */
  with_weight: Anonymize<I4u9de6jls8otm>;
}>;
export type Ia6kc29epld8oe = {
  calls: Anonymize<Ifhubbh45t5b6a>;
};
export type Ifhubbh45t5b6a = Array<TxCallData>;
export type Icjjfgkss9ab50 = {
  index: number;
  call: TxCallData;
};
export type Ifabdf8qm932q0 = {
  as_origin: Anonymize<I48v5riethqckl>;
  call: TxCallData;
};
export type I48v5riethqckl = AnonymousEnum<{
  system: DispatchRawOrigin;
  PolkadotXcm: XcmPalletOrigin;
  CumulusXcm: Anonymize<I3in0d0lb61qi8>;
  Void: undefined;
}>;
export type DispatchRawOrigin = Enum<{
  Root: undefined;
  Signed: SS58String;
  None: undefined;
}>;
export declare const DispatchRawOrigin: GetEnum<DispatchRawOrigin>;
export type XcmPalletOrigin = Enum<{
  Xcm: Anonymize<I4c0s5cioidn76>;
  Response: Anonymize<I4c0s5cioidn76>;
}>;
export declare const XcmPalletOrigin: GetEnum<XcmPalletOrigin>;
export type I3in0d0lb61qi8 = AnonymousEnum<{
  Relay: undefined;
  SiblingParachain: number;
}>;
export type I4u9de6jls8otm = {
  call: TxCallData;
  weight: Anonymize<I4q39t5hn830vp>;
};
export type I2i3jnq078uco0 = AnonymousEnum<{
  /**
   *Immediately dispatch a multi-signature call using a single approval from the caller.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `other_signatories`: The accounts (other than the sender) who are part of the
   *multi-signature, but do not participate in the approval process.
   *- `call`: The call to be executed.
   *
   *Result is equivalent to the dispatched result.
   *
   *## Complexity
   *O(Z + C) where Z is the length of the call and C its execution weight.
   */
  as_multi_threshold_1: Anonymize<I9rge57146rvbl>;
  /**
   *Register approval for a dispatch to be made from a deterministic composite account if
   *approved by a total of `threshold - 1` of `other_signatories`.
   *
   *If there are enough, then dispatch the call.
   *
   *Payment: `DepositBase` will be reserved if this is the first approval, plus
   *`threshold` times `DepositFactor`. It is returned once this dispatch happens or
   *is cancelled.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `threshold`: The total number of approvals for this dispatch before it is executed.
   *- `other_signatories`: The accounts (other than the sender) who can approve this
   *dispatch. May not be empty.
   *- `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
   *not the first approval, then it must be `Some`, with the timepoint (block number and
   *transaction index) of the first approval transaction.
   *- `call`: The call to be executed.
   *
   *NOTE: Unless this is the final approval, you will generally want to use
   *`approve_as_multi` instead, since it only requires a hash of the call.
   *
   *Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
   *on success, result is `Ok` and the result from the interior call, if it was executed,
   *may be found in the deposited `MultisigExecuted` event.
   *
   *## Complexity
   *- `O(S + Z + Call)`.
   *- Up to one balance-reserve or unreserve operation.
   *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
   *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
   *- One call encode & hash, both of complexity `O(Z)` where `Z` is tx-len.
   *- One encode & hash, both of complexity `O(S)`.
   *- Up to one binary search and insert (`O(logS + S)`).
   *- I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
   *- One event.
   *- The weight of the `call`.
   *- Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
   *  taken for its lifetime of `DepositBase + threshold * DepositFactor`.
   */
  as_multi: Anonymize<Id5a43kc4r5p31>;
  /**
   *Register approval for a dispatch to be made from a deterministic composite account if
   *approved by a total of `threshold - 1` of `other_signatories`.
   *
   *Payment: `DepositBase` will be reserved if this is the first approval, plus
   *`threshold` times `DepositFactor`. It is returned once this dispatch happens or
   *is cancelled.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `threshold`: The total number of approvals for this dispatch before it is executed.
   *- `other_signatories`: The accounts (other than the sender) who can approve this
   *dispatch. May not be empty.
   *- `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
   *not the first approval, then it must be `Some`, with the timepoint (block number and
   *transaction index) of the first approval transaction.
   *- `call_hash`: The hash of the call to be executed.
   *
   *NOTE: If this is the final approval, you will want to use `as_multi` instead.
   *
   *## Complexity
   *- `O(S)`.
   *- Up to one balance-reserve or unreserve operation.
   *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
   *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
   *- One encode & hash, both of complexity `O(S)`.
   *- Up to one binary search and insert (`O(logS + S)`).
   *- I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
   *- One event.
   *- Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
   *  taken for its lifetime of `DepositBase + threshold * DepositFactor`.
   */
  approve_as_multi: Anonymize<Ideaemvoneh309>;
  /**
   *Cancel a pre-existing, on-going multisig transaction. Any deposit reserved previously
   *for this operation will be unreserved on success.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `threshold`: The total number of approvals for this dispatch before it is executed.
   *- `other_signatories`: The accounts (other than the sender) who can approve this
   *dispatch. May not be empty.
   *- `timepoint`: The timepoint (block number and transaction index) of the first approval
   *transaction for this dispatch.
   *- `call_hash`: The hash of the call to be executed.
   *
   *## Complexity
   *- `O(S)`.
   *- Up to one balance-reserve or unreserve operation.
   *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
   *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
   *- One encode & hash, both of complexity `O(S)`.
   *- One event.
   *- I/O: 1 read `O(S)`, one remove.
   *- Storage: removes one item.
   */
  cancel_as_multi: Anonymize<I3d9o9d7epp66v>;
}>;
export type I9rge57146rvbl = {
  other_signatories: Anonymize<Ia2lhg7l2hilo3>;
  call: TxCallData;
};
export type Id5a43kc4r5p31 = {
  threshold: number;
  other_signatories: Anonymize<Ia2lhg7l2hilo3>;
  maybe_timepoint?: Anonymize<I95jfd8j5cr5eh>;
  call: TxCallData;
  max_weight: Anonymize<I4q39t5hn830vp>;
};
export type I95jfd8j5cr5eh = Anonymize<Itvprrpb0nm3o> | undefined;
export type Ideaemvoneh309 = {
  threshold: number;
  other_signatories: Anonymize<Ia2lhg7l2hilo3>;
  maybe_timepoint?: Anonymize<I95jfd8j5cr5eh>;
  call_hash: FixedSizeBinary<32>;
  max_weight: Anonymize<I4q39t5hn830vp>;
};
export type I3d9o9d7epp66v = {
  threshold: number;
  other_signatories: Anonymize<Ia2lhg7l2hilo3>;
  timepoint: Anonymize<Itvprrpb0nm3o>;
  call_hash: FixedSizeBinary<32>;
};
export type I6qfut29tv8are = AnonymousEnum<{
  /**
   *Dispatch the given `call` from an account that the sender is authorised for through
   *`add_proxy`.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `real`: The account that the proxy will make a call on behalf of.
   *- `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
   *- `call`: The call to be made by the `real` account.
   */
  proxy: Anonymize<I3mbtn2eb315ar>;
  /**
   *Register a proxy account for the sender that is able to make calls on its behalf.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `proxy`: The account that the `caller` would like to make a proxy.
   *- `proxy_type`: The permissions allowed for this proxy account.
   *- `delay`: The announcement period required of the initial proxy. Will generally be
   *zero.
   */
  add_proxy: Anonymize<Iovrcu9bfelfq>;
  /**
   *Unregister a proxy account for the sender.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `proxy`: The account that the `caller` would like to remove as a proxy.
   *- `proxy_type`: The permissions currently enabled for the removed proxy account.
   */
  remove_proxy: Anonymize<Iovrcu9bfelfq>;
  /**
   *Unregister all proxy accounts for the sender.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *WARNING: This may be called on accounts created by `pure`, however if done, then
   *the unreserved fees will be inaccessible. **All access to this account will be lost.**
   */
  remove_proxies: undefined;
  /**
   *Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
   *initialize it with a proxy of `proxy_type` for `origin` sender.
   *
   *Requires a `Signed` origin.
   *
   *- `proxy_type`: The type of the proxy that the sender will be registered as over the
   *new account. This will almost always be the most permissive `ProxyType` possible to
   *allow for maximum flexibility.
   *- `index`: A disambiguation index, in case this is called multiple times in the same
   *transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
   *want to use `0`.
   *- `delay`: The announcement period required of the initial proxy. Will generally be
   *zero.
   *
   *Fails with `Duplicate` if this has already been called in this transaction, from the
   *same sender, with the same parameters.
   *
   *Fails if there are insufficient funds to pay for deposit.
   */
  create_pure: Anonymize<Iefr8jgtgfk8um>;
  /**
   *Removes a previously spawned pure proxy.
   *
   *WARNING: **All access to this account will be lost.** Any funds held in it will be
   *inaccessible.
   *
   *Requires a `Signed` origin, and the sender account must have been created by a call to
   *`pure` with corresponding parameters.
   *
   *- `spawner`: The account that originally called `pure` to create this account.
   *- `index`: The disambiguation index originally passed to `pure`. Probably `0`.
   *- `proxy_type`: The proxy type originally passed to `pure`.
   *- `height`: The height of the chain when the call to `pure` was processed.
   *- `ext_index`: The extrinsic index in which the call to `pure` was processed.
   *
   *Fails with `NoPermission` in case the caller is not a previously created pure
   *account whose `pure` call has corresponding parameters.
   */
  kill_pure: Anonymize<I3j05hul54uj7q>;
  /**
   *Publish the hash of a proxy-call that will be made in the future.
   *
   *This must be called some number of blocks before the corresponding `proxy` is attempted
   *if the delay associated with the proxy relationship is greater than zero.
   *
   *No more than `MaxPending` announcements may be made at any one time.
   *
   *This will take a deposit of `AnnouncementDepositFactor` as well as
   *`AnnouncementDepositBase` if there are no other pending announcements.
   *
   *The dispatch origin for this call must be _Signed_ and a proxy of `real`.
   *
   *Parameters:
   *- `real`: The account that the proxy will make a call on behalf of.
   *- `call_hash`: The hash of the call to be made by the `real` account.
   */
  announce: Anonymize<I2eb501t8s6hsq>;
  /**
   *Remove a given announcement.
   *
   *May be called by a proxy account to remove a call they previously announced and return
   *the deposit.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `real`: The account that the proxy will make a call on behalf of.
   *- `call_hash`: The hash of the call to be made by the `real` account.
   */
  remove_announcement: Anonymize<I2eb501t8s6hsq>;
  /**
   *Remove the given announcement of a delegate.
   *
   *May be called by a target (proxied) account to remove a call that one of their delegates
   *(`delegate`) has announced they want to execute. The deposit is returned.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `delegate`: The account that previously announced the call.
   *- `call_hash`: The hash of the call to be made.
   */
  reject_announcement: Anonymize<Ianmuoljk2sk1u>;
  /**
   *Dispatch the given `call` from an account that the sender is authorized for through
   *`add_proxy`.
   *
   *Removes any corresponding announcement(s).
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `real`: The account that the proxy will make a call on behalf of.
   *- `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
   *- `call`: The call to be made by the `real` account.
   */
  proxy_announced: Anonymize<Iem4jetr2c8nf8>;
}>;
export type I3mbtn2eb315ar = {
  real: MultiAddress;
  force_proxy_type?: Anonymize<I7rk1n3vg3et43>;
  call: TxCallData;
};
export type I7rk1n3vg3et43 = Anonymize<I5ftepkjop3g1u> | undefined;
export type Iovrcu9bfelfq = {
  delegate: MultiAddress;
  proxy_type: Anonymize<I5ftepkjop3g1u>;
  delay: number;
};
export type Iefr8jgtgfk8um = {
  proxy_type: Anonymize<I5ftepkjop3g1u>;
  delay: number;
  index: number;
};
export type I3j05hul54uj7q = {
  spawner: MultiAddress;
  proxy_type: Anonymize<I5ftepkjop3g1u>;
  index: number;
  height: number;
  ext_index: number;
};
export type I2eb501t8s6hsq = {
  real: MultiAddress;
  call_hash: FixedSizeBinary<32>;
};
export type Ianmuoljk2sk1u = {
  delegate: MultiAddress;
  call_hash: FixedSizeBinary<32>;
};
export type Iem4jetr2c8nf8 = {
  delegate: MultiAddress;
  real: MultiAddress;
  force_proxy_type?: Anonymize<I7rk1n3vg3et43>;
  call: TxCallData;
};
export type Ideusanoto4b1j = AnonymousEnum<{
  /**
   *Issue a new class of fungible assets from a public origin.
   *
   *This new asset class has no assets initially and its owner is the origin.
   *
   *The origin must conform to the configured `CreateOrigin` and have sufficient funds free.
   *
   *Funds of sender are reserved by `AssetDeposit`.
   *
   *Parameters:
   *- `id`: The identifier of the new asset. This must not be currently in use to identify
   *an existing asset. If [`NextAssetId`] is set, then this must be equal to it.
   *- `admin`: The admin of this class of assets. The admin is the initial address of each
   *member of the asset class's admin team.
   *- `min_balance`: The minimum balance of this new asset that any single account must
   *have. If an account's balance is reduced below this, then it collapses to zero.
   *
   *Emits `Created` event when successful.
   *
   *Weight: `O(1)`
   */
  create: Anonymize<Ic357tcepuvo5c>;
  /**
   *Issue a new class of fungible assets from a privileged origin.
   *
   *This new asset class has no assets initially.
   *
   *The origin must conform to `ForceOrigin`.
   *
   *Unlike `create`, no funds are reserved.
   *
   *- `id`: The identifier of the new asset. This must not be currently in use to identify
   *an existing asset. If [`NextAssetId`] is set, then this must be equal to it.
   *- `owner`: The owner of this class of assets. The owner has full superuser permissions
   *over this asset, but may later change and configure the permissions using
   *`transfer_ownership` and `set_team`.
   *- `min_balance`: The minimum balance of this new asset that any single account must
   *have. If an account's balance is reduced below this, then it collapses to zero.
   *
   *Emits `ForceCreated` event when successful.
   *
   *Weight: `O(1)`
   */
  force_create: Anonymize<I2rnoam876ruhj>;
  /**
   *Start the process of destroying a fungible asset class.
   *
   *`start_destroy` is the first in a series of extrinsics that should be called, to allow
   *destruction of an asset class.
   *
   *The origin must conform to `ForceOrigin` or must be `Signed` by the asset's `owner`.
   *
   *- `id`: The identifier of the asset to be destroyed. This must identify an existing
   *  asset.
   *
   *The asset class must be frozen before calling `start_destroy`.
   */
  start_destroy: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Destroy all accounts associated with a given asset.
   *
   *`destroy_accounts` should only be called after `start_destroy` has been called, and the
   *asset is in a `Destroying` state.
   *
   *Due to weight restrictions, this function may need to be called multiple times to fully
   *destroy all accounts. It will destroy `RemoveItemsLimit` accounts at a time.
   *
   *- `id`: The identifier of the asset to be destroyed. This must identify an existing
   *  asset.
   *
   *Each call emits the `Event::DestroyedAccounts` event.
   */
  destroy_accounts: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Destroy all approvals associated with a given asset up to the max (T::RemoveItemsLimit).
   *
   *`destroy_approvals` should only be called after `start_destroy` has been called, and the
   *asset is in a `Destroying` state.
   *
   *Due to weight restrictions, this function may need to be called multiple times to fully
   *destroy all approvals. It will destroy `RemoveItemsLimit` approvals at a time.
   *
   *- `id`: The identifier of the asset to be destroyed. This must identify an existing
   *  asset.
   *
   *Each call emits the `Event::DestroyedApprovals` event.
   */
  destroy_approvals: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Complete destroying asset and unreserve currency.
   *
   *`finish_destroy` should only be called after `start_destroy` has been called, and the
   *asset is in a `Destroying` state. All accounts or approvals should be destroyed before
   *hand.
   *
   *- `id`: The identifier of the asset to be destroyed. This must identify an existing
   *  asset.
   *
   *Each successful call emits the `Event::Destroyed` event.
   */
  finish_destroy: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Mint assets of a particular class.
   *
   *The origin must be Signed and the sender must be the Issuer of the asset `id`.
   *
   *- `id`: The identifier of the asset to have some amount minted.
   *- `beneficiary`: The account to be credited with the minted assets.
   *- `amount`: The amount of the asset to be minted.
   *
   *Emits `Issued` event when successful.
   *
   *Weight: `O(1)`
   *Modes: Pre-existing balance of `beneficiary`; Account pre-existence of `beneficiary`.
   */
  mint: Anonymize<Ib3qnc19gu633c>;
  /**
   *Reduce the balance of `who` by as much as possible up to `amount` assets of `id`.
   *
   *Origin must be Signed and the sender should be the Manager of the asset `id`.
   *
   *Bails with `NoAccount` if the `who` is already dead.
   *
   *- `id`: The identifier of the asset to have some amount burned.
   *- `who`: The account to be debited from.
   *- `amount`: The maximum amount by which `who`'s balance should be reduced.
   *
   *Emits `Burned` with the actual amount burned. If this takes the balance to below the
   *minimum for the asset, then the amount burned is increased to take it to zero.
   *
   *Weight: `O(1)`
   *Modes: Post-existence of `who`; Pre & post Zombie-status of `who`.
   */
  burn: Anonymize<Ifira6u9hi7cu1>;
  /**
   *Move some assets from the sender account to another.
   *
   *Origin must be Signed.
   *
   *- `id`: The identifier of the asset to have some amount transferred.
   *- `target`: The account to be credited.
   *- `amount`: The amount by which the sender's balance of assets should be reduced and
   *`target`'s balance increased. The amount actually transferred may be slightly greater in
   *the case that the transfer would otherwise take the sender balance above zero but below
   *the minimum balance. Must be greater than zero.
   *
   *Emits `Transferred` with the actual amount transferred. If this takes the source balance
   *to below the minimum for the asset, then the amount transferred is increased to take it
   *to zero.
   *
   *Weight: `O(1)`
   *Modes: Pre-existence of `target`; Post-existence of sender; Account pre-existence of
   *`target`.
   */
  transfer: Anonymize<I72tqocvdoqfff>;
  /**
   *Move some assets from the sender account to another, keeping the sender account alive.
   *
   *Origin must be Signed.
   *
   *- `id`: The identifier of the asset to have some amount transferred.
   *- `target`: The account to be credited.
   *- `amount`: The amount by which the sender's balance of assets should be reduced and
   *`target`'s balance increased. The amount actually transferred may be slightly greater in
   *the case that the transfer would otherwise take the sender balance above zero but below
   *the minimum balance. Must be greater than zero.
   *
   *Emits `Transferred` with the actual amount transferred. If this takes the source balance
   *to below the minimum for the asset, then the amount transferred is increased to take it
   *to zero.
   *
   *Weight: `O(1)`
   *Modes: Pre-existence of `target`; Post-existence of sender; Account pre-existence of
   *`target`.
   */
  transfer_keep_alive: Anonymize<I72tqocvdoqfff>;
  /**
   *Move some assets from one account to another.
   *
   *Origin must be Signed and the sender should be the Admin of the asset `id`.
   *
   *- `id`: The identifier of the asset to have some amount transferred.
   *- `source`: The account to be debited.
   *- `dest`: The account to be credited.
   *- `amount`: The amount by which the `source`'s balance of assets should be reduced and
   *`dest`'s balance increased. The amount actually transferred may be slightly greater in
   *the case that the transfer would otherwise take the `source` balance above zero but
   *below the minimum balance. Must be greater than zero.
   *
   *Emits `Transferred` with the actual amount transferred. If this takes the source balance
   *to below the minimum for the asset, then the amount transferred is increased to take it
   *to zero.
   *
   *Weight: `O(1)`
   *Modes: Pre-existence of `dest`; Post-existence of `source`; Account pre-existence of
   *`dest`.
   */
  force_transfer: Anonymize<I2i27f3sfmvc05>;
  /**
   *Disallow further unprivileged transfers of an asset `id` from an account `who`. `who`
   *must already exist as an entry in `Account`s of the asset. If you want to freeze an
   *account that does not have an entry, use `touch_other` first.
   *
   *Origin must be Signed and the sender should be the Freezer of the asset `id`.
   *
   *- `id`: The identifier of the asset to be frozen.
   *- `who`: The account to be frozen.
   *
   *Emits `Frozen`.
   *
   *Weight: `O(1)`
   */
  freeze: Anonymize<I1nlrtd1epki2d>;
  /**
   *Allow unprivileged transfers to and from an account again.
   *
   *Origin must be Signed and the sender should be the Admin of the asset `id`.
   *
   *- `id`: The identifier of the asset to be frozen.
   *- `who`: The account to be unfrozen.
   *
   *Emits `Thawed`.
   *
   *Weight: `O(1)`
   */
  thaw: Anonymize<I1nlrtd1epki2d>;
  /**
   *Disallow further unprivileged transfers for the asset class.
   *
   *Origin must be Signed and the sender should be the Freezer of the asset `id`.
   *
   *- `id`: The identifier of the asset to be frozen.
   *
   *Emits `Frozen`.
   *
   *Weight: `O(1)`
   */
  freeze_asset: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Allow unprivileged transfers for the asset again.
   *
   *Origin must be Signed and the sender should be the Admin of the asset `id`.
   *
   *- `id`: The identifier of the asset to be thawed.
   *
   *Emits `Thawed`.
   *
   *Weight: `O(1)`
   */
  thaw_asset: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Change the Owner of an asset.
   *
   *Origin must be Signed and the sender should be the Owner of the asset `id`.
   *
   *- `id`: The identifier of the asset.
   *- `owner`: The new Owner of this asset.
   *
   *Emits `OwnerChanged`.
   *
   *Weight: `O(1)`
   */
  transfer_ownership: Anonymize<I3abtumcmempjs>;
  /**
   *Change the Issuer, Admin and Freezer of an asset.
   *
   *Origin must be Signed and the sender should be the Owner of the asset `id`.
   *
   *- `id`: The identifier of the asset to be frozen.
   *- `issuer`: The new Issuer of this asset.
   *- `admin`: The new Admin of this asset.
   *- `freezer`: The new Freezer of this asset.
   *
   *Emits `TeamChanged`.
   *
   *Weight: `O(1)`
   */
  set_team: Anonymize<Id81m8flopt8ha>;
  /**
   *Set the metadata for an asset.
   *
   *Origin must be Signed and the sender should be the Owner of the asset `id`.
   *
   *Funds of sender are reserved according to the formula:
   *`MetadataDepositBase + MetadataDepositPerByte * (name.len + symbol.len)` taking into
   *account any already reserved funds.
   *
   *- `id`: The identifier of the asset to update.
   *- `name`: The user friendly name of this asset. Limited in length by `StringLimit`.
   *- `symbol`: The exchange symbol for this asset. Limited in length by `StringLimit`.
   *- `decimals`: The number of decimals this asset uses to represent one unit.
   *
   *Emits `MetadataSet`.
   *
   *Weight: `O(1)`
   */
  set_metadata: Anonymize<I8hff7chabggkd>;
  /**
   *Clear the metadata for an asset.
   *
   *Origin must be Signed and the sender should be the Owner of the asset `id`.
   *
   *Any deposit is freed for the asset owner.
   *
   *- `id`: The identifier of the asset to clear.
   *
   *Emits `MetadataCleared`.
   *
   *Weight: `O(1)`
   */
  clear_metadata: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Force the metadata for an asset to some value.
   *
   *Origin must be ForceOrigin.
   *
   *Any deposit is left alone.
   *
   *- `id`: The identifier of the asset to update.
   *- `name`: The user friendly name of this asset. Limited in length by `StringLimit`.
   *- `symbol`: The exchange symbol for this asset. Limited in length by `StringLimit`.
   *- `decimals`: The number of decimals this asset uses to represent one unit.
   *
   *Emits `MetadataSet`.
   *
   *Weight: `O(N + S)` where N and S are the length of the name and symbol respectively.
   */
  force_set_metadata: Anonymize<I49i39mtj1ivbs>;
  /**
   *Clear the metadata for an asset.
   *
   *Origin must be ForceOrigin.
   *
   *Any deposit is returned.
   *
   *- `id`: The identifier of the asset to clear.
   *
   *Emits `MetadataCleared`.
   *
   *Weight: `O(1)`
   */
  force_clear_metadata: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Alter the attributes of a given asset.
   *
   *Origin must be `ForceOrigin`.
   *
   *- `id`: The identifier of the asset.
   *- `owner`: The new Owner of this asset.
   *- `issuer`: The new Issuer of this asset.
   *- `admin`: The new Admin of this asset.
   *- `freezer`: The new Freezer of this asset.
   *- `min_balance`: The minimum balance of this new asset that any single account must
   *have. If an account's balance is reduced below this, then it collapses to zero.
   *- `is_sufficient`: Whether a non-zero balance of this asset is deposit of sufficient
   *value to account for the state bloat associated with its balance storage. If set to
   *`true`, then non-zero balances may be stored without a `consumer` reference (and thus
   *an ED in the Balances pallet or whatever else is used to control user-account state
   *growth).
   *- `is_frozen`: Whether this asset class is frozen except for permissioned/admin
   *instructions.
   *
   *Emits `AssetStatusChanged` with the identity of the asset.
   *
   *Weight: `O(1)`
   */
  force_asset_status: Anonymize<Ifkr2kcak2vto1>;
  /**
   *Approve an amount of asset for transfer by a delegated third-party account.
   *
   *Origin must be Signed.
   *
   *Ensures that `ApprovalDeposit` worth of `Currency` is reserved from signing account
   *for the purpose of holding the approval. If some non-zero amount of assets is already
   *approved from signing account to `delegate`, then it is topped up or unreserved to
   *meet the right value.
   *
   *NOTE: The signing account does not need to own `amount` of assets at the point of
   *making this call.
   *
   *- `id`: The identifier of the asset.
   *- `delegate`: The account to delegate permission to transfer asset.
   *- `amount`: The amount of asset that may be transferred by `delegate`. If there is
   *already an approval in place, then this acts additively.
   *
   *Emits `ApprovedTransfer` on success.
   *
   *Weight: `O(1)`
   */
  approve_transfer: Anonymize<I1ju6r8q0cs9jt>;
  /**
   *Cancel all of some asset approved for delegated transfer by a third-party account.
   *
   *Origin must be Signed and there must be an approval in place between signer and
   *`delegate`.
   *
   *Unreserves any deposit previously reserved by `approve_transfer` for the approval.
   *
   *- `id`: The identifier of the asset.
   *- `delegate`: The account delegated permission to transfer asset.
   *
   *Emits `ApprovalCancelled` on success.
   *
   *Weight: `O(1)`
   */
  cancel_approval: Anonymize<I4kpeq6j7cd5bu>;
  /**
   *Cancel all of some asset approved for delegated transfer by a third-party account.
   *
   *Origin must be either ForceOrigin or Signed origin with the signer being the Admin
   *account of the asset `id`.
   *
   *Unreserves any deposit previously reserved by `approve_transfer` for the approval.
   *
   *- `id`: The identifier of the asset.
   *- `delegate`: The account delegated permission to transfer asset.
   *
   *Emits `ApprovalCancelled` on success.
   *
   *Weight: `O(1)`
   */
  force_cancel_approval: Anonymize<I5na1ka76k6811>;
  /**
   *Transfer some asset balance from a previously delegated account to some third-party
   *account.
   *
   *Origin must be Signed and there must be an approval in place by the `owner` to the
   *signer.
   *
   *If the entire amount approved for transfer is transferred, then any deposit previously
   *reserved by `approve_transfer` is unreserved.
   *
   *- `id`: The identifier of the asset.
   *- `owner`: The account which previously approved for a transfer of at least `amount` and
   *from which the asset balance will be withdrawn.
   *- `destination`: The account to which the asset balance of `amount` will be transferred.
   *- `amount`: The amount of assets to transfer.
   *
   *Emits `TransferredApproved` on success.
   *
   *Weight: `O(1)`
   */
  transfer_approved: Anonymize<I59mhdb9omdqfa>;
  /**
   *Create an asset account for non-provider assets.
   *
   *A deposit will be taken from the signer account.
   *
   *- `origin`: Must be Signed; the signer account must have sufficient funds for a deposit
   *  to be taken.
   *- `id`: The identifier of the asset for the account to be created.
   *
   *Emits `Touched` event when successful.
   */
  touch: Anonymize<Ic5b47dj4coa3r>;
  /**
   *Return the deposit (if any) of an asset account or a consumer reference (if any) of an
   *account.
   *
   *The origin must be Signed.
   *
   *- `id`: The identifier of the asset for which the caller would like the deposit
   *  refunded.
   *- `allow_burn`: If `true` then assets may be destroyed in order to complete the refund.
   *
   *Emits `Refunded` event when successful.
   */
  refund: Anonymize<I9vl5kpk0fpakt>;
  /**
   *Sets the minimum balance of an asset.
   *
   *Only works if there aren't any accounts that are holding the asset or if
   *the new value of `min_balance` is less than the old one.
   *
   *Origin must be Signed and the sender has to be the Owner of the
   *asset `id`.
   *
   *- `id`: The identifier of the asset.
   *- `min_balance`: The new value of `min_balance`.
   *
   *Emits `AssetMinBalanceChanged` event when successful.
   */
  set_min_balance: Anonymize<I717jt61hu19b4>;
  /**
   *Create an asset account for `who`.
   *
   *A deposit will be taken from the signer account.
   *
   *- `origin`: Must be Signed by `Freezer` or `Admin` of the asset `id`; the signer account
   *  must have sufficient funds for a deposit to be taken.
   *- `id`: The identifier of the asset for the account to be created.
   *- `who`: The account to be created.
   *
   *Emits `Touched` event when successful.
   */
  touch_other: Anonymize<I1nlrtd1epki2d>;
  /**
   *Return the deposit (if any) of a target asset account. Useful if you are the depositor.
   *
   *The origin must be Signed and either the account owner, depositor, or asset `Admin`. In
   *order to burn a non-zero balance of the asset, the caller must be the account and should
   *use `refund`.
   *
   *- `id`: The identifier of the asset for the account holding a deposit.
   *- `who`: The account to refund.
   *
   *Emits `Refunded` event when successful.
   */
  refund_other: Anonymize<I1nlrtd1epki2d>;
  /**
   *Disallow further unprivileged transfers of an asset `id` to and from an account `who`.
   *
   *Origin must be Signed and the sender should be the Freezer of the asset `id`.
   *
   *- `id`: The identifier of the account's asset.
   *- `who`: The account to be unblocked.
   *
   *Emits `Blocked`.
   *
   *Weight: `O(1)`
   */
  block: Anonymize<I1nlrtd1epki2d>;
}>;
export type Ic357tcepuvo5c = {
  id: number;
  admin: MultiAddress;
  min_balance: bigint;
};
export type I2rnoam876ruhj = {
  id: number;
  owner: MultiAddress;
  is_sufficient: boolean;
  min_balance: bigint;
};
export type Ic5b47dj4coa3r = {
  id: number;
};
export type Ib3qnc19gu633c = {
  id: number;
  beneficiary: MultiAddress;
  amount: bigint;
};
export type Ifira6u9hi7cu1 = {
  id: number;
  who: MultiAddress;
  amount: bigint;
};
export type I72tqocvdoqfff = {
  id: number;
  target: MultiAddress;
  amount: bigint;
};
export type I2i27f3sfmvc05 = {
  id: number;
  source: MultiAddress;
  dest: MultiAddress;
  amount: bigint;
};
export type I1nlrtd1epki2d = {
  id: number;
  who: MultiAddress;
};
export type I3abtumcmempjs = {
  id: number;
  owner: MultiAddress;
};
export type Id81m8flopt8ha = {
  id: number;
  issuer: MultiAddress;
  admin: MultiAddress;
  freezer: MultiAddress;
};
export type I8hff7chabggkd = {
  id: number;
  name: Binary;
  symbol: Binary;
  decimals: number;
};
export type I49i39mtj1ivbs = {
  id: number;
  name: Binary;
  symbol: Binary;
  decimals: number;
  is_frozen: boolean;
};
export type Ifkr2kcak2vto1 = {
  id: number;
  owner: MultiAddress;
  issuer: MultiAddress;
  admin: MultiAddress;
  freezer: MultiAddress;
  min_balance: bigint;
  is_sufficient: boolean;
  is_frozen: boolean;
};
export type I1ju6r8q0cs9jt = {
  id: number;
  delegate: MultiAddress;
  amount: bigint;
};
export type I4kpeq6j7cd5bu = {
  id: number;
  delegate: MultiAddress;
};
export type I5na1ka76k6811 = {
  id: number;
  owner: MultiAddress;
  delegate: MultiAddress;
};
export type I59mhdb9omdqfa = {
  id: number;
  owner: MultiAddress;
  destination: MultiAddress;
  amount: bigint;
};
export type I9vl5kpk0fpakt = {
  id: number;
  allow_burn: boolean;
};
export type I717jt61hu19b4 = {
  id: number;
  min_balance: bigint;
};
export type Icu49uv7rfej74 = AnonymousEnum<{
  /**
   *Issue a new collection of non-fungible items from a public origin.
   *
   *This new collection has no items initially and its owner is the origin.
   *
   *The origin must conform to the configured `CreateOrigin` and have sufficient funds free.
   *
   *`ItemDeposit` funds of sender are reserved.
   *
   *Parameters:
   *- `collection`: The identifier of the new collection. This must not be currently in use.
   *- `admin`: The admin of this collection. The admin is the initial address of each
   *member of the collection's admin team.
   *
   *Emits `Created` event when successful.
   *
   *Weight: `O(1)`
   */
  create: Anonymize<If66ivi02f7256>;
  /**
   *Issue a new collection of non-fungible items from a privileged origin.
   *
   *This new collection has no items initially.
   *
   *The origin must conform to `ForceOrigin`.
   *
   *Unlike `create`, no funds are reserved.
   *
   *- `collection`: The identifier of the new item. This must not be currently in use.
   *- `owner`: The owner of this collection of items. The owner has full superuser
   *  permissions
   *over this item, but may later change and configure the permissions using
   *`transfer_ownership` and `set_team`.
   *
   *Emits `ForceCreated` event when successful.
   *
   *Weight: `O(1)`
   */
  force_create: Anonymize<I223jtcatlfkrc>;
  /**
   *Destroy a collection of fungible items.
   *
   *The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be the
   *owner of the `collection`.
   *
   *- `collection`: The identifier of the collection to be destroyed.
   *- `witness`: Information on the items minted in the collection. This must be
   *correct.
   *
   *Emits `Destroyed` event when successful.
   *
   *Weight: `O(n + m)` where:
   *- `n = witness.items`
   *- `m = witness.item_metadatas`
   *- `a = witness.attributes`
   */
  destroy: Anonymize<I223jg78mng8hq>;
  /**
   *Mint an item of a particular collection.
   *
   *The origin must be Signed and the sender must be the Issuer of the `collection`.
   *
   *- `collection`: The collection of the item to be minted.
   *- `item`: The item value of the item to be minted.
   *- `beneficiary`: The initial owner of the minted item.
   *
   *Emits `Issued` event when successful.
   *
   *Weight: `O(1)`
   */
  mint: Anonymize<I4iiuiftkpq3fd>;
  /**
   *Destroy a single item.
   *
   *Origin must be Signed and the signing account must be either:
   *- the Admin of the `collection`;
   *- the Owner of the `item`;
   *
   *- `collection`: The collection of the item to be burned.
   *- `item`: The item of the item to be burned.
   *- `check_owner`: If `Some` then the operation will fail with `WrongOwner` unless the
   *  item is owned by this value.
   *
   *Emits `Burned` with the actual amount burned.
   *
   *Weight: `O(1)`
   *Modes: `check_owner.is_some()`.
   */
  burn: Anonymize<Ibra6533h92c0a>;
  /**
   *Move an item from the sender account to another.
   *
   *This resets the approved account of the item.
   *
   *Origin must be Signed and the signing account must be either:
   *- the Admin of the `collection`;
   *- the Owner of the `item`;
   *- the approved delegate for the `item` (in this case, the approval is reset).
   *
   *Arguments:
   *- `collection`: The collection of the item to be transferred.
   *- `item`: The item of the item to be transferred.
   *- `dest`: The account to receive ownership of the item.
   *
   *Emits `Transferred`.
   *
   *Weight: `O(1)`
   */
  transfer: Anonymize<Ibgvkh96s68a66>;
  /**
   *Reevaluate the deposits on some items.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection to be frozen.
   *- `items`: The items of the collection whose deposits will be reevaluated.
   *
   *NOTE: This exists as a best-effort function. Any items which are unknown or
   *in the case that the owner account does not have reservable funds to pay for a
   *deposit increase are ignored. Generally the owner isn't going to call this on items
   *whose existing deposit is less than the refreshed deposit as it would only cost them,
   *so it's of little consequence.
   *
   *It will still return an error in the case that the collection is unknown of the signer
   *is not permitted to call it.
   *
   *Weight: `O(items.len())`
   */
  redeposit: Anonymize<If9vko7pv0231m>;
  /**
   *Disallow further unprivileged transfer of an item.
   *
   *Origin must be Signed and the sender should be the Freezer of the `collection`.
   *
   *- `collection`: The collection of the item to be frozen.
   *- `item`: The item of the item to be frozen.
   *
   *Emits `Frozen`.
   *
   *Weight: `O(1)`
   */
  freeze: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Re-allow unprivileged transfer of an item.
   *
   *Origin must be Signed and the sender should be the Freezer of the `collection`.
   *
   *- `collection`: The collection of the item to be thawed.
   *- `item`: The item of the item to be thawed.
   *
   *Emits `Thawed`.
   *
   *Weight: `O(1)`
   */
  thaw: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Disallow further unprivileged transfers for a whole collection.
   *
   *Origin must be Signed and the sender should be the Freezer of the `collection`.
   *
   *- `collection`: The collection to be frozen.
   *
   *Emits `CollectionFrozen`.
   *
   *Weight: `O(1)`
   */
  freeze_collection: Anonymize<I6cu7obfo0rr0o>;
  /**
   *Re-allow unprivileged transfers for a whole collection.
   *
   *Origin must be Signed and the sender should be the Admin of the `collection`.
   *
   *- `collection`: The collection to be thawed.
   *
   *Emits `CollectionThawed`.
   *
   *Weight: `O(1)`
   */
  thaw_collection: Anonymize<I6cu7obfo0rr0o>;
  /**
   *Change the Owner of a collection.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection whose owner should be changed.
   *- `owner`: The new Owner of this collection. They must have called
   *  `set_accept_ownership` with `collection` in order for this operation to succeed.
   *
   *Emits `OwnerChanged`.
   *
   *Weight: `O(1)`
   */
  transfer_ownership: Anonymize<I736lv5q9m5bot>;
  /**
   *Change the Issuer, Admin and Freezer of a collection.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection whose team should be changed.
   *- `issuer`: The new Issuer of this collection.
   *- `admin`: The new Admin of this collection.
   *- `freezer`: The new Freezer of this collection.
   *
   *Emits `TeamChanged`.
   *
   *Weight: `O(1)`
   */
  set_team: Anonymize<I1ap9tlenhr44l>;
  /**
   *Approve an item to be transferred by a delegated third-party account.
   *
   *The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be
   *either the owner of the `item` or the admin of the collection.
   *
   *- `collection`: The collection of the item to be approved for delegated transfer.
   *- `item`: The item of the item to be approved for delegated transfer.
   *- `delegate`: The account to delegate permission to transfer the item.
   *
   *Important NOTE: The `approved` account gets reset after each transfer.
   *
   *Emits `ApprovedTransfer` on success.
   *
   *Weight: `O(1)`
   */
  approve_transfer: Anonymize<Ib92t90p616grb>;
  /**
   *Cancel the prior approval for the transfer of an item by a delegate.
   *
   *Origin must be either:
   *- the `Force` origin;
   *- `Signed` with the signer being the Admin of the `collection`;
   *- `Signed` with the signer being the Owner of the `item`;
   *
   *Arguments:
   *- `collection`: The collection of the item of whose approval will be cancelled.
   *- `item`: The item of the item of whose approval will be cancelled.
   *- `maybe_check_delegate`: If `Some` will ensure that the given account is the one to
   *  which permission of transfer is delegated.
   *
   *Emits `ApprovalCancelled` on success.
   *
   *Weight: `O(1)`
   */
  cancel_approval: Anonymize<Ieipuujd6879do>;
  /**
   *Alter the attributes of a given item.
   *
   *Origin must be `ForceOrigin`.
   *
   *- `collection`: The identifier of the item.
   *- `owner`: The new Owner of this item.
   *- `issuer`: The new Issuer of this item.
   *- `admin`: The new Admin of this item.
   *- `freezer`: The new Freezer of this item.
   *- `free_holding`: Whether a deposit is taken for holding an item of this collection.
   *- `is_frozen`: Whether this collection is frozen except for permissioned/admin
   *instructions.
   *
   *Emits `ItemStatusChanged` with the identity of the item.
   *
   *Weight: `O(1)`
   */
  force_item_status: Anonymize<Ie56eq9sg1rsoc>;
  /**
   *Set an attribute for a collection or item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`collection`.
   *
   *If the origin is Signed, then funds of signer are reserved according to the formula:
   *`MetadataDepositBase + DepositPerByte * (key.len + value.len)` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the collection whose item's metadata to set.
   *- `maybe_item`: The identifier of the item whose metadata to set.
   *- `key`: The key of the attribute.
   *- `value`: The value to which to set the attribute.
   *
   *Emits `AttributeSet`.
   *
   *Weight: `O(1)`
   */
  set_attribute: Anonymize<I5tvvgui05tn6e>;
  /**
   *Clear an attribute for a collection or item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`collection`.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose item's metadata to clear.
   *- `maybe_item`: The identifier of the item whose metadata to clear.
   *- `key`: The key of the attribute.
   *
   *Emits `AttributeCleared`.
   *
   *Weight: `O(1)`
   */
  clear_attribute: Anonymize<Ibal0joadvdc2h>;
  /**
   *Set the metadata for an item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`collection`.
   *
   *If the origin is Signed, then funds of signer are reserved according to the formula:
   *`MetadataDepositBase + DepositPerByte * data.len` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the collection whose item's metadata to set.
   *- `item`: The identifier of the item whose metadata to set.
   *- `data`: The general information of this item. Limited in length by `StringLimit`.
   *- `is_frozen`: Whether the metadata should be frozen against further changes.
   *
   *Emits `MetadataSet`.
   *
   *Weight: `O(1)`
   */
  set_metadata: Anonymize<Iceq9fmmp9aeqv>;
  /**
   *Clear the metadata for an item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`item`.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose item's metadata to clear.
   *- `item`: The identifier of the item whose metadata to clear.
   *
   *Emits `MetadataCleared`.
   *
   *Weight: `O(1)`
   */
  clear_metadata: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Set the metadata for a collection.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
   *the `collection`.
   *
   *If the origin is `Signed`, then funds of signer are reserved according to the formula:
   *`MetadataDepositBase + DepositPerByte * data.len` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the item whose metadata to update.
   *- `data`: The general information of this item. Limited in length by `StringLimit`.
   *- `is_frozen`: Whether the metadata should be frozen against further changes.
   *
   *Emits `CollectionMetadataSet`.
   *
   *Weight: `O(1)`
   */
  set_collection_metadata: Anonymize<I9viqhmdtuof5e>;
  /**
   *Clear the metadata for a collection.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
   *the `collection`.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose metadata to clear.
   *
   *Emits `CollectionMetadataCleared`.
   *
   *Weight: `O(1)`
   */
  clear_collection_metadata: Anonymize<I6cu7obfo0rr0o>;
  /**
   *Set (or reset) the acceptance of ownership for a particular account.
   *
   *Origin must be `Signed` and if `maybe_collection` is `Some`, then the signer must have a
   *provider reference.
   *
   *- `maybe_collection`: The identifier of the collection whose ownership the signer is
   *  willing to accept, or if `None`, an indication that the signer is willing to accept no
   *  ownership transferal.
   *
   *Emits `OwnershipAcceptanceChanged`.
   */
  set_accept_ownership: Anonymize<Ibqooroq6rr5kr>;
  /**
   *Set the maximum amount of items a collection could have.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
   *the `collection`.
   *
   *Note: This function can only succeed once per collection.
   *
   *- `collection`: The identifier of the collection to change.
   *- `max_supply`: The maximum amount of items a collection could have.
   *
   *Emits `CollectionMaxSupplySet` event when successful.
   */
  set_collection_max_supply: Anonymize<I6h88h8vba22v8>;
  /**
   *Set (or reset) the price for an item.
   *
   *Origin must be Signed and must be the owner of the asset `item`.
   *
   *- `collection`: The collection of the item.
   *- `item`: The item to set the price for.
   *- `price`: The price for the item. Pass `None`, to reset the price.
   *- `buyer`: Restricts the buy operation to a specific account.
   *
   *Emits `ItemPriceSet` on success if the price is not `None`.
   *Emits `ItemPriceRemoved` on success if the price is `None`.
   */
  set_price: Anonymize<Ia9cd4jqb5eecb>;
  /**
   *Allows to buy an item if it's up for sale.
   *
   *Origin must be Signed and must not be the owner of the `item`.
   *
   *- `collection`: The collection of the item.
   *- `item`: The item the sender wants to buy.
   *- `bid_price`: The price the sender is willing to pay.
   *
   *Emits `ItemBought` on success.
   */
  buy_item: Anonymize<I19jiel1ftbcce>;
}>;
export type If66ivi02f7256 = {
  collection: number;
  admin: MultiAddress;
};
export type I223jtcatlfkrc = {
  collection: number;
  owner: MultiAddress;
  free_holding: boolean;
};
export type I223jg78mng8hq = {
  collection: number;
  witness: Anonymize<I59th026dnaruk>;
};
export type I59th026dnaruk = {
  items: number;
  item_metadatas: number;
  attributes: number;
};
export type I4iiuiftkpq3fd = {
  collection: number;
  item: number;
  owner: MultiAddress;
};
export type Ibra6533h92c0a = {
  collection: number;
  item: number;
  check_owner?: Anonymize<Ia0jlc0rcbskuk>;
};
export type Ia0jlc0rcbskuk = MultiAddress | undefined;
export type Ibgvkh96s68a66 = {
  collection: number;
  item: number;
  dest: MultiAddress;
};
export type If9vko7pv0231m = {
  collection: number;
  items: Anonymize<Icgljjb6j82uhn>;
};
export type I736lv5q9m5bot = {
  collection: number;
  new_owner: MultiAddress;
};
export type I1ap9tlenhr44l = {
  collection: number;
  issuer: MultiAddress;
  admin: MultiAddress;
  freezer: MultiAddress;
};
export type Ib92t90p616grb = {
  collection: number;
  item: number;
  delegate: MultiAddress;
};
export type Ieipuujd6879do = {
  collection: number;
  item: number;
  maybe_check_delegate?: Anonymize<Ia0jlc0rcbskuk>;
};
export type Ie56eq9sg1rsoc = {
  collection: number;
  owner: MultiAddress;
  issuer: MultiAddress;
  admin: MultiAddress;
  freezer: MultiAddress;
  free_holding: boolean;
  is_frozen: boolean;
};
export type Ibqooroq6rr5kr = {
  maybe_collection?: Anonymize<I4arjljr6dpflb>;
};
export type Ia9cd4jqb5eecb = {
  collection: number;
  item: number;
  price?: Anonymize<I35p85j063s0il>;
  whitelisted_buyer?: Anonymize<Ia0jlc0rcbskuk>;
};
export type I19jiel1ftbcce = {
  collection: number;
  item: number;
  bid_price: bigint;
};
export type I1k4il7i5elhc7 = AnonymousEnum<{
  /**
   *Issue a new collection of non-fungible items from a public origin.
   *
   *This new collection has no items initially and its owner is the origin.
   *
   *The origin must be Signed and the sender must have sufficient funds free.
   *
   *`CollectionDeposit` funds of sender are reserved.
   *
   *Parameters:
   *- `admin`: The admin of this collection. The admin is the initial address of each
   *member of the collection's admin team.
   *
   *Emits `Created` event when successful.
   *
   *Weight: `O(1)`
   */
  create: Anonymize<I43aobns89nbkh>;
  /**
   *Issue a new collection of non-fungible items from a privileged origin.
   *
   *This new collection has no items initially.
   *
   *The origin must conform to `ForceOrigin`.
   *
   *Unlike `create`, no funds are reserved.
   *
   *- `owner`: The owner of this collection of items. The owner has full superuser
   *  permissions over this item, but may later change and configure the permissions using
   *  `transfer_ownership` and `set_team`.
   *
   *Emits `ForceCreated` event when successful.
   *
   *Weight: `O(1)`
   */
  force_create: Anonymize<Iamd7rovec1hfb>;
  /**
   *Destroy a collection of fungible items.
   *
   *The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be the
   *owner of the `collection`.
   *
   *NOTE: The collection must have 0 items to be destroyed.
   *
   *- `collection`: The identifier of the collection to be destroyed.
   *- `witness`: Information on the items minted in the collection. This must be
   *correct.
   *
   *Emits `Destroyed` event when successful.
   *
   *Weight: `O(m + c + a)` where:
   *- `m = witness.item_metadatas`
   *- `c = witness.item_configs`
   *- `a = witness.attributes`
   */
  destroy: Anonymize<I77ie723ncd4co>;
  /**
   *Mint an item of a particular collection.
   *
   *The origin must be Signed and the sender must comply with the `mint_settings` rules.
   *
   *- `collection`: The collection of the item to be minted.
   *- `item`: An identifier of the new item.
   *- `mint_to`: Account into which the item will be minted.
   *- `witness_data`: When the mint type is `HolderOf(collection_id)`, then the owned
   *  item_id from that collection needs to be provided within the witness data object. If
   *  the mint price is set, then it should be additionally confirmed in the `witness_data`.
   *
   *Note: the deposit will be taken from the `origin` and not the `owner` of the `item`.
   *
   *Emits `Issued` event when successful.
   *
   *Weight: `O(1)`
   */
  mint: Anonymize<Ieebloeahma3ke>;
  /**
   *Mint an item of a particular collection from a privileged origin.
   *
   *The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be the
   *Issuer of the `collection`.
   *
   *- `collection`: The collection of the item to be minted.
   *- `item`: An identifier of the new item.
   *- `mint_to`: Account into which the item will be minted.
   *- `item_config`: A config of the new item.
   *
   *Emits `Issued` event when successful.
   *
   *Weight: `O(1)`
   */
  force_mint: Anonymize<I4mbtpf4pu3rec>;
  /**
   *Destroy a single item.
   *
   *The origin must conform to `ForceOrigin` or must be Signed and the signing account must
   *be the owner of the `item`.
   *
   *- `collection`: The collection of the item to be burned.
   *- `item`: The item to be burned.
   *
   *Emits `Burned`.
   *
   *Weight: `O(1)`
   */
  burn: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Move an item from the sender account to another.
   *
   *Origin must be Signed and the signing account must be either:
   *- the Owner of the `item`;
   *- the approved delegate for the `item` (in this case, the approval is reset).
   *
   *Arguments:
   *- `collection`: The collection of the item to be transferred.
   *- `item`: The item to be transferred.
   *- `dest`: The account to receive ownership of the item.
   *
   *Emits `Transferred`.
   *
   *Weight: `O(1)`
   */
  transfer: Anonymize<Ibgvkh96s68a66>;
  /**
   *Re-evaluate the deposits on some items.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection of the items to be reevaluated.
   *- `items`: The items of the collection whose deposits will be reevaluated.
   *
   *NOTE: This exists as a best-effort function. Any items which are unknown or
   *in the case that the owner account does not have reservable funds to pay for a
   *deposit increase are ignored. Generally the owner isn't going to call this on items
   *whose existing deposit is less than the refreshed deposit as it would only cost them,
   *so it's of little consequence.
   *
   *It will still return an error in the case that the collection is unknown or the signer
   *is not permitted to call it.
   *
   *Weight: `O(items.len())`
   */
  redeposit: Anonymize<If9vko7pv0231m>;
  /**
   *Disallow further unprivileged transfer of an item.
   *
   *Origin must be Signed and the sender should be the Freezer of the `collection`.
   *
   *- `collection`: The collection of the item to be changed.
   *- `item`: The item to become non-transferable.
   *
   *Emits `ItemTransferLocked`.
   *
   *Weight: `O(1)`
   */
  lock_item_transfer: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Re-allow unprivileged transfer of an item.
   *
   *Origin must be Signed and the sender should be the Freezer of the `collection`.
   *
   *- `collection`: The collection of the item to be changed.
   *- `item`: The item to become transferable.
   *
   *Emits `ItemTransferUnlocked`.
   *
   *Weight: `O(1)`
   */
  unlock_item_transfer: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Disallows specified settings for the whole collection.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection to be locked.
   *- `lock_settings`: The settings to be locked.
   *
   *Note: it's possible to only lock(set) the setting, but not to unset it.
   *
   *Emits `CollectionLocked`.
   *
   *Weight: `O(1)`
   */
  lock_collection: Anonymize<I1ahf3pvgsgbu>;
  /**
   *Change the Owner of a collection.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection whose owner should be changed.
   *- `owner`: The new Owner of this collection. They must have called
   *  `set_accept_ownership` with `collection` in order for this operation to succeed.
   *
   *Emits `OwnerChanged`.
   *
   *Weight: `O(1)`
   */
  transfer_ownership: Anonymize<I736lv5q9m5bot>;
  /**
   *Change the Issuer, Admin and Freezer of a collection.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`collection`.
   *
   *Note: by setting the role to `None` only the `ForceOrigin` will be able to change it
   *after to `Some(account)`.
   *
   *- `collection`: The collection whose team should be changed.
   *- `issuer`: The new Issuer of this collection.
   *- `admin`: The new Admin of this collection.
   *- `freezer`: The new Freezer of this collection.
   *
   *Emits `TeamChanged`.
   *
   *Weight: `O(1)`
   */
  set_team: Anonymize<I9uapdn16emsti>;
  /**
   *Change the Owner of a collection.
   *
   *Origin must be `ForceOrigin`.
   *
   *- `collection`: The identifier of the collection.
   *- `owner`: The new Owner of this collection.
   *
   *Emits `OwnerChanged`.
   *
   *Weight: `O(1)`
   */
  force_collection_owner: Anonymize<Ie5i0q2glmr0md>;
  /**
   *Change the config of a collection.
   *
   *Origin must be `ForceOrigin`.
   *
   *- `collection`: The identifier of the collection.
   *- `config`: The new config of this collection.
   *
   *Emits `CollectionConfigChanged`.
   *
   *Weight: `O(1)`
   */
  force_collection_config: Anonymize<I97qcg6i3l8gee>;
  /**
   *Approve an item to be transferred by a delegated third-party account.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`item`.
   *
   *- `collection`: The collection of the item to be approved for delegated transfer.
   *- `item`: The item to be approved for delegated transfer.
   *- `delegate`: The account to delegate permission to transfer the item.
   *- `maybe_deadline`: Optional deadline for the approval. Specified by providing the
   *	number of blocks after which the approval will expire
   *
   *Emits `TransferApproved` on success.
   *
   *Weight: `O(1)`
   */
  approve_transfer: Anonymize<Ib5udrahak005b>;
  /**
   *Cancel one of the transfer approvals for a specific item.
   *
   *Origin must be either:
   *- the `Force` origin;
   *- `Signed` with the signer being the Owner of the `item`;
   *
   *Arguments:
   *- `collection`: The collection of the item of whose approval will be cancelled.
   *- `item`: The item of the collection of whose approval will be cancelled.
   *- `delegate`: The account that is going to loose their approval.
   *
   *Emits `ApprovalCancelled` on success.
   *
   *Weight: `O(1)`
   */
  cancel_approval: Anonymize<Ib92t90p616grb>;
  /**
   *Cancel all the approvals of a specific item.
   *
   *Origin must be either:
   *- the `Force` origin;
   *- `Signed` with the signer being the Owner of the `item`;
   *
   *Arguments:
   *- `collection`: The collection of the item of whose approvals will be cleared.
   *- `item`: The item of the collection of whose approvals will be cleared.
   *
   *Emits `AllApprovalsCancelled` on success.
   *
   *Weight: `O(1)`
   */
  clear_all_transfer_approvals: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Disallows changing the metadata or attributes of the item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Admin
   *of the `collection`.
   *
   *- `collection`: The collection if the `item`.
   *- `item`: An item to be locked.
   *- `lock_metadata`: Specifies whether the metadata should be locked.
   *- `lock_attributes`: Specifies whether the attributes in the `CollectionOwner` namespace
   *  should be locked.
   *
   *Note: `lock_attributes` affects the attributes in the `CollectionOwner` namespace only.
   *When the metadata or attributes are locked, it won't be possible the unlock them.
   *
   *Emits `ItemPropertiesLocked`.
   *
   *Weight: `O(1)`
   */
  lock_item_properties: Anonymize<I1jj31tn29ie3c>;
  /**
   *Set an attribute for a collection or item.
   *
   *Origin must be Signed and must conform to the namespace ruleset:
   *- `CollectionOwner` namespace could be modified by the `collection` Admin only;
   *- `ItemOwner` namespace could be modified by the `maybe_item` owner only. `maybe_item`
   *  should be set in that case;
   *- `Account(AccountId)` namespace could be modified only when the `origin` was given a
   *  permission to do so;
   *
   *The funds of `origin` are reserved according to the formula:
   *`AttributeDepositBase + DepositPerByte * (key.len + value.len)` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the collection whose item's metadata to set.
   *- `maybe_item`: The identifier of the item whose metadata to set.
   *- `namespace`: Attribute's namespace.
   *- `key`: The key of the attribute.
   *- `value`: The value to which to set the attribute.
   *
   *Emits `AttributeSet`.
   *
   *Weight: `O(1)`
   */
  set_attribute: Anonymize<I5llu6o6a0go5i>;
  /**
   *Force-set an attribute for a collection or item.
   *
   *Origin must be `ForceOrigin`.
   *
   *If the attribute already exists and it was set by another account, the deposit
   *will be returned to the previous owner.
   *
   *- `set_as`: An optional owner of the attribute.
   *- `collection`: The identifier of the collection whose item's metadata to set.
   *- `maybe_item`: The identifier of the item whose metadata to set.
   *- `namespace`: Attribute's namespace.
   *- `key`: The key of the attribute.
   *- `value`: The value to which to set the attribute.
   *
   *Emits `AttributeSet`.
   *
   *Weight: `O(1)`
   */
  force_set_attribute: Anonymize<Ic8b8561e6t9ie>;
  /**
   *Clear an attribute for a collection or item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *attribute.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose item's metadata to clear.
   *- `maybe_item`: The identifier of the item whose metadata to clear.
   *- `namespace`: Attribute's namespace.
   *- `key`: The key of the attribute.
   *
   *Emits `AttributeCleared`.
   *
   *Weight: `O(1)`
   */
  clear_attribute: Anonymize<I93r2effh7od84>;
  /**
   *Approve item's attributes to be changed by a delegated third-party account.
   *
   *Origin must be Signed and must be an owner of the `item`.
   *
   *- `collection`: A collection of the item.
   *- `item`: The item that holds attributes.
   *- `delegate`: The account to delegate permission to change attributes of the item.
   *
   *Emits `ItemAttributesApprovalAdded` on success.
   */
  approve_item_attributes: Anonymize<Ib92t90p616grb>;
  /**
   *Cancel the previously provided approval to change item's attributes.
   *All the previously set attributes by the `delegate` will be removed.
   *
   *Origin must be Signed and must be an owner of the `item`.
   *
   *- `collection`: Collection that the item is contained within.
   *- `item`: The item that holds attributes.
   *- `delegate`: The previously approved account to remove.
   *
   *Emits `ItemAttributesApprovalRemoved` on success.
   */
  cancel_item_attributes_approval: Anonymize<I6afd7fllr8otc>;
  /**
   *Set the metadata for an item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Admin of the
   *`collection`.
   *
   *If the origin is Signed, then funds of signer are reserved according to the formula:
   *`MetadataDepositBase + DepositPerByte * data.len` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the collection whose item's metadata to set.
   *- `item`: The identifier of the item whose metadata to set.
   *- `data`: The general information of this item. Limited in length by `StringLimit`.
   *
   *Emits `ItemMetadataSet`.
   *
   *Weight: `O(1)`
   */
  set_metadata: Anonymize<Icrkms46uh8tpb>;
  /**
   *Clear the metadata for an item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Admin of the
   *`collection`.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose item's metadata to clear.
   *- `item`: The identifier of the item whose metadata to clear.
   *
   *Emits `ItemMetadataCleared`.
   *
   *Weight: `O(1)`
   */
  clear_metadata: Anonymize<Iafkqus0ohh6l6>;
  /**
   *Set the metadata for a collection.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Admin of
   *the `collection`.
   *
   *If the origin is `Signed`, then funds of signer are reserved according to the formula:
   *`MetadataDepositBase + DepositPerByte * data.len` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the item whose metadata to update.
   *- `data`: The general information of this item. Limited in length by `StringLimit`.
   *
   *Emits `CollectionMetadataSet`.
   *
   *Weight: `O(1)`
   */
  set_collection_metadata: Anonymize<I78u60nqh0etah>;
  /**
   *Clear the metadata for a collection.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Admin of
   *the `collection`.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose metadata to clear.
   *
   *Emits `CollectionMetadataCleared`.
   *
   *Weight: `O(1)`
   */
  clear_collection_metadata: Anonymize<I6cu7obfo0rr0o>;
  /**
   *Set (or reset) the acceptance of ownership for a particular account.
   *
   *Origin must be `Signed` and if `maybe_collection` is `Some`, then the signer must have a
   *provider reference.
   *
   *- `maybe_collection`: The identifier of the collection whose ownership the signer is
   *  willing to accept, or if `None`, an indication that the signer is willing to accept no
   *  ownership transferal.
   *
   *Emits `OwnershipAcceptanceChanged`.
   */
  set_accept_ownership: Anonymize<Ibqooroq6rr5kr>;
  /**
   *Set the maximum number of items a collection could have.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
   *the `collection`.
   *
   *- `collection`: The identifier of the collection to change.
   *- `max_supply`: The maximum number of items a collection could have.
   *
   *Emits `CollectionMaxSupplySet` event when successful.
   */
  set_collection_max_supply: Anonymize<I6h88h8vba22v8>;
  /**
   *Update mint settings.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Issuer
   *of the `collection`.
   *
   *- `collection`: The identifier of the collection to change.
   *- `mint_settings`: The new mint settings.
   *
   *Emits `CollectionMintSettingsUpdated` event when successful.
   */
  update_mint_settings: Anonymize<I1lso3vlgherue>;
  /**
   *Set (or reset) the price for an item.
   *
   *Origin must be Signed and must be the owner of the `item`.
   *
   *- `collection`: The collection of the item.
   *- `item`: The item to set the price for.
   *- `price`: The price for the item. Pass `None`, to reset the price.
   *- `buyer`: Restricts the buy operation to a specific account.
   *
   *Emits `ItemPriceSet` on success if the price is not `None`.
   *Emits `ItemPriceRemoved` on success if the price is `None`.
   */
  set_price: Anonymize<Ia9cd4jqb5eecb>;
  /**
   *Allows to buy an item if it's up for sale.
   *
   *Origin must be Signed and must not be the owner of the `item`.
   *
   *- `collection`: The collection of the item.
   *- `item`: The item the sender wants to buy.
   *- `bid_price`: The price the sender is willing to pay.
   *
   *Emits `ItemBought` on success.
   */
  buy_item: Anonymize<I19jiel1ftbcce>;
  /**
   *Allows to pay the tips.
   *
   *Origin must be Signed.
   *
   *- `tips`: Tips array.
   *
   *Emits `TipSent` on every tip transfer.
   */
  pay_tips: Anonymize<I26c8p47106toa>;
  /**
   *Register a new atomic swap, declaring an intention to send an `item` in exchange for
   *`desired_item` from origin to target on the current blockchain.
   *The target can execute the swap during the specified `duration` of blocks (if set).
   *Additionally, the price could be set for the desired `item`.
   *
   *Origin must be Signed and must be an owner of the `item`.
   *
   *- `collection`: The collection of the item.
   *- `item`: The item an owner wants to give.
   *- `desired_collection`: The collection of the desired item.
   *- `desired_item`: The desired item an owner wants to receive.
   *- `maybe_price`: The price an owner is willing to pay or receive for the desired `item`.
   *- `duration`: A deadline for the swap. Specified by providing the number of blocks
   *	after which the swap will expire.
   *
   *Emits `SwapCreated` on success.
   */
  create_swap: Anonymize<Iq82b3qvf20ne>;
  /**
   *Cancel an atomic swap.
   *
   *Origin must be Signed.
   *Origin must be an owner of the `item` if the deadline hasn't expired.
   *
   *- `collection`: The collection of the item.
   *- `item`: The item an owner wants to give.
   *
   *Emits `SwapCancelled` on success.
   */
  cancel_swap: Anonymize<Ic3j8ku6mbsms4>;
  /**
   *Claim an atomic swap.
   *This method executes a pending swap, that was created by a counterpart before.
   *
   *Origin must be Signed and must be an owner of the `item`.
   *
   *- `send_collection`: The collection of the item to be sent.
   *- `send_item`: The item to be sent.
   *- `receive_collection`: The collection of the item to be received.
   *- `receive_item`: The item to be received.
   *- `witness_price`: A price that was previously agreed on.
   *
   *Emits `SwapClaimed` on success.
   */
  claim_swap: Anonymize<I3nvoqsi8f05ph>;
  /**
   *Mint an item by providing the pre-signed approval.
   *
   *Origin must be Signed.
   *
   *- `mint_data`: The pre-signed approval that consists of the information about the item,
   *  its metadata, attributes, who can mint it (`None` for anyone) and until what block
   *  number.
   *- `signature`: The signature of the `data` object.
   *- `signer`: The `data` object's signer. Should be an Issuer of the collection.
   *
   *Emits `Issued` on success.
   *Emits `AttributeSet` if the attributes were provided.
   *Emits `ItemMetadataSet` if the metadata was not empty.
   */
  mint_pre_signed: Anonymize<I3eoft5md071do>;
  /**
   *Set attributes for an item by providing the pre-signed approval.
   *
   *Origin must be Signed and must be an owner of the `data.item`.
   *
   *- `data`: The pre-signed approval that consists of the information about the item,
   *  attributes to update and until what block number.
   *- `signature`: The signature of the `data` object.
   *- `signer`: The `data` object's signer. Should be an Admin of the collection for the
   *  `CollectionOwner` namespace.
   *
   *Emits `AttributeSet` for each provided attribute.
   *Emits `ItemAttributesApprovalAdded` if the approval wasn't set before.
   *Emits `PreSignedAttributesSet` on success.
   */
  set_attributes_pre_signed: Anonymize<I923eug653ra0o>;
}>;
export type I43aobns89nbkh = {
  admin: MultiAddress;
  config: Anonymize<I72ndo6phms8ik>;
};
export type Iamd7rovec1hfb = {
  owner: MultiAddress;
  config: Anonymize<I72ndo6phms8ik>;
};
export type I77ie723ncd4co = {
  collection: number;
  witness: Anonymize<Idqhe2sslgfeu8>;
};
export type Idqhe2sslgfeu8 = {
  item_metadatas: number;
  item_configs: number;
  attributes: number;
};
export type Ieebloeahma3ke = {
  collection: number;
  item: number;
  mint_to: MultiAddress;
  witness_data?: Anonymize<Ib0113vv89gbic>;
};
export type Ib0113vv89gbic = Anonymize<Ia2e23n2425vqn> | undefined;
export type Ia2e23n2425vqn = {
  owned_item?: Anonymize<I4arjljr6dpflb>;
  mint_price?: Anonymize<I35p85j063s0il>;
};
export type I4mbtpf4pu3rec = {
  collection: number;
  item: number;
  mint_to: MultiAddress;
  item_config: bigint;
};
export type I1ahf3pvgsgbu = {
  collection: number;
  lock_settings: bigint;
};
export type I9uapdn16emsti = {
  collection: number;
  issuer?: Anonymize<Ia0jlc0rcbskuk>;
  admin?: Anonymize<Ia0jlc0rcbskuk>;
  freezer?: Anonymize<Ia0jlc0rcbskuk>;
};
export type Ie5i0q2glmr0md = {
  collection: number;
  owner: MultiAddress;
};
export type I97qcg6i3l8gee = {
  collection: number;
  config: Anonymize<I72ndo6phms8ik>;
};
export type Ib5udrahak005b = {
  collection: number;
  item: number;
  delegate: MultiAddress;
  maybe_deadline?: Anonymize<I4arjljr6dpflb>;
};
export type Ic8b8561e6t9ie = {
  set_as?: Anonymize<Ihfphjolmsqq1>;
  collection: number;
  maybe_item?: Anonymize<I4arjljr6dpflb>;
  namespace: Anonymize<If3jjadhmug6qc>;
  key: Binary;
  value: Binary;
};
export type I6afd7fllr8otc = {
  collection: number;
  item: number;
  delegate: MultiAddress;
  witness: number;
};
export type I1lso3vlgherue = {
  collection: number;
  mint_settings: Anonymize<Ia3s8qquibn97v>;
};
export type I26c8p47106toa = {
  tips: Anonymize<I73vqjhh9uvase>;
};
export type I73vqjhh9uvase = Array<Anonymize<I21hhoccptr6ko>>;
export type I21hhoccptr6ko = {
  collection: number;
  item: number;
  receiver: SS58String;
  amount: bigint;
};
export type Iq82b3qvf20ne = {
  offered_collection: number;
  offered_item: number;
  desired_collection: number;
  maybe_desired_item?: Anonymize<I4arjljr6dpflb>;
  maybe_price?: Anonymize<I6oogc1jbmmi81>;
  duration: number;
};
export type Ic3j8ku6mbsms4 = {
  offered_collection: number;
  offered_item: number;
};
export type I3nvoqsi8f05ph = {
  send_collection: number;
  send_item: number;
  receive_collection: number;
  receive_item: number;
  witness_price?: Anonymize<I6oogc1jbmmi81>;
};
export type I3eoft5md071do = {
  mint_data: Anonymize<Icu0bim1kiuj19>;
  signature: MultiSignature;
  signer: SS58String;
};
export type Icu0bim1kiuj19 = {
  collection: number;
  item: number;
  attributes: Anonymize<I6pi5ou8r1hblk>;
  metadata: Binary;
  only_account?: Anonymize<Ihfphjolmsqq1>;
  deadline: number;
  mint_price?: Anonymize<I35p85j063s0il>;
};
export type MultiSignature = Enum<{
  Ed25519: FixedSizeBinary<64>;
  Sr25519: FixedSizeBinary<64>;
  Ecdsa: FixedSizeBinary<65>;
}>;
export declare const MultiSignature: GetEnum<MultiSignature>;
export type I923eug653ra0o = {
  data: Anonymize<Id9tges27r8atl>;
  signature: MultiSignature;
  signer: SS58String;
};
export type Id9tges27r8atl = {
  collection: number;
  item: number;
  attributes: Anonymize<I6pi5ou8r1hblk>;
  namespace: Anonymize<If3jjadhmug6qc>;
  deadline: number;
};
export type I2clougp67ufee = AnonymousEnum<{
  /**
   *Issue a new class of fungible assets from a public origin.
   *
   *This new asset class has no assets initially and its owner is the origin.
   *
   *The origin must conform to the configured `CreateOrigin` and have sufficient funds free.
   *
   *Funds of sender are reserved by `AssetDeposit`.
   *
   *Parameters:
   *- `id`: The identifier of the new asset. This must not be currently in use to identify
   *an existing asset. If [`NextAssetId`] is set, then this must be equal to it.
   *- `admin`: The admin of this class of assets. The admin is the initial address of each
   *member of the asset class's admin team.
   *- `min_balance`: The minimum balance of this new asset that any single account must
   *have. If an account's balance is reduced below this, then it collapses to zero.
   *
   *Emits `Created` event when successful.
   *
   *Weight: `O(1)`
   */
  create: Anonymize<I7p44cr9g492tc>;
  /**
   *Issue a new class of fungible assets from a privileged origin.
   *
   *This new asset class has no assets initially.
   *
   *The origin must conform to `ForceOrigin`.
   *
   *Unlike `create`, no funds are reserved.
   *
   *- `id`: The identifier of the new asset. This must not be currently in use to identify
   *an existing asset. If [`NextAssetId`] is set, then this must be equal to it.
   *- `owner`: The owner of this class of assets. The owner has full superuser permissions
   *over this asset, but may later change and configure the permissions using
   *`transfer_ownership` and `set_team`.
   *- `min_balance`: The minimum balance of this new asset that any single account must
   *have. If an account's balance is reduced below this, then it collapses to zero.
   *
   *Emits `ForceCreated` event when successful.
   *
   *Weight: `O(1)`
   */
  force_create: Anonymize<Ibn8gm2jugarek>;
  /**
   *Start the process of destroying a fungible asset class.
   *
   *`start_destroy` is the first in a series of extrinsics that should be called, to allow
   *destruction of an asset class.
   *
   *The origin must conform to `ForceOrigin` or must be `Signed` by the asset's `owner`.
   *
   *- `id`: The identifier of the asset to be destroyed. This must identify an existing
   *  asset.
   *
   *The asset class must be frozen before calling `start_destroy`.
   */
  start_destroy: Anonymize<Iekg0q69obfi0f>;
  /**
   *Destroy all accounts associated with a given asset.
   *
   *`destroy_accounts` should only be called after `start_destroy` has been called, and the
   *asset is in a `Destroying` state.
   *
   *Due to weight restrictions, this function may need to be called multiple times to fully
   *destroy all accounts. It will destroy `RemoveItemsLimit` accounts at a time.
   *
   *- `id`: The identifier of the asset to be destroyed. This must identify an existing
   *  asset.
   *
   *Each call emits the `Event::DestroyedAccounts` event.
   */
  destroy_accounts: Anonymize<Iekg0q69obfi0f>;
  /**
   *Destroy all approvals associated with a given asset up to the max (T::RemoveItemsLimit).
   *
   *`destroy_approvals` should only be called after `start_destroy` has been called, and the
   *asset is in a `Destroying` state.
   *
   *Due to weight restrictions, this function may need to be called multiple times to fully
   *destroy all approvals. It will destroy `RemoveItemsLimit` approvals at a time.
   *
   *- `id`: The identifier of the asset to be destroyed. This must identify an existing
   *  asset.
   *
   *Each call emits the `Event::DestroyedApprovals` event.
   */
  destroy_approvals: Anonymize<Iekg0q69obfi0f>;
  /**
   *Complete destroying asset and unreserve currency.
   *
   *`finish_destroy` should only be called after `start_destroy` has been called, and the
   *asset is in a `Destroying` state. All accounts or approvals should be destroyed before
   *hand.
   *
   *- `id`: The identifier of the asset to be destroyed. This must identify an existing
   *  asset.
   *
   *Each successful call emits the `Event::Destroyed` event.
   */
  finish_destroy: Anonymize<Iekg0q69obfi0f>;
  /**
   *Mint assets of a particular class.
   *
   *The origin must be Signed and the sender must be the Issuer of the asset `id`.
   *
   *- `id`: The identifier of the asset to have some amount minted.
   *- `beneficiary`: The account to be credited with the minted assets.
   *- `amount`: The amount of the asset to be minted.
   *
   *Emits `Issued` event when successful.
   *
   *Weight: `O(1)`
   *Modes: Pre-existing balance of `beneficiary`; Account pre-existence of `beneficiary`.
   */
  mint: Anonymize<I8dh2oimnihksg>;
  /**
   *Reduce the balance of `who` by as much as possible up to `amount` assets of `id`.
   *
   *Origin must be Signed and the sender should be the Manager of the asset `id`.
   *
   *Bails with `NoAccount` if the `who` is already dead.
   *
   *- `id`: The identifier of the asset to have some amount burned.
   *- `who`: The account to be debited from.
   *- `amount`: The maximum amount by which `who`'s balance should be reduced.
   *
   *Emits `Burned` with the actual amount burned. If this takes the balance to below the
   *minimum for the asset, then the amount burned is increased to take it to zero.
   *
   *Weight: `O(1)`
   *Modes: Post-existence of `who`; Pre & post Zombie-status of `who`.
   */
  burn: Anonymize<Ib8mfkapk4u9hs>;
  /**
   *Move some assets from the sender account to another.
   *
   *Origin must be Signed.
   *
   *- `id`: The identifier of the asset to have some amount transferred.
   *- `target`: The account to be credited.
   *- `amount`: The amount by which the sender's balance of assets should be reduced and
   *`target`'s balance increased. The amount actually transferred may be slightly greater in
   *the case that the transfer would otherwise take the sender balance above zero but below
   *the minimum balance. Must be greater than zero.
   *
   *Emits `Transferred` with the actual amount transferred. If this takes the source balance
   *to below the minimum for the asset, then the amount transferred is increased to take it
   *to zero.
   *
   *Weight: `O(1)`
   *Modes: Pre-existence of `target`; Post-existence of sender; Account pre-existence of
   *`target`.
   */
  transfer: Anonymize<Ikm68gg7akl51>;
  /**
   *Move some assets from the sender account to another, keeping the sender account alive.
   *
   *Origin must be Signed.
   *
   *- `id`: The identifier of the asset to have some amount transferred.
   *- `target`: The account to be credited.
   *- `amount`: The amount by which the sender's balance of assets should be reduced and
   *`target`'s balance increased. The amount actually transferred may be slightly greater in
   *the case that the transfer would otherwise take the sender balance above zero but below
   *the minimum balance. Must be greater than zero.
   *
   *Emits `Transferred` with the actual amount transferred. If this takes the source balance
   *to below the minimum for the asset, then the amount transferred is increased to take it
   *to zero.
   *
   *Weight: `O(1)`
   *Modes: Pre-existence of `target`; Post-existence of sender; Account pre-existence of
   *`target`.
   */
  transfer_keep_alive: Anonymize<Ikm68gg7akl51>;
  /**
   *Move some assets from one account to another.
   *
   *Origin must be Signed and the sender should be the Admin of the asset `id`.
   *
   *- `id`: The identifier of the asset to have some amount transferred.
   *- `source`: The account to be debited.
   *- `dest`: The account to be credited.
   *- `amount`: The amount by which the `source`'s balance of assets should be reduced and
   *`dest`'s balance increased. The amount actually transferred may be slightly greater in
   *the case that the transfer would otherwise take the `source` balance above zero but
   *below the minimum balance. Must be greater than zero.
   *
   *Emits `Transferred` with the actual amount transferred. If this takes the source balance
   *to below the minimum for the asset, then the amount transferred is increased to take it
   *to zero.
   *
   *Weight: `O(1)`
   *Modes: Pre-existence of `dest`; Post-existence of `source`; Account pre-existence of
   *`dest`.
   */
  force_transfer: Anonymize<If3csb5ben9n1v>;
  /**
   *Disallow further unprivileged transfers of an asset `id` from an account `who`. `who`
   *must already exist as an entry in `Account`s of the asset. If you want to freeze an
   *account that does not have an entry, use `touch_other` first.
   *
   *Origin must be Signed and the sender should be the Freezer of the asset `id`.
   *
   *- `id`: The identifier of the asset to be frozen.
   *- `who`: The account to be frozen.
   *
   *Emits `Frozen`.
   *
   *Weight: `O(1)`
   */
  freeze: Anonymize<If90dk6l9lmtfv>;
  /**
   *Allow unprivileged transfers to and from an account again.
   *
   *Origin must be Signed and the sender should be the Admin of the asset `id`.
   *
   *- `id`: The identifier of the asset to be frozen.
   *- `who`: The account to be unfrozen.
   *
   *Emits `Thawed`.
   *
   *Weight: `O(1)`
   */
  thaw: Anonymize<If90dk6l9lmtfv>;
  /**
   *Disallow further unprivileged transfers for the asset class.
   *
   *Origin must be Signed and the sender should be the Freezer of the asset `id`.
   *
   *- `id`: The identifier of the asset to be frozen.
   *
   *Emits `Frozen`.
   *
   *Weight: `O(1)`
   */
  freeze_asset: Anonymize<Iekg0q69obfi0f>;
  /**
   *Allow unprivileged transfers for the asset again.
   *
   *Origin must be Signed and the sender should be the Admin of the asset `id`.
   *
   *- `id`: The identifier of the asset to be thawed.
   *
   *Emits `Thawed`.
   *
   *Weight: `O(1)`
   */
  thaw_asset: Anonymize<Iekg0q69obfi0f>;
  /**
   *Change the Owner of an asset.
   *
   *Origin must be Signed and the sender should be the Owner of the asset `id`.
   *
   *- `id`: The identifier of the asset.
   *- `owner`: The new Owner of this asset.
   *
   *Emits `OwnerChanged`.
   *
   *Weight: `O(1)`
   */
  transfer_ownership: Anonymize<Ifoahm8m43v9q2>;
  /**
   *Change the Issuer, Admin and Freezer of an asset.
   *
   *Origin must be Signed and the sender should be the Owner of the asset `id`.
   *
   *- `id`: The identifier of the asset to be frozen.
   *- `issuer`: The new Issuer of this asset.
   *- `admin`: The new Admin of this asset.
   *- `freezer`: The new Freezer of this asset.
   *
   *Emits `TeamChanged`.
   *
   *Weight: `O(1)`
   */
  set_team: Anonymize<I1rrgcjpoiot5q>;
  /**
   *Set the metadata for an asset.
   *
   *Origin must be Signed and the sender should be the Owner of the asset `id`.
   *
   *Funds of sender are reserved according to the formula:
   *`MetadataDepositBase + MetadataDepositPerByte * (name.len + symbol.len)` taking into
   *account any already reserved funds.
   *
   *- `id`: The identifier of the asset to update.
   *- `name`: The user friendly name of this asset. Limited in length by `StringLimit`.
   *- `symbol`: The exchange symbol for this asset. Limited in length by `StringLimit`.
   *- `decimals`: The number of decimals this asset uses to represent one unit.
   *
   *Emits `MetadataSet`.
   *
   *Weight: `O(1)`
   */
  set_metadata: Anonymize<I2hc61n7o8dso4>;
  /**
   *Clear the metadata for an asset.
   *
   *Origin must be Signed and the sender should be the Owner of the asset `id`.
   *
   *Any deposit is freed for the asset owner.
   *
   *- `id`: The identifier of the asset to clear.
   *
   *Emits `MetadataCleared`.
   *
   *Weight: `O(1)`
   */
  clear_metadata: Anonymize<Iekg0q69obfi0f>;
  /**
   *Force the metadata for an asset to some value.
   *
   *Origin must be ForceOrigin.
   *
   *Any deposit is left alone.
   *
   *- `id`: The identifier of the asset to update.
   *- `name`: The user friendly name of this asset. Limited in length by `StringLimit`.
   *- `symbol`: The exchange symbol for this asset. Limited in length by `StringLimit`.
   *- `decimals`: The number of decimals this asset uses to represent one unit.
   *
   *Emits `MetadataSet`.
   *
   *Weight: `O(N + S)` where N and S are the length of the name and symbol respectively.
   */
  force_set_metadata: Anonymize<I5787kv2d05f94>;
  /**
   *Clear the metadata for an asset.
   *
   *Origin must be ForceOrigin.
   *
   *Any deposit is returned.
   *
   *- `id`: The identifier of the asset to clear.
   *
   *Emits `MetadataCleared`.
   *
   *Weight: `O(1)`
   */
  force_clear_metadata: Anonymize<Iekg0q69obfi0f>;
  /**
   *Alter the attributes of a given asset.
   *
   *Origin must be `ForceOrigin`.
   *
   *- `id`: The identifier of the asset.
   *- `owner`: The new Owner of this asset.
   *- `issuer`: The new Issuer of this asset.
   *- `admin`: The new Admin of this asset.
   *- `freezer`: The new Freezer of this asset.
   *- `min_balance`: The minimum balance of this new asset that any single account must
   *have. If an account's balance is reduced below this, then it collapses to zero.
   *- `is_sufficient`: Whether a non-zero balance of this asset is deposit of sufficient
   *value to account for the state bloat associated with its balance storage. If set to
   *`true`, then non-zero balances may be stored without a `consumer` reference (and thus
   *an ED in the Balances pallet or whatever else is used to control user-account state
   *growth).
   *- `is_frozen`: Whether this asset class is frozen except for permissioned/admin
   *instructions.
   *
   *Emits `AssetStatusChanged` with the identity of the asset.
   *
   *Weight: `O(1)`
   */
  force_asset_status: Anonymize<Ia8g1imc1kclf4>;
  /**
   *Approve an amount of asset for transfer by a delegated third-party account.
   *
   *Origin must be Signed.
   *
   *Ensures that `ApprovalDeposit` worth of `Currency` is reserved from signing account
   *for the purpose of holding the approval. If some non-zero amount of assets is already
   *approved from signing account to `delegate`, then it is topped up or unreserved to
   *meet the right value.
   *
   *NOTE: The signing account does not need to own `amount` of assets at the point of
   *making this call.
   *
   *- `id`: The identifier of the asset.
   *- `delegate`: The account to delegate permission to transfer asset.
   *- `amount`: The amount of asset that may be transferred by `delegate`. If there is
   *already an approval in place, then this acts additively.
   *
   *Emits `ApprovedTransfer` on success.
   *
   *Weight: `O(1)`
   */
  approve_transfer: Anonymize<Id26ouo5lt2551>;
  /**
   *Cancel all of some asset approved for delegated transfer by a third-party account.
   *
   *Origin must be Signed and there must be an approval in place between signer and
   *`delegate`.
   *
   *Unreserves any deposit previously reserved by `approve_transfer` for the approval.
   *
   *- `id`: The identifier of the asset.
   *- `delegate`: The account delegated permission to transfer asset.
   *
   *Emits `ApprovalCancelled` on success.
   *
   *Weight: `O(1)`
   */
  cancel_approval: Anonymize<Iap1up3prsbtvg>;
  /**
   *Cancel all of some asset approved for delegated transfer by a third-party account.
   *
   *Origin must be either ForceOrigin or Signed origin with the signer being the Admin
   *account of the asset `id`.
   *
   *Unreserves any deposit previously reserved by `approve_transfer` for the approval.
   *
   *- `id`: The identifier of the asset.
   *- `delegate`: The account delegated permission to transfer asset.
   *
   *Emits `ApprovalCancelled` on success.
   *
   *Weight: `O(1)`
   */
  force_cancel_approval: Anonymize<I8m5mvhifj6pm>;
  /**
   *Transfer some asset balance from a previously delegated account to some third-party
   *account.
   *
   *Origin must be Signed and there must be an approval in place by the `owner` to the
   *signer.
   *
   *If the entire amount approved for transfer is transferred, then any deposit previously
   *reserved by `approve_transfer` is unreserved.
   *
   *- `id`: The identifier of the asset.
   *- `owner`: The account which previously approved for a transfer of at least `amount` and
   *from which the asset balance will be withdrawn.
   *- `destination`: The account to which the asset balance of `amount` will be transferred.
   *- `amount`: The amount of assets to transfer.
   *
   *Emits `TransferredApproved` on success.
   *
   *Weight: `O(1)`
   */
  transfer_approved: Anonymize<I8ucc4915s9qvj>;
  /**
   *Create an asset account for non-provider assets.
   *
   *A deposit will be taken from the signer account.
   *
   *- `origin`: Must be Signed; the signer account must have sufficient funds for a deposit
   *  to be taken.
   *- `id`: The identifier of the asset for the account to be created.
   *
   *Emits `Touched` event when successful.
   */
  touch: Anonymize<Iekg0q69obfi0f>;
  /**
   *Return the deposit (if any) of an asset account or a consumer reference (if any) of an
   *account.
   *
   *The origin must be Signed.
   *
   *- `id`: The identifier of the asset for which the caller would like the deposit
   *  refunded.
   *- `allow_burn`: If `true` then assets may be destroyed in order to complete the refund.
   *
   *Emits `Refunded` event when successful.
   */
  refund: Anonymize<I1pjcv2ha0997v>;
  /**
   *Sets the minimum balance of an asset.
   *
   *Only works if there aren't any accounts that are holding the asset or if
   *the new value of `min_balance` is less than the old one.
   *
   *Origin must be Signed and the sender has to be the Owner of the
   *asset `id`.
   *
   *- `id`: The identifier of the asset.
   *- `min_balance`: The new value of `min_balance`.
   *
   *Emits `AssetMinBalanceChanged` event when successful.
   */
  set_min_balance: Anonymize<Ifnm6nai2i47ar>;
  /**
   *Create an asset account for `who`.
   *
   *A deposit will be taken from the signer account.
   *
   *- `origin`: Must be Signed by `Freezer` or `Admin` of the asset `id`; the signer account
   *  must have sufficient funds for a deposit to be taken.
   *- `id`: The identifier of the asset for the account to be created.
   *- `who`: The account to be created.
   *
   *Emits `Touched` event when successful.
   */
  touch_other: Anonymize<If90dk6l9lmtfv>;
  /**
   *Return the deposit (if any) of a target asset account. Useful if you are the depositor.
   *
   *The origin must be Signed and either the account owner, depositor, or asset `Admin`. In
   *order to burn a non-zero balance of the asset, the caller must be the account and should
   *use `refund`.
   *
   *- `id`: The identifier of the asset for the account holding a deposit.
   *- `who`: The account to refund.
   *
   *Emits `Refunded` event when successful.
   */
  refund_other: Anonymize<If90dk6l9lmtfv>;
  /**
   *Disallow further unprivileged transfers of an asset `id` to and from an account `who`.
   *
   *Origin must be Signed and the sender should be the Freezer of the asset `id`.
   *
   *- `id`: The identifier of the account's asset.
   *- `who`: The account to be unblocked.
   *
   *Emits `Blocked`.
   *
   *Weight: `O(1)`
   */
  block: Anonymize<If90dk6l9lmtfv>;
}>;
export type I7p44cr9g492tc = {
  id: Anonymize<I4c0s5cioidn76>;
  admin: MultiAddress;
  min_balance: bigint;
};
export type Ibn8gm2jugarek = {
  id: Anonymize<I4c0s5cioidn76>;
  owner: MultiAddress;
  is_sufficient: boolean;
  min_balance: bigint;
};
export type Iekg0q69obfi0f = {
  id: Anonymize<I4c0s5cioidn76>;
};
export type I8dh2oimnihksg = {
  id: Anonymize<I4c0s5cioidn76>;
  beneficiary: MultiAddress;
  amount: bigint;
};
export type Ib8mfkapk4u9hs = {
  id: Anonymize<I4c0s5cioidn76>;
  who: MultiAddress;
  amount: bigint;
};
export type Ikm68gg7akl51 = {
  id: Anonymize<I4c0s5cioidn76>;
  target: MultiAddress;
  amount: bigint;
};
export type If3csb5ben9n1v = {
  id: Anonymize<I4c0s5cioidn76>;
  source: MultiAddress;
  dest: MultiAddress;
  amount: bigint;
};
export type If90dk6l9lmtfv = {
  id: Anonymize<I4c0s5cioidn76>;
  who: MultiAddress;
};
export type Ifoahm8m43v9q2 = {
  id: Anonymize<I4c0s5cioidn76>;
  owner: MultiAddress;
};
export type I1rrgcjpoiot5q = {
  id: Anonymize<I4c0s5cioidn76>;
  issuer: MultiAddress;
  admin: MultiAddress;
  freezer: MultiAddress;
};
export type I2hc61n7o8dso4 = {
  id: Anonymize<I4c0s5cioidn76>;
  name: Binary;
  symbol: Binary;
  decimals: number;
};
export type I5787kv2d05f94 = {
  id: Anonymize<I4c0s5cioidn76>;
  name: Binary;
  symbol: Binary;
  decimals: number;
  is_frozen: boolean;
};
export type Ia8g1imc1kclf4 = {
  id: Anonymize<I4c0s5cioidn76>;
  owner: MultiAddress;
  issuer: MultiAddress;
  admin: MultiAddress;
  freezer: MultiAddress;
  min_balance: bigint;
  is_sufficient: boolean;
  is_frozen: boolean;
};
export type Id26ouo5lt2551 = {
  id: Anonymize<I4c0s5cioidn76>;
  delegate: MultiAddress;
  amount: bigint;
};
export type Iap1up3prsbtvg = {
  id: Anonymize<I4c0s5cioidn76>;
  delegate: MultiAddress;
};
export type I8m5mvhifj6pm = {
  id: Anonymize<I4c0s5cioidn76>;
  owner: MultiAddress;
  delegate: MultiAddress;
};
export type I8ucc4915s9qvj = {
  id: Anonymize<I4c0s5cioidn76>;
  owner: MultiAddress;
  destination: MultiAddress;
  amount: bigint;
};
export type I1pjcv2ha0997v = {
  id: Anonymize<I4c0s5cioidn76>;
  allow_burn: boolean;
};
export type Ifnm6nai2i47ar = {
  id: Anonymize<I4c0s5cioidn76>;
  min_balance: bigint;
};
export type I9eemk0c7gip8o = AnonymousEnum<{
  /**
   *Creates an empty liquidity pool and an associated new `lp_token` asset
   *(the id of which is returned in the `Event::PoolCreated` event).
   *
   *Once a pool is created, someone may [`Pallet::add_liquidity`] to it.
   */
  create_pool: Anonymize<I8eoqk45hnet27>;
  /**
   *Provide liquidity into the pool of `asset1` and `asset2`.
   *NOTE: an optimal amount of asset1 and asset2 will be calculated and
   *might be different than the provided `amount1_desired`/`amount2_desired`
   *thus you should provide the min amount you're happy to provide.
   *Params `amount1_min`/`amount2_min` represent that.
   *`mint_to` will be sent the liquidity tokens that represent this share of the pool.
   *
   *NOTE: when encountering an incorrect exchange rate and non-withdrawable pool liquidity,
   *batch an atomic call with [`Pallet::add_liquidity`] and
   *[`Pallet::swap_exact_tokens_for_tokens`] or [`Pallet::swap_tokens_for_exact_tokens`]
   *calls to render the liquidity withdrawable and rectify the exchange rate.
   *
   *Once liquidity is added, someone may successfully call
   *[`Pallet::swap_exact_tokens_for_tokens`] successfully.
   */
  add_liquidity: Anonymize<Iddvk596rbl31l>;
  /**
   *Allows you to remove liquidity by providing the `lp_token_burn` tokens that will be
   *burned in the process. With the usage of `amount1_min_receive`/`amount2_min_receive`
   *it's possible to control the min amount of returned tokens you're happy with.
   */
  remove_liquidity: Anonymize<I3iap9ri572kjf>;
  /**
   *Swap the exact amount of `asset1` into `asset2`.
   *`amount_out_min` param allows you to specify the min amount of the `asset2`
   *you're happy to receive.
   *
   *[`AssetConversionApi::quote_price_exact_tokens_for_tokens`] runtime call can be called
   *for a quote.
   */
  swap_exact_tokens_for_tokens: Anonymize<I48iqqqmt2pr38>;
  /**
   *Swap any amount of `asset1` to get the exact amount of `asset2`.
   *`amount_in_max` param allows to specify the max amount of the `asset1`
   *you're happy to provide.
   *
   *[`AssetConversionApi::quote_price_tokens_for_exact_tokens`] runtime call can be called
   *for a quote.
   */
  swap_tokens_for_exact_tokens: Anonymize<I90ob4vr51rue4>;
  /**
   *Touch an existing pool to fulfill prerequisites before providing liquidity, such as
   *ensuring that the pool's accounts are in place. It is typically useful when a pool
   *creator removes the pool's accounts and does not provide a liquidity. This action may
   *involve holding assets from the caller as a deposit for creating the pool's accounts.
   *
   *The origin must be Signed.
   *
   *- `asset1`: The asset ID of an existing pool with a pair (asset1, asset2).
   *- `asset2`: The asset ID of an existing pool with a pair (asset1, asset2).
   *
   *Emits `Touched` event when successful.
   */
  touch: Anonymize<I8eoqk45hnet27>;
}>;
export type I8eoqk45hnet27 = {
  asset1: Anonymize<I4c0s5cioidn76>;
  asset2: Anonymize<I4c0s5cioidn76>;
};
export type Iddvk596rbl31l = {
  asset1: Anonymize<I4c0s5cioidn76>;
  asset2: Anonymize<I4c0s5cioidn76>;
  amount1_desired: bigint;
  amount2_desired: bigint;
  amount1_min: bigint;
  amount2_min: bigint;
  mint_to: SS58String;
};
export type I3iap9ri572kjf = {
  asset1: Anonymize<I4c0s5cioidn76>;
  asset2: Anonymize<I4c0s5cioidn76>;
  lp_token_burn: bigint;
  amount1_min_receive: bigint;
  amount2_min_receive: bigint;
  withdraw_to: SS58String;
};
export type I48iqqqmt2pr38 = {
  path: Anonymize<Ia88a8r9e89e2p>;
  amount_in: bigint;
  amount_out_min: bigint;
  send_to: SS58String;
  keep_alive: boolean;
};
export type Ia88a8r9e89e2p = Array<Anonymize<I4c0s5cioidn76>>;
export type I90ob4vr51rue4 = {
  path: Anonymize<Ia88a8r9e89e2p>;
  amount_out: bigint;
  amount_in_max: bigint;
  send_to: SS58String;
  keep_alive: boolean;
};
export type Iaqet9jc3ihboe = {
  header: Anonymize<Ic952bubvq4k7d>;
  extrinsics: Anonymize<Itom7fk49o0c9>;
};
export type Ic952bubvq4k7d = {
  parent_hash: FixedSizeBinary<32>;
  number: number;
  state_root: FixedSizeBinary<32>;
  extrinsics_root: FixedSizeBinary<32>;
  digest: Anonymize<I4mddgoa69c0a2>;
};
export type I2v50gu3s1aqk6 = AnonymousEnum<{
  AllExtrinsics: undefined;
  OnlyInherents: undefined;
}>;
export type Iai7icf56nsvk8 = ResultPayload<
  Anonymize<I6sjjdpu2cscpe>,
  TransactionValidityError
>;
export type TransactionValidityError = Enum<{
  Invalid: TransactionValidityInvalidTransaction;
  Unknown: TransactionValidityUnknownTransaction;
}>;
export declare const TransactionValidityError: GetEnum<TransactionValidityError>;
export type TransactionValidityInvalidTransaction = Enum<{
  Call: undefined;
  Payment: undefined;
  Future: undefined;
  Stale: undefined;
  BadProof: undefined;
  AncientBirthBlock: undefined;
  ExhaustsResources: undefined;
  Custom: number;
  BadMandatory: undefined;
  MandatoryValidation: undefined;
  BadSigner: undefined;
}>;
export declare const TransactionValidityInvalidTransaction: GetEnum<TransactionValidityInvalidTransaction>;
export type TransactionValidityUnknownTransaction = Enum<{
  CannotLookup: undefined;
  NoUnsignedValidator: undefined;
  Custom: number;
}>;
export declare const TransactionValidityUnknownTransaction: GetEnum<TransactionValidityUnknownTransaction>;
export type If7uv525tdvv7a = Array<Anonymize<I76hdjk9qh40no>>;
export type I76hdjk9qh40no = [FixedSizeBinary<8>, Binary];
export type I2an1fs2eiebjp = {
  okay: boolean;
  fatal_error: boolean;
  errors: Anonymize<If7uv525tdvv7a>;
};
export type TransactionValidityTransactionSource = Enum<{
  InBlock: undefined;
  Local: undefined;
  External: undefined;
}>;
export declare const TransactionValidityTransactionSource: GetEnum<TransactionValidityTransactionSource>;
export type Iajbob6uln5jct = ResultPayload<
  Anonymize<I6g5lcd9vf2cr0>,
  TransactionValidityError
>;
export type I6g5lcd9vf2cr0 = {
  priority: bigint;
  requires: Anonymize<Itom7fk49o0c9>;
  provides: Anonymize<Itom7fk49o0c9>;
  longevity: bigint;
  propagate: boolean;
};
export type Icerf8h8pdu8ss = Anonymize<I66iuq7l8se39> | undefined;
export type I66iuq7l8se39 = Array<Anonymize<I9tmff36km6vjg>>;
export type I9tmff36km6vjg = [Binary, FixedSizeBinary<4>];
export type I6spmpef2c7svf = {
  weight: Anonymize<I4q39t5hn830vp>;
  class: DispatchClass;
  partial_fee: bigint;
};
export type Iei2mvq0mjvt81 = {
  inclusion_fee?: Anonymize<Id37fum600qfau>;
  tip: bigint;
};
export type Id37fum600qfau = Anonymize<I246faqtjrsnee> | undefined;
export type I246faqtjrsnee = {
  base_fee: bigint;
  len_fee: bigint;
  adjusted_weight_fee: bigint;
};
export type I2g5nrfnsbr9n0 = AnonymousEnum<{
  System: Anonymize<Iekve0i6djpd9f>;
  ParachainSystem: Anonymize<I3jmip7qjlcqot>;
  Timestamp: Anonymize<I7d75gqfg6jh9c>;
  ParachainInfo: undefined;
  Balances: Anonymize<I9svldsp29mh87>;
  Vesting: Anonymize<Icgf8vmtkbnu4u>;
  CollatorSelection: Anonymize<I9dpq5287dur8b>;
  Session: Anonymize<I77dda7hps0u37>;
  XcmpQueue: Anonymize<Ib7tahn20bvsep>;
  PolkadotXcm: Anonymize<I9nbjvlrb9bp1g>;
  CumulusXcm: undefined;
  ToKusamaXcmRouter: Anonymize<I6epb28bkd5aqn>;
  MessageQueue: Anonymize<Ic2uoe7jdksosp>;
  Utility: Anonymize<I8ikgojd2kp4nr>;
  Multisig: Anonymize<I2i3jnq078uco0>;
  Proxy: Anonymize<I6qfut29tv8are>;
  Assets: Anonymize<Ideusanoto4b1j>;
  Uniques: Anonymize<Icu49uv7rfej74>;
  Nfts: Anonymize<I1k4il7i5elhc7>;
  ForeignAssets: Anonymize<I2clougp67ufee>;
  PoolAssets: Anonymize<Ideusanoto4b1j>;
  AssetConversion: Anonymize<I9eemk0c7gip8o>;
}>;
export type I1p1369d52j8jd = ResultPayload<
  Anonymize<I66cvqflm1qj24>,
  Anonymize<Iavct6f844hfju>
>;
export type I66cvqflm1qj24 = Array<XcmVersionedAssetId>;
export type Iavct6f844hfju = AnonymousEnum<{
  Unimplemented: undefined;
  VersionedConversionFailed: undefined;
  WeightNotComputable: undefined;
  UnhandledXcmVersion: undefined;
  AssetNotFound: undefined;
  Unroutable: undefined;
}>;
export type Ic0c3req3mlc1l = ResultPayload<
  Anonymize<I4q39t5hn830vp>,
  Anonymize<Iavct6f844hfju>
>;
export type I7ocn4njqde3v5 = ResultPayload<bigint, Anonymize<Iavct6f844hfju>>;
export type I5rlt6h8ph553n = ResultPayload<
  XcmVersionedAssets,
  Anonymize<Iavct6f844hfju>
>;
export type Id5e0bqoki0bb0 = ResultPayload<
  Anonymize<I2b61r7oveqvlt>,
  Anonymize<I55ku9c5gk50hb>
>;
export type I2b61r7oveqvlt = {
  execution_result: Anonymize<Ic6s0p82uhoidt>;
  emitted_events: Anonymize<I6ulg2ml1s5o2p>;
  local_xcm?: Anonymize<I3i0ce56p044d2>;
  forwarded_xcms: Anonymize<I47tkk5e5nm6g7>;
};
export type Ic6s0p82uhoidt = ResultPayload<
  Anonymize<Ia1u1r3n74r13c>,
  Anonymize<I3n1v5i2efq6rh>
>;
export type Ia1u1r3n74r13c = {
  actual_weight?: Anonymize<Iasb8k6ash5mjn>;
  pays_fee: Anonymize<Iehg04bj71rkd>;
};
export type I3n1v5i2efq6rh = {
  post_info: Anonymize<Ia1u1r3n74r13c>;
  error: Anonymize<Icogrvf0inr18b>;
};
export type I6ulg2ml1s5o2p = Array<Anonymize<I668na8k863p14>>;
export type I3i0ce56p044d2 = XcmVersionedXcm | undefined;
export type I47tkk5e5nm6g7 = Array<Anonymize<I60vv2hvlt348b>>;
export type I60vv2hvlt348b = [XcmVersionedLocation, Anonymize<I7ao2ct6q454mu>];
export type I7ao2ct6q454mu = Array<XcmVersionedXcm>;
export type I55ku9c5gk50hb = AnonymousEnum<{
  Unimplemented: undefined;
  VersionedConversionFailed: undefined;
}>;
export type I6sn3ln0su7un5 = ResultPayload<
  Anonymize<I16uv813m3c1lh>,
  Anonymize<I55ku9c5gk50hb>
>;
export type I16uv813m3c1lh = {
  execution_result: XcmV4TraitsOutcome;
  emitted_events: Anonymize<I6ulg2ml1s5o2p>;
  forwarded_xcms: Anonymize<I47tkk5e5nm6g7>;
};
export type Ieh6nis3hdbtgi = ResultPayload<
  SS58String,
  Anonymize<Ibaohq34aedndv>
>;
export type Ibaohq34aedndv = AnonymousEnum<{
  Unsupported: undefined;
  VersionedConversionFailed: undefined;
}>;
export type I93k1anhb5gs2q = ResultPayload<
  XcmVersionedAssets,
  Anonymize<I5tspd7e422fr9>
>;
export type I5tspd7e422fr9 = AnonymousEnum<{
  AssetIdConversionFailed: undefined;
  AmountToBalanceConversionFailed: undefined;
}>;
export type Ic1d4u2opv3fst = {
  upward_messages: Anonymize<Itom7fk49o0c9>;
  horizontal_messages: Anonymize<I6r5cbv8ttrb09>;
  new_validation_code?: Anonymize<Iabpgqcjikia83>;
  processed_downward_messages: number;
  hrmp_watermark: number;
  head_data: Binary;
};
export type Ie9sr1iqcg3cgm = ResultPayload<undefined, string>;
export type I1mqgk2tmnn9i2 = string | undefined;
export type I6lr8sctk0bi4e = Array<string>;
export type I5vv5n03oo8gas = Anonymize<I200n1ov5tbcvr> | undefined;
export type I200n1ov5tbcvr = FixedSizeArray<2, bigint>;
export type I86ve4guev2c9 = Array<Anonymize<I4l3f9cflirrhs>>;
export type I4l3f9cflirrhs = {
  phase: Phase;
  event: Anonymize<Ide6lvrlogarft>;
  topics: Anonymize<Ic5m5lp1oioo8r>;
};
export type Ide6lvrlogarft = AnonymousEnum<{
  System: Anonymize<Ifgapegh22id27>;
  Balances: Anonymize<Iao8h4hv7atnq3>;
  TransactionPayment: TransactionPaymentEvent;
  MultiTransactionPayment: Anonymize<I8rr9o6g84pu5j>;
  Treasury: Anonymize<I3f75km8j5v1nd>;
  Utility: Anonymize<I6env82qg39mi7>;
  Preimage: PreimageEvent;
  Identity: Anonymize<Ibju6hjiipokne>;
  Democracy: Anonymize<Icfq8ap3e5p73t>;
  Elections: Anonymize<I4iamd5rd51ec2>;
  Council: Anonymize<Icraqvvspogdb4>;
  TechnicalCommittee: Anonymize<Icraqvvspogdb4>;
  Tips: Anonymize<Imaosic05it19>;
  Proxy: Anonymize<I9f78q7spmcstc>;
  Multisig: Anonymize<Ieabsm7duvg6q2>;
  Uniques: Anonymize<I27c883vr18l6d>;
  StateTrieMigration: Anonymize<I61dksvl51aujo>;
  ConvictionVoting: ConvictionVotingEvent;
  Referenda: Anonymize<Idfraa3b4eu018>;
  Whitelist: Anonymize<Id9ai2vqibcn9d>;
  Dispatcher: Anonymize<Ics6l0t7ahfldh>;
  AssetRegistry: Anonymize<Ian7ibscsh312g>;
  Claims: Anonymize<I8cen1qssvc0qs>;
  CollatorRewards: Anonymize<I3ktde60bb7807>;
  Omnipool: Anonymize<I7lkql4318bauj>;
  TransactionPause: Anonymize<I1e1tlbqeorb14>;
  Duster: Anonymize<Ick156bqlvrfqh>;
  OmnipoolWarehouseLM: Anonymize<Ibc0cs73olrilv>;
  OmnipoolLiquidityMining: Anonymize<Ibd5re511t83ta>;
  OTC: Anonymize<I4e560fvgcsh15>;
  CircuitBreaker: Anonymize<Ichskhtdtbf0vo>;
  Router: Anonymize<I29ur4pnf751bn>;
  DynamicFees: undefined;
  Staking: Anonymize<I578f2b006bplq>;
  Stableswap: Anonymize<I7d404mb06b8kk>;
  Bonds: Anonymize<I3ans31bk1md2j>;
  OtcSettlements: Anonymize<I7t4kltkut18qv>;
  LBP: Anonymize<Iafgde8gm8mhvt>;
  XYK: Anonymize<Ii9d7rb1uqb69>;
  Referrals: Anonymize<Idpbcufjvb4ib7>;
  Liquidation: Anonymize<Iephmdb4ru40md>;
  Tokens: Anonymize<I6h8581jnodhqc>;
  Currencies: Anonymize<I6qgq0m7o225jg>;
  Vesting: Anonymize<I3jgv45gfqgi7c>;
  EVM: Anonymize<I9k071kk4cn1u8>;
  Ethereum: Anonymize<I510u4q1qqh897>;
  EVMAccounts: Anonymize<I5g0cg8sq1eggv>;
  XYKLiquidityMining: Anonymize<I479nm08b6ujjd>;
  XYKWarehouseLM: Anonymize<Ibc0cs73olrilv>;
  RelayChainInfo: Anonymize<I3cdbmcrrt95qk>;
  DCA: Anonymize<I7n8b0ets25mll>;
  Scheduler: Anonymize<I6hp9satpajc60>;
  ParachainSystem: Anonymize<Icbsekf57miplo>;
  PolkadotXcm: Anonymize<I5ce1ru810vv9d>;
  CumulusXcm: Anonymize<Ibvp9t1gqae5ct>;
  XcmpQueue: Anonymize<Idsqc7mhp6nnle>;
  MessageQueue: Anonymize<Idrvf3ouahq8la>;
  OrmlXcm: Anonymize<I1615emstntqta>;
  XTokens: Anonymize<Ie93bvvt769opj>;
  UnknownTokens: Anonymize<Ia2698nr6jkt>;
  CollatorSelection: Anonymize<I4srakrmf0fspo>;
  Session: SessionEvent;
  EmaOracle: Anonymize<Iehrcm8i7udvpg>;
  Broadcast: Anonymize<I3muc97flmjou2>;
}>;
export type Ifgapegh22id27 = AnonymousEnum<{
  /**
   *An extrinsic completed successfully.
   */
  ExtrinsicSuccess: Anonymize<Ia82mnkmeo2rhc>;
  /**
   *An extrinsic failed.
   */
  ExtrinsicFailed: Anonymize<I17lrc78ftgqcp>;
  /**
   *`:code` was updated.
   */
  CodeUpdated: undefined;
  /**
   *A new account was created.
   */
  NewAccount: Anonymize<Icbccs0ug47ilf>;
  /**
   *An account was reaped.
   */
  KilledAccount: Anonymize<Icbccs0ug47ilf>;
  /**
   *On on-chain remark happened.
   */
  Remarked: Anonymize<I855j4i3kr8ko1>;
  /**
   *An upgrade was authorized.
   */
  UpgradeAuthorized: Anonymize<Ibgl04rn6nbfm6>;
}>;
export type I17lrc78ftgqcp = {
  dispatch_error: Anonymize<I9sdjnqgsnrang>;
  dispatch_info: Anonymize<Ic9s8f85vjtncc>;
};
export type I9sdjnqgsnrang = AnonymousEnum<{
  Other: undefined;
  CannotLookup: undefined;
  BadOrigin: undefined;
  Module: Anonymize<I4pao8nbd41pv4>;
  ConsumerRemaining: undefined;
  NoProviders: undefined;
  TooManyConsumers: undefined;
  Token: TokenError;
  Arithmetic: ArithmeticError;
  Transactional: TransactionalError;
  Exhausted: undefined;
  Corruption: undefined;
  Unavailable: undefined;
  RootNotAllowed: undefined;
}>;
export type I4pao8nbd41pv4 = AnonymousEnum<{
  System: Anonymize<I5o0s7c8q1cc9b>;
  Timestamp: undefined;
  Balances: Anonymize<Idj13i7adlomht>;
  TransactionPayment: undefined;
  MultiTransactionPayment: Anonymize<Iedfhur3vm7bgd>;
  Treasury: Anonymize<I7dodf8ccnun1b>;
  Utility: Anonymize<I8dt2g2hcrgh36>;
  Preimage: Anonymize<I4cfhml1prt4lu>;
  Identity: Anonymize<I9mq328955mgb8>;
  Democracy: Anonymize<I67neb7i10udig>;
  Elections: Anonymize<I96u72l8br1ego>;
  Council: Anonymize<Icapevgbpfn5p9>;
  TechnicalCommittee: Anonymize<Icapevgbpfn5p9>;
  Tips: Anonymize<I8c24qlovva8mi>;
  Proxy: Anonymize<Iuvt54ei4cehc>;
  Multisig: Anonymize<Ia76qmhhg4jvb9>;
  Uniques: Anonymize<Ienq2ge2rhv4jm>;
  StateTrieMigration: Anonymize<I96objte63brjr>;
  ConvictionVoting: Anonymize<Idfa8k8ikssbsf>;
  Referenda: Anonymize<I84u4ul208g742>;
  Origins: undefined;
  Whitelist: Anonymize<I15nctscutpbeh>;
  Dispatcher: undefined;
  AssetRegistry: Anonymize<Iimgfr2idjdm4>;
  Claims: Anonymize<Ieesotejglstun>;
  GenesisHistory: undefined;
  CollatorRewards: undefined;
  Omnipool: Anonymize<I9n81uie6vm9j8>;
  TransactionPause: Anonymize<Ia4jj5ajguk6ba>;
  Duster: Anonymize<Igjgeha0sds9v>;
  OmnipoolWarehouseLM: Anonymize<Ib26q43rgjm5dv>;
  OmnipoolLiquidityMining: Anonymize<I3pmdtg46in2f0>;
  OTC: Anonymize<I1kp1c5al384as>;
  CircuitBreaker: Anonymize<I4vmqfcgsdr1l9>;
  Router: Anonymize<Ifntb1290uuatm>;
  DynamicFees: undefined;
  Staking: Anonymize<Idhbjtd7at0b1k>;
  Stableswap: Anonymize<I8eh9m8533v1sf>;
  Bonds: Anonymize<Ibj08k850p0j34>;
  OtcSettlements: Anonymize<I1jtj4pc4jltpf>;
  LBP: Anonymize<Ic99uoklag6hh0>;
  XYK: Anonymize<I96k0kb8u9s0go>;
  Referrals: Anonymize<Iaqb0qr3l7g0ub>;
  Liquidation: Anonymize<I2isghqcs9gp7d>;
  Tokens: Anonymize<Icc7o7ep6n36h2>;
  Currencies: Anonymize<Iejalhtid1s0pt>;
  Vesting: Anonymize<Ifkcmnj410r9fh>;
  EVM: Anonymize<I4pkfap0t7vk0t>;
  EVMChainId: undefined;
  Ethereum: Anonymize<I1mp6vnoh32l4q>;
  EVMAccounts: Anonymize<Ie65vecqacffpm>;
  DynamicEvmFee: undefined;
  XYKLiquidityMining: Anonymize<I6q09f6hmj7elp>;
  XYKWarehouseLM: Anonymize<Ib26q43rgjm5dv>;
  RelayChainInfo: undefined;
  DCA: Anonymize<Ic4d0pk1ndfilm>;
  Scheduler: Anonymize<If7oa8fprnilo5>;
  ParachainSystem: Anonymize<I9p95gln24a0rn>;
  ParachainInfo: undefined;
  PolkadotXcm: Anonymize<I87j95aq93d7dq>;
  CumulusXcm: undefined;
  XcmpQueue: Anonymize<I9aoshicggice1>;
  MessageQueue: Anonymize<I5iupade5ag2dp>;
  OrmlXcm: Anonymize<Ifv4efjta13rhe>;
  XTokens: Anonymize<I8g8tbk0anjali>;
  UnknownTokens: Anonymize<I5llpdov40t5vu>;
  Authorship: undefined;
  CollatorSelection: Anonymize<I36bcffk2387dv>;
  Session: Anonymize<I1e07dgbaqd1sq>;
  Aura: undefined;
  AuraExt: undefined;
  EmaOracle: Anonymize<Iek7hro9nhqg2o>;
  Broadcast: undefined;
}>;
export type Iedfhur3vm7bgd = AnonymousEnum<{
  /**
   *Selected currency is not supported.
   */
  UnsupportedCurrency: undefined;
  /**
   *Account balance should be non-zero.
   */
  ZeroBalance: undefined;
  /**
   *Currency is already in the list of accepted currencies.
   */
  AlreadyAccepted: undefined;
  /**
   *It is not allowed to add Core Asset as accepted currency. Core asset is accepted by design.
   */
  CoreAssetNotAllowed: undefined;
  /**
   *Fallback price cannot be zero.
   */
  ZeroPrice: undefined;
  /**
   *Fallback price was not found.
   */
  FallbackPriceNotFound: undefined;
  /**
   *Math overflow
   */
  Overflow: undefined;
  /**
   *It is not allowed to change payment currency of an EVM account.
   */
  EvmAccountNotAllowed: undefined;
  /**
   *EVM permit expired.
   */
  EvmPermitExpired: undefined;
  /**
   *EVM permit is invalid.
   */
  EvmPermitInvalid: undefined;
  /**
   *EVM permit call failed.
   */
  EvmPermitCallExecutionError: undefined;
  /**
   *EVM permit call failed.
   */
  EvmPermitRunnerError: undefined;
}>;
export type I7dodf8ccnun1b = AnonymousEnum<{
  /**
   *Proposer's balance is too low.
   */
  InsufficientProposersBalance: undefined;
  /**
   *No proposal, bounty or spend at that index.
   */
  InvalidIndex: undefined;
  /**
   *Too many approvals in the queue.
   */
  TooManyApprovals: undefined;
  /**
   *The spend origin is valid but the amount it is allowed to spend is lower than the
   *amount to be spent.
   */
  InsufficientPermission: undefined;
  /**
   *Proposal has not been approved.
   */
  ProposalNotApproved: undefined;
  /**
   *The balance of the asset kind is not convertible to the balance of the native asset.
   */
  FailedToConvertBalance: undefined;
  /**
   *The spend has expired and cannot be claimed.
   */
  SpendExpired: undefined;
  /**
   *The spend is not yet eligible for payout.
   */
  EarlyPayout: undefined;
  /**
   *The payment has already been attempted.
   */
  AlreadyAttempted: undefined;
  /**
   *There was some issue with the mechanism of payment.
   */
  PayoutError: undefined;
  /**
   *The payout was not yet attempted/claimed.
   */
  NotAttempted: undefined;
  /**
   *The payment has neither failed nor succeeded yet.
   */
  Inconclusive: undefined;
}>;
export type I4cfhml1prt4lu = AnonymousEnum<{
  /**
   *Preimage is too large to store on-chain.
   */
  TooBig: undefined;
  /**
   *Preimage has already been noted on-chain.
   */
  AlreadyNoted: undefined;
  /**
   *The user is not authorized to perform this action.
   */
  NotAuthorized: undefined;
  /**
   *The preimage cannot be removed since it has not yet been noted.
   */
  NotNoted: undefined;
  /**
   *A preimage may not be removed when there are outstanding requests.
   */
  Requested: undefined;
  /**
   *The preimage request cannot be removed since no outstanding requests exist.
   */
  NotRequested: undefined;
  /**
   *More than `MAX_HASH_UPGRADE_BULK_COUNT` hashes were requested to be upgraded at once.
   */
  TooMany: undefined;
  /**
   *Too few hashes were requested to be upgraded (i.e. zero).
   */
  TooFew: undefined;
}>;
export type I9mq328955mgb8 = AnonymousEnum<{
  /**
   *Too many subs-accounts.
   */
  TooManySubAccounts: undefined;
  /**
   *Account isn't found.
   */
  NotFound: undefined;
  /**
   *Account isn't named.
   */
  NotNamed: undefined;
  /**
   *Empty index.
   */
  EmptyIndex: undefined;
  /**
   *Fee is changed.
   */
  FeeChanged: undefined;
  /**
   *No identity found.
   */
  NoIdentity: undefined;
  /**
   *Sticky judgement.
   */
  StickyJudgement: undefined;
  /**
   *Judgement given.
   */
  JudgementGiven: undefined;
  /**
   *Invalid judgement.
   */
  InvalidJudgement: undefined;
  /**
   *The index is invalid.
   */
  InvalidIndex: undefined;
  /**
   *The target is invalid.
   */
  InvalidTarget: undefined;
  /**
   *Maximum amount of registrars reached. Cannot add any more.
   */
  TooManyRegistrars: undefined;
  /**
   *Account ID is already named.
   */
  AlreadyClaimed: undefined;
  /**
   *Sender is not a sub-account.
   */
  NotSub: undefined;
  /**
   *Sub-account isn't owned by sender.
   */
  NotOwned: undefined;
  /**
   *The provided judgement was for a different identity.
   */
  JudgementForDifferentIdentity: undefined;
  /**
   *Error that occurs when there is an issue paying for judgement.
   */
  JudgementPaymentFailed: undefined;
  /**
   *The provided suffix is too long.
   */
  InvalidSuffix: undefined;
  /**
   *The sender does not have permission to issue a username.
   */
  NotUsernameAuthority: undefined;
  /**
   *The authority cannot allocate any more usernames.
   */
  NoAllocation: undefined;
  /**
   *The signature on a username was not valid.
   */
  InvalidSignature: undefined;
  /**
   *Setting this username requires a signature, but none was provided.
   */
  RequiresSignature: undefined;
  /**
   *The username does not meet the requirements.
   */
  InvalidUsername: undefined;
  /**
   *The username is already taken.
   */
  UsernameTaken: undefined;
  /**
   *The requested username does not exist.
   */
  NoUsername: undefined;
  /**
   *The username cannot be forcefully removed because it can still be accepted.
   */
  NotExpired: undefined;
}>;
export type I67neb7i10udig = AnonymousEnum<{
  /**
   *Value too low
   */
  ValueLow: undefined;
  /**
   *Proposal does not exist
   */
  ProposalMissing: undefined;
  /**
   *Cannot cancel the same proposal twice
   */
  AlreadyCanceled: undefined;
  /**
   *Proposal already made
   */
  DuplicateProposal: undefined;
  /**
   *Proposal still blacklisted
   */
  ProposalBlacklisted: undefined;
  /**
   *Next external proposal not simple majority
   */
  NotSimpleMajority: undefined;
  /**
   *Invalid hash
   */
  InvalidHash: undefined;
  /**
   *No external proposal
   */
  NoProposal: undefined;
  /**
   *Identity may not veto a proposal twice
   */
  AlreadyVetoed: undefined;
  /**
   *Vote given for invalid referendum
   */
  ReferendumInvalid: undefined;
  /**
   *No proposals waiting
   */
  NoneWaiting: undefined;
  /**
   *The given account did not vote on the referendum.
   */
  NotVoter: undefined;
  /**
   *The actor has no permission to conduct the action.
   */
  NoPermission: undefined;
  /**
   *The account is already delegating.
   */
  AlreadyDelegating: undefined;
  /**
   *Too high a balance was provided that the account cannot afford.
   */
  InsufficientFunds: undefined;
  /**
   *The account is not currently delegating.
   */
  NotDelegating: undefined;
  /**
   *The account currently has votes attached to it and the operation cannot succeed until
   *these are removed, either through `unvote` or `reap_vote`.
   */
  VotesExist: undefined;
  /**
   *The instant referendum origin is currently disallowed.
   */
  InstantNotAllowed: undefined;
  /**
   *Delegation to oneself makes no sense.
   */
  Nonsense: undefined;
  /**
   *Invalid upper bound.
   */
  WrongUpperBound: undefined;
  /**
   *Maximum number of votes reached.
   */
  MaxVotesReached: undefined;
  /**
   *Maximum number of items reached.
   */
  TooMany: undefined;
  /**
   *Voting period too low
   */
  VotingPeriodLow: undefined;
  /**
   *The preimage does not exist.
   */
  PreimageNotExist: undefined;
}>;
export type I96u72l8br1ego = AnonymousEnum<{
  /**
   *Cannot vote when no candidates or members exist.
   */
  UnableToVote: undefined;
  /**
   *Must vote for at least one candidate.
   */
  NoVotes: undefined;
  /**
   *Cannot vote more than candidates.
   */
  TooManyVotes: undefined;
  /**
   *Cannot vote more than maximum allowed.
   */
  MaximumVotesExceeded: undefined;
  /**
   *Cannot vote with stake less than minimum balance.
   */
  LowBalance: undefined;
  /**
   *Voter can not pay voting bond.
   */
  UnableToPayBond: undefined;
  /**
   *Must be a voter.
   */
  MustBeVoter: undefined;
  /**
   *Duplicated candidate submission.
   */
  DuplicatedCandidate: undefined;
  /**
   *Too many candidates have been created.
   */
  TooManyCandidates: undefined;
  /**
   *Member cannot re-submit candidacy.
   */
  MemberSubmit: undefined;
  /**
   *Runner cannot re-submit candidacy.
   */
  RunnerUpSubmit: undefined;
  /**
   *Candidate does not have enough funds.
   */
  InsufficientCandidateFunds: undefined;
  /**
   *Not a member.
   */
  NotMember: undefined;
  /**
   *The provided count of number of candidates is incorrect.
   */
  InvalidWitnessData: undefined;
  /**
   *The provided count of number of votes is incorrect.
   */
  InvalidVoteCount: undefined;
  /**
   *The renouncing origin presented a wrong `Renouncing` parameter.
   */
  InvalidRenouncing: undefined;
  /**
   *Prediction regarding replacement after member removal is wrong.
   */
  InvalidReplacement: undefined;
}>;
export type Icapevgbpfn5p9 = AnonymousEnum<{
  /**
   *Account is not a member
   */
  NotMember: undefined;
  /**
   *Duplicate proposals not allowed
   */
  DuplicateProposal: undefined;
  /**
   *Proposal must exist
   */
  ProposalMissing: undefined;
  /**
   *Mismatched index
   */
  WrongIndex: undefined;
  /**
   *Duplicate vote ignored
   */
  DuplicateVote: undefined;
  /**
   *Members are already initialized!
   */
  AlreadyInitialized: undefined;
  /**
   *The close call was made too early, before the end of the voting.
   */
  TooEarly: undefined;
  /**
   *There can only be a maximum of `MaxProposals` active proposals.
   */
  TooManyProposals: undefined;
  /**
   *The given weight bound for the proposal was too low.
   */
  WrongProposalWeight: undefined;
  /**
   *The given length bound for the proposal was too low.
   */
  WrongProposalLength: undefined;
  /**
   *Prime account is not a member
   */
  PrimeAccountNotMember: undefined;
}>;
export type I8c24qlovva8mi = AnonymousEnum<{
  /**
   *The reason given is just too big.
   */
  ReasonTooBig: undefined;
  /**
   *The tip was already found/started.
   */
  AlreadyKnown: undefined;
  /**
   *The tip hash is unknown.
   */
  UnknownTip: undefined;
  /**
   *The tip given was too generous.
   */
  MaxTipAmountExceeded: undefined;
  /**
   *The account attempting to retract the tip is not the finder of the tip.
   */
  NotFinder: undefined;
  /**
   *The tip cannot be claimed/closed because there are not enough tippers yet.
   */
  StillOpen: undefined;
  /**
   *The tip cannot be claimed/closed because it's still in the countdown period.
   */
  Premature: undefined;
}>;
export type I96objte63brjr = AnonymousEnum<{
  /**
   *Max signed limits not respected.
   */
  MaxSignedLimits: undefined;
  /**
   *A key was longer than the configured maximum.
   *
   *This means that the migration halted at the current [`Progress`] and
   *can be resumed with a larger [`crate::Config::MaxKeyLen`] value.
   *Retrying with the same [`crate::Config::MaxKeyLen`] value will not work.
   *The value should only be increased to avoid a storage migration for the currently
   *stored [`crate::Progress::LastKey`].
   */
  KeyTooLong: undefined;
  /**
   *submitter does not have enough funds.
   */
  NotEnoughFunds: undefined;
  /**
   *Bad witness data provided.
   */
  BadWitness: undefined;
  /**
   *Signed migration is not allowed because the maximum limit is not set yet.
   */
  SignedMigrationNotAllowed: undefined;
  /**
   *Bad child root provided.
   */
  BadChildRoot: undefined;
}>;
export type Idfa8k8ikssbsf = AnonymousEnum<{
  /**
   *Poll is not ongoing.
   */
  NotOngoing: undefined;
  /**
   *The given account did not vote on the poll.
   */
  NotVoter: undefined;
  /**
   *The actor has no permission to conduct the action.
   */
  NoPermission: undefined;
  /**
   *The actor has no permission to conduct the action right now but will do in the future.
   */
  NoPermissionYet: undefined;
  /**
   *The account is already delegating.
   */
  AlreadyDelegating: undefined;
  /**
   *The account currently has votes attached to it and the operation cannot succeed until
   *these are removed through `remove_vote`.
   */
  AlreadyVoting: undefined;
  /**
   *Too high a balance was provided that the account cannot afford.
   */
  InsufficientFunds: undefined;
  /**
   *The account is not currently delegating.
   */
  NotDelegating: undefined;
  /**
   *Delegation to oneself makes no sense.
   */
  Nonsense: undefined;
  /**
   *Maximum number of votes reached.
   */
  MaxVotesReached: undefined;
  /**
   *The class must be supplied since it is not easily determinable from the state.
   */
  ClassNeeded: undefined;
  /**
   *The class ID supplied is invalid.
   */
  BadClass: undefined;
}>;
export type I84u4ul208g742 = AnonymousEnum<{
  /**
   *Referendum is not ongoing.
   */
  NotOngoing: undefined;
  /**
   *Referendum's decision deposit is already paid.
   */
  HasDeposit: undefined;
  /**
   *The track identifier given was invalid.
   */
  BadTrack: undefined;
  /**
   *There are already a full complement of referenda in progress for this track.
   */
  Full: undefined;
  /**
   *The queue of the track is empty.
   */
  QueueEmpty: undefined;
  /**
   *The referendum index provided is invalid in this context.
   */
  BadReferendum: undefined;
  /**
   *There was nothing to do in the advancement.
   */
  NothingToDo: undefined;
  /**
   *No track exists for the proposal origin.
   */
  NoTrack: undefined;
  /**
   *Any deposit cannot be refunded until after the decision is over.
   */
  Unfinished: undefined;
  /**
   *The deposit refunder is not the depositor.
   */
  NoPermission: undefined;
  /**
   *The deposit cannot be refunded since none was made.
   */
  NoDeposit: undefined;
  /**
   *The referendum status is invalid for this operation.
   */
  BadStatus: undefined;
  /**
   *The preimage does not exist.
   */
  PreimageNotExist: undefined;
  /**
   *The preimage is stored with a different length than the one provided.
   */
  PreimageStoredWithDifferentLength: undefined;
}>;
export type I15nctscutpbeh = AnonymousEnum<{
  /**
   *The preimage of the call hash could not be loaded.
   */
  UnavailablePreImage: undefined;
  /**
   *The call could not be decoded.
   */
  UndecodableCall: undefined;
  /**
   *The weight of the decoded call was higher than the witness.
   */
  InvalidCallWeightWitness: undefined;
  /**
   *The call was not whitelisted.
   */
  CallIsNotWhitelisted: undefined;
  /**
   *The call was already whitelisted; No-Op.
   */
  CallAlreadyWhitelisted: undefined;
}>;
export type Iimgfr2idjdm4 = AnonymousEnum<{
  /**
   *Asset ID is not available. This only happens when it reaches the MAX value of given id type.
   */
  NoIdAvailable: undefined;
  /**
   *Invalid asset name or symbol.
   */
  AssetNotFound: undefined;
  /**
   *Length of name or symbol is less than min. length.
   */
  TooShort: undefined;
  /**
   *Asset's symbol can't contain whitespace characters .
   */
  InvalidSymbol: undefined;
  /**
   *Asset ID is not registered in the asset-registry.
   */
  AssetNotRegistered: undefined;
  /**
   *Asset is already registered.
   */
  AssetAlreadyRegistered: undefined;
  /**
   *Incorrect number of assets provided to create shared asset.
   */
  InvalidSharedAssetLen: undefined;
  /**
   *Cannot update asset location.
   */
  CannotUpdateLocation: undefined;
  /**
   *Selected asset id is out of reserved range.
   */
  NotInReservedRange: undefined;
  /**
   *Location already registered with different asset.
   */
  LocationAlreadyRegistered: undefined;
  /**
   *Origin is forbidden to set/update value.
   */
  Forbidden: undefined;
  /**
   *Balance too low.
   */
  InsufficientBalance: undefined;
  /**
   *Sufficient assets can't be changed to insufficient.
   */
  ForbiddenSufficiencyChange: undefined;
  /**
   *Asset is already banned.
   */
  AssetAlreadyBanned: undefined;
  /**
   *Asset is not banned.
   */
  AssetNotBanned: undefined;
}>;
export type Ieesotejglstun = AnonymousEnum<{
  /**
   *Ethereum signature is not valid
   */
  InvalidEthereumSignature: undefined;
  /**
   *Claim is not valid
   */
  NoClaimOrAlreadyClaimed: undefined;
  /**
   *Value reached maximum and cannot be incremented further
   */
  BalanceOverflow: undefined;
}>;
export type I9n81uie6vm9j8 = AnonymousEnum<{
  /**
   *Balance too low
   */
  InsufficientBalance: undefined;
  /**
   *Asset is already in omnipool
   */
  AssetAlreadyAdded: undefined;
  /**
   *Asset is not in omnipool
   */
  AssetNotFound: undefined;
  /**
   *Failed to add token to Omnipool due to insufficient initial liquidity.
   */
  MissingBalance: undefined;
  /**
   *Invalid initial asset price.
   */
  InvalidInitialAssetPrice: undefined;
  /**
   *Slippage protection - minimum limit has not been reached.
   */
  BuyLimitNotReached: undefined;
  /**
   *Slippage protection - maximum limit has been exceeded.
   */
  SellLimitExceeded: undefined;
  /**
   *Position has not been found.
   */
  PositionNotFound: undefined;
  /**
   *Insufficient shares in position
   */
  InsufficientShares: undefined;
  /**
   *Asset is not allowed to be traded.
   */
  NotAllowed: undefined;
  /**
   *Signed account is not owner of position instance.
   */
  Forbidden: undefined;
  /**
   *Asset weight cap has been exceeded.
   */
  AssetWeightCapExceeded: undefined;
  /**
   *Asset is not registered in asset registry
   */
  AssetNotRegistered: undefined;
  /**
   *Provided liquidity is below minimum allowed limit
   */
  InsufficientLiquidity: undefined;
  /**
   *Traded amount is below minimum allowed limit
   */
  InsufficientTradingAmount: undefined;
  /**
   *Sell or buy with same asset ids is not allowed.
   */
  SameAssetTradeNotAllowed: undefined;
  /**
   *LRNA update after trade results in positive value.
   */
  HubAssetUpdateError: undefined;
  /**
   *Imbalance results in positive value.
   */
  PositiveImbalance: undefined;
  /**
   *Amount of shares provided cannot be 0.
   */
  InvalidSharesAmount: undefined;
  /**
   *Hub asset is only allowed to be sold.
   */
  InvalidHubAssetTradableState: undefined;
  /**
   *Asset is not allowed to be refunded.
   */
  AssetRefundNotAllowed: undefined;
  /**
   *Max fraction of asset to buy has been exceeded.
   */
  MaxOutRatioExceeded: undefined;
  /**
   *Max fraction of asset to sell has been exceeded.
   */
  MaxInRatioExceeded: undefined;
  /**
   *Max allowed price difference has been exceeded.
   */
  PriceDifferenceTooHigh: undefined;
  /**
   *Invalid oracle price - division by zero.
   */
  InvalidOraclePrice: undefined;
  /**
   *Failed to calculate withdrawal fee.
   */
  InvalidWithdrawalFee: undefined;
  /**
   *More than allowed amount of fee has been transferred.
   */
  FeeOverdraft: undefined;
  /**
   *Token cannot be removed from Omnipool due to shares still owned by other users.
   */
  SharesRemaining: undefined;
  /**
   *Token cannot be removed from Omnipool because asset is not frozen.
   */
  AssetNotFrozen: undefined;
  /**
   *Calculated amount out from sell trade is zero.
   */
  ZeroAmountOut: undefined;
  /**
   *Existential deposit of asset is not available.
   */
  ExistentialDepositNotAvailable: undefined;
  /**
   *Slippage protection
   */
  SlippageLimit: undefined;
}>;
export type Ia4jj5ajguk6ba = AnonymousEnum<{
  /**
   *can not pause
   */
  CannotPause: undefined;
  /**
   *invalid character encoding
   */
  InvalidCharacter: undefined;
  /**
   *pallet name or function name is too long
   */
  NameTooLong: undefined;
}>;
export type Igjgeha0sds9v = AnonymousEnum<{
  /**
   *Account is excluded from dusting.
   */
  AccountBlacklisted: undefined;
  /**
   *Account is not present in the non-dustable list.
   */
  AccountNotBlacklisted: undefined;
  /**
   *The balance is zero.
   */
  ZeroBalance: undefined;
  /**
   *The balance is sufficient to keep account open.
   */
  BalanceSufficient: undefined;
  /**
   *Dust account is not set.
   */
  DustAccountNotSet: undefined;
  /**
   *Reserve account is not set.
   */
  ReserveAccountNotSet: undefined;
}>;
export type Ib26q43rgjm5dv = AnonymousEnum<{
  /**
   *Global farm does not exist.
   */
  GlobalFarmNotFound: undefined;
  /**
   *Yield farm does not exist.
   */
  YieldFarmNotFound: undefined;
  /**
   *Multiple claims in the same period is not allowed.
   */
  DoubleClaimInPeriod: undefined;
  /**
   *Liquidity mining is canceled.
   */
  LiquidityMiningCanceled: undefined;
  /**
   *Liquidity mining is not canceled.
   */
  LiquidityMiningIsActive: undefined;
  /**
   *Liquidity mining is in `active` or `terminated` state and action cannot be completed.
   */
  LiquidityMiningIsNotStopped: undefined;
  /**
   *LP shares amount is not valid.
   */
  InvalidDepositAmount: undefined;
  /**
   *Account is not allowed to perform action.
   */
  Forbidden: undefined;
  /**
   *Yield farm multiplier can't be 0.
   */
  InvalidMultiplier: undefined;
  /**
   *Yield farm with given `amm_pool_id` already exists in global farm.
   */
  YieldFarmAlreadyExists: undefined;
  /**
   *Loyalty curve's initial reward percentage is not valid. Valid range is: [0, 1).
   */
  InvalidInitialRewardPercentage: undefined;
  /**
   *One or more yield farms exist in global farm.
   */
  GlobalFarmIsNotEmpty: undefined;
  /**
   *Farm's `incentivized_asset` is missing in provided asset pair.
   */
  MissingIncentivizedAsset: undefined;
  /**
   *Reward currency balance is not sufficient.
   */
  InsufficientRewardCurrencyBalance: undefined;
  /**
   *Blocks per period can't be 0.
   */
  InvalidBlocksPerPeriod: undefined;
  /**
   *Yield per period can't be 0.
   */
  InvalidYieldPerPeriod: undefined;
  /**
   *Total rewards is less than `MinTotalFarmRewards`.
   */
  InvalidTotalRewards: undefined;
  /**
   *Planned yielding periods is less than `MinPlannedYieldingPeriods`.
   */
  InvalidPlannedYieldingPeriods: undefined;
  /**
   *Maximum number of locks reached for deposit.
   */
  MaxEntriesPerDeposit: undefined;
  /**
   *Trying to lock LP shares into already locked yield farm.
   */
  DoubleLock: undefined;
  /**
   *Yield farm entry doesn't exist for given deposit.
   */
  YieldFarmEntryNotFound: undefined;
  /**
   *Max number of yield farms in global farm was reached. Global farm can't accept new
   *yield farms until some yield farm is not removed from storage.
   */
  GlobalFarmIsFull: undefined;
  /**
   *Invalid min. deposit was set for global farm.
   */
  InvalidMinDeposit: undefined;
  /**
   *Price adjustment multiplier can't be 0.
   */
  InvalidPriceAdjustment: undefined;
  /**
   *Account creation from id failed.
   */
  ErrorGetAccountId: undefined;
  /**
   *Value of deposited shares amount in reward currency is bellow min. limit.
   */
  IncorrectValuedShares: undefined;
  /**
   *`reward_currency` is not registered in asset registry.
   */
  RewardCurrencyNotRegistered: undefined;
  /**
   *`incentivized_asset` is not registered in asset registry.
   */
  IncentivizedAssetNotRegistered: undefined;
  /**
   *Action cannot be completed because unexpected error has occurred. This should be reported
   *to protocol maintainers.
   */
  InconsistentState: Anonymize<Ibplkiqg5rvr3e>;
}>;
export type Ibplkiqg5rvr3e = AnonymousEnum<{
  YieldFarmNotFound: undefined;
  GlobalFarmNotFound: undefined;
  LiquidityIsNotActive: undefined;
  GlobalFarmIsNotActive: undefined;
  DepositNotFound: undefined;
  InvalidPeriod: undefined;
  NotEnoughRewardsInYieldFarm: undefined;
  InvalidLiveYielFarmsCount: undefined;
  InvalidTotalYieldFarmsCount: undefined;
  InvalidYieldFarmEntriesCount: undefined;
  InvalidTotalShares: undefined;
  InvalidValuedShares: undefined;
  InvalidTotalSharesZ: undefined;
  InvalidPaidAccumulatedRewards: undefined;
  InvalidFarmId: undefined;
  InvalidLoyaltyMultiplier: undefined;
  NoExistentialDepositForAsset: undefined;
}>;
export type I3pmdtg46in2f0 = AnonymousEnum<{
  /**
   *Asset is not in the omnipool.
   */
  AssetNotFound: undefined;
  /**
   *Signed account is not owner of the deposit.
   */
  Forbidden: undefined;
  /**
   *Rewards to claim are 0.
   */
  ZeroClaimedRewards: undefined;
  /**
   *Action cannot be completed because unexpected error has occurred. This should be reported
   *to protocol maintainers.
   */
  InconsistentState: Anonymize<Icnmrtlo128skq>;
  /**
   *Oracle could not be found for requested assets.
   */
  OracleNotAvailable: undefined;
  /**
   *Oracle providing `price_adjustment` could not be found for requested assets.
   */
  PriceAdjustmentNotAvailable: undefined;
  /**
   *No farms specified to join
   */
  NoFarmEntriesSpecified: undefined;
}>;
export type Icnmrtlo128skq = AnonymousEnum<{
  MissingLpPosition: undefined;
  DepositDataNotFound: undefined;
}>;
export type I1kp1c5al384as = AnonymousEnum<{
  /**
   *Asset does not exist in registry
   */
  AssetNotRegistered: undefined;
  /**
   *Order cannot be found
   */
  OrderNotFound: undefined;
  /**
   *Size of order ID exceeds the bound
   */
  OrderIdOutOfBound: undefined;
  /**
   *Cannot partially fill an order which is not partially fillable
   */
  OrderNotPartiallyFillable: undefined;
  /**
   *Order amount_in and amount_out must at all times be greater than the existential deposit
   *for the asset multiplied by the ExistentialDepositMultiplier.
   *A fill order may not leave behind amounts smaller than this.
   */
  OrderAmountTooSmall: undefined;
  /**
   *Error with math calculations
   */
  MathError: undefined;
  /**
   *The caller does not have permission to complete the action
   */
  Forbidden: undefined;
  /**
   *Reserved amount not sufficient.
   */
  InsufficientReservedAmount: undefined;
}>;
export type I4vmqfcgsdr1l9 = AnonymousEnum<{
  /**
   *Invalid value for a limit. Limit must be non-zero.
   */
  InvalidLimitValue: undefined;
  /**
   *Allowed liquidity limit is not stored for asset
   */
  LiquidityLimitNotStoredForAsset: undefined;
  /**
   *Token trade outflow per block has been reached
   */
  TokenOutflowLimitReached: undefined;
  /**
   *Token trade influx per block has been reached
   */
  TokenInfluxLimitReached: undefined;
  /**
   *Maximum pool's liquidity limit per block has been reached
   */
  MaxLiquidityLimitPerBlockReached: undefined;
  /**
   *Asset is not allowed to have a limit
   */
  NotAllowed: undefined;
}>;
export type Ifntb1290uuatm = AnonymousEnum<{
  /**
   *The trading limit has been reached
   */
  TradingLimitReached: undefined;
  /**
   *The the max number of trades limit is reached
   */
  MaxTradesExceeded: undefined;
  /**
   *The AMM pool is not supported for executing trades
   */
  PoolNotSupported: undefined;
  /**
   *The user has not enough balance to execute the trade
   */
  InsufficientBalance: undefined;
  /**
   *The calculation of route trade amounts failed in the underlying AMM
   */
  RouteCalculationFailed: undefined;
  /**
   *The route is invalid
   */
  InvalidRoute: undefined;
  /**
   *The route update was not successful
   */
  RouteUpdateIsNotSuccessful: undefined;
  /**
   *Route contains assets that has no oracle data
   */
  RouteHasNoOracle: undefined;
  /**
   *The route execution failed in the underlying AMM
   */
  InvalidRouteExecution: undefined;
  /**
   *Trading same assets is not allowed.
   */
  NotAllowed: undefined;
}>;
export type Idhbjtd7at0b1k = AnonymousEnum<{
  /**
   *Balance is too low.
   */
  InsufficientBalance: undefined;
  /**
   *Staked amount is too low.
   */
  InsufficientStake: undefined;
  /**
   *Staking position has not been found.
   */
  PositionNotFound: undefined;
  /**
   *Maximum amount of votes were reached for staking position.
   */
  MaxVotesReached: undefined;
  /**
   *Staking is not initialized.
   */
  NotInitialized: undefined;
  /**
   *Staking is already initialized.
   */
  AlreadyInitialized: undefined;
  /**
   *Arithmetic error.
   */
  Arithmetic: undefined;
  /**
   *Pot's balance is zero.
   */
  MissingPotBalance: undefined;
  /**
   *Account's position already exists.
   */
  PositionAlreadyExists: undefined;
  /**
   *Signer is not an owner of the staking position.
   */
  Forbidden: undefined;
  /**
   *Position contains registered votes.
   */
  ExistingVotes: undefined;
  /**
   *Position contains processed votes. Removed these votes first before increasing stake or claiming.
   */
  ExistingProcessedVotes: undefined;
  /**
   *Action cannot be completed because unexpected error has occurred. This should be reported
   *to protocol maintainers.
   */
  InconsistentState: Anonymize<Icojqvn3afk41n>;
}>;
export type Icojqvn3afk41n = AnonymousEnum<{
  PositionNotFound: undefined;
  NegativePendingRewards: undefined;
  NegativeUnpaidRewards: undefined;
  TooManyPositions: undefined;
  Arithmetic: undefined;
}>;
export type I8eh9m8533v1sf = AnonymousEnum<{
  /**
   *Creating a pool with same assets or less than 2 assets is not allowed.
   */
  IncorrectAssets: undefined;
  /**
   *Maximum number of assets has been exceeded.
   */
  MaxAssetsExceeded: undefined;
  /**
   *A pool with given assets does not exist.
   */
  PoolNotFound: undefined;
  /**
   *A pool with given assets already exists.
   */
  PoolExists: undefined;
  /**
   *Asset is not in the pool.
   */
  AssetNotInPool: undefined;
  /**
   *Share asset is not registered in Registry.
   */
  ShareAssetNotRegistered: undefined;
  /**
   *Share asset is amount assets when creating a pool.
   */
  ShareAssetInPoolAssets: undefined;
  /**
   *One or more assets are not registered in AssetRegistry
   */
  AssetNotRegistered: undefined;
  /**
   *Invalid asset amount provided. Amount must be greater than zero.
   */
  InvalidAssetAmount: undefined;
  /**
   *Balance of an asset is not sufficient to perform a trade.
   */
  InsufficientBalance: undefined;
  /**
   *Balance of a share asset is not sufficient to withdraw liquidity.
   */
  InsufficientShares: undefined;
  /**
   *Liquidity has not reached the required minimum.
   */
  InsufficientLiquidity: undefined;
  /**
   *Insufficient liquidity left in the pool after withdrawal.
   */
  InsufficientLiquidityRemaining: undefined;
  /**
   *Amount is less than the minimum trading amount configured.
   */
  InsufficientTradingAmount: undefined;
  /**
   *Minimum limit has not been reached during trade.
   */
  BuyLimitNotReached: undefined;
  /**
   *Maximum limit has been exceeded during trade.
   */
  SellLimitExceeded: undefined;
  /**
   *Initial liquidity of asset must be > 0.
   */
  InvalidInitialLiquidity: undefined;
  /**
   *Amplification is outside configured range.
   */
  InvalidAmplification: undefined;
  /**
   *Remaining balance of share asset is below asset's existential deposit.
   */
  InsufficientShareBalance: undefined;
  /**
   *Not allowed to perform an operation on given asset.
   */
  NotAllowed: undefined;
  /**
   *Future block number is in the past.
   */
  PastBlock: undefined;
  /**
   *New amplification is equal to the previous value.
   */
  SameAmplification: undefined;
  /**
   *Slippage protection.
   */
  SlippageLimit: undefined;
  /**
   *Failed to retrieve asset decimals.
   */
  UnknownDecimals: undefined;
}>;
export type Ibj08k850p0j34 = AnonymousEnum<{
  /**
   *Bond not registered
   */
  NotRegistered: undefined;
  /**
   *Bond is not mature
   */
  NotMature: undefined;
  /**
   *Maturity not long enough
   */
  InvalidMaturity: undefined;
  /**
   *Asset type not allowed for underlying asset
   */
  DisallowedAsset: undefined;
  /**
   *Asset is not registered in `AssetRegistry`
   */
  AssetNotFound: undefined;
  /**
   *Generated name is not valid.
   */
  InvalidBondName: undefined;
  /**
   *Bond's name parsing was now successful
   */
  FailToParseName: undefined;
}>;
export type I1jtj4pc4jltpf = AnonymousEnum<{
  /**
   *Otc order not found
   */
  OrderNotFound: undefined;
  /**
   *OTC order is not partially fillable
   */
  NotPartiallyFillable: undefined;
  /**
   *Provided route doesn't match the existing route
   */
  InvalidRoute: undefined;
  /**
   *Initial and final balance are different
   */
  BalanceInconsistency: undefined;
  /**
   *Trade amount higher than necessary
   */
  TradeAmountTooHigh: undefined;
  /**
   *Trade amount lower than necessary
   */
  TradeAmountTooLow: undefined;
  /**
   *Price for a route is not available
   */
  PriceNotAvailable: undefined;
}>;
export type Ic99uoklag6hh0 = AnonymousEnum<{
  /**
   *Pool assets can not be the same
   */
  CannotCreatePoolWithSameAssets: undefined;
  /**
   *Account is not a pool owner
   */
  NotOwner: undefined;
  /**
   *Sale already started
   */
  SaleStarted: undefined;
  /**
   *Sale is still in progress
   */
  SaleNotEnded: undefined;
  /**
   *Sale is not running
   */
  SaleIsNotRunning: undefined;
  /**
   *Sale duration is too long
   */
  MaxSaleDurationExceeded: undefined;
  /**
   *Liquidity being added should not be zero
   */
  CannotAddZeroLiquidity: undefined;
  /**
   *Asset balance too low
   */
  InsufficientAssetBalance: undefined;
  /**
   *Pool does not exist
   */
  PoolNotFound: undefined;
  /**
   *Pool has been already created
   */
  PoolAlreadyExists: undefined;
  /**
   *Invalid block range
   */
  InvalidBlockRange: undefined;
  /**
   *Calculation error
   */
  WeightCalculationError: undefined;
  /**
   *Weight set is out of range
   */
  InvalidWeight: undefined;
  /**
   *Can not perform a trade with zero amount
   */
  ZeroAmount: undefined;
  /**
   *Trade amount is too high
   */
  MaxInRatioExceeded: undefined;
  /**
   *Trade amount is too high
   */
  MaxOutRatioExceeded: undefined;
  /**
   *Invalid fee amount
   */
  FeeAmountInvalid: undefined;
  /**
   *Trading limit reached
   */
  TradingLimitReached: undefined;
  /**
   *An unexpected integer overflow occurred
   */
  Overflow: undefined;
  /**
   *Nothing to update
   */
  NothingToUpdate: undefined;
  /**
   *Liquidity has not reached the required minimum.
   */
  InsufficientLiquidity: undefined;
  /**
   *Amount is less than minimum trading limit.
   */
  InsufficientTradingAmount: undefined;
  /**
   *Not more than one fee collector per asset id
   */
  FeeCollectorWithAssetAlreadyUsed: undefined;
}>;
export type I96k0kb8u9s0go = AnonymousEnum<{
  /**
   *It is not allowed to create a pool between same assets.
   */
  CannotCreatePoolWithSameAssets: undefined;
  /**
   *Liquidity has not reached the required minimum.
   */
  InsufficientLiquidity: undefined;
  /**
   *Amount is less than min trading limit.
   */
  InsufficientTradingAmount: undefined;
  /**
   *Liquidity is zero.
   */
  ZeroLiquidity: undefined;
  /**
   *It is not allowed to create a pool with zero initial price.
   *Not used, kept for backward compatibility
   */
  ZeroInitialPrice: undefined;
  /**
   *Overflow
   *Not used, kept for backward compatibility
   */
  CreatePoolAssetAmountInvalid: undefined;
  /**
   *Overflow
   */
  InvalidMintedLiquidity: undefined;
  /**
   *Overflow
   */
  InvalidLiquidityAmount: undefined;
  /**
   *Asset amount has exceeded given limit.
   */
  AssetAmountExceededLimit: undefined;
  /**
   *Asset amount has not reached given limit.
   */
  AssetAmountNotReachedLimit: undefined;
  /**
   *Asset balance is not sufficient.
   */
  InsufficientAssetBalance: undefined;
  /**
   *Not enough asset liquidity in the pool.
   */
  InsufficientPoolAssetBalance: undefined;
  /**
   *Not enough core asset liquidity in the pool.
   */
  InsufficientNativeCurrencyBalance: undefined;
  /**
   *Liquidity pool for given assets does not exist.
   */
  TokenPoolNotFound: undefined;
  /**
   *Liquidity pool for given assets already exists.
   */
  TokenPoolAlreadyExists: undefined;
  /**
   *Overflow
   */
  AddAssetAmountInvalid: undefined;
  /**
   *Overflow
   */
  RemoveAssetAmountInvalid: undefined;
  /**
   *Overflow
   */
  SellAssetAmountInvalid: undefined;
  /**
   *Overflow
   */
  BuyAssetAmountInvalid: undefined;
  /**
   *Overflow
   */
  FeeAmountInvalid: undefined;
  /**
   *Overflow
   */
  CannotApplyDiscount: undefined;
  /**
   *Max fraction of pool to buy in single transaction has been exceeded.
   */
  MaxOutRatioExceeded: undefined;
  /**
   *Max fraction of pool to sell in single transaction has been exceeded.
   */
  MaxInRatioExceeded: undefined;
  /**
   *Overflow
   */
  Overflow: undefined;
  /**
   *Pool cannot be created due to outside factors.
   */
  CannotCreatePool: undefined;
}>;
export type Iaqb0qr3l7g0ub = AnonymousEnum<{
  /**
   *Referral code is too long.
   */
  TooLong: undefined;
  /**
   *Referral code is too short.
   */
  TooShort: undefined;
  /**
   *Referral code contains invalid character. Only alphanumeric characters are allowed.
   */
  InvalidCharacter: undefined;
  /**
   *Referral code already exists.
   */
  AlreadyExists: undefined;
  /**
   *Provided referral code is invalid. Either does not exist or is too long.
   */
  InvalidCode: undefined;
  /**
   *Account is already linked to another referral account.
   */
  AlreadyLinked: undefined;
  /**
   *Nothing in the referral pot account for the asset.
   */
  ZeroAmount: undefined;
  /**
   *Linking an account to the same referral account is not allowed.
   */
  LinkNotAllowed: undefined;
  /**
   *Calculated rewards are more than the fee amount. This can happen if percentages are incorrectly set.
   */
  IncorrectRewardCalculation: undefined;
  /**
   *Given referrer and trader percentages exceeds 100% percent.
   */
  IncorrectRewardPercentage: undefined;
  /**
   *The account has already a code registered.
   */
  AlreadyRegistered: undefined;
  /**
   *Price for given asset pair not found.
   */
  PriceNotFound: undefined;
  /**
   *Minimum trading amount for conversion has not been reached.
   */
  ConversionMinTradingAmountNotReached: undefined;
  /**
   *Zero amount received from conversion.
   */
  ConversionZeroAmountReceived: undefined;
}>;
export type I2isghqcs9gp7d = AnonymousEnum<{
  /**
   *AssetId to EVM address conversion failed
   */
  AssetConversionFailed: undefined;
  /**
   *Liquidation call failed
   */
  LiquidationCallFailed: undefined;
  /**
   *Provided route doesn't match the existing route
   */
  InvalidRoute: undefined;
  /**
   *Liquidation was not profitable enough to repay flash loan
   */
  NotProfitable: undefined;
}>;
export type Icc7o7ep6n36h2 = AnonymousEnum<{
  /**
   *The balance is too low
   */
  BalanceTooLow: undefined;
  /**
   *Cannot convert Amount into Balance type
   */
  AmountIntoBalanceFailed: undefined;
  /**
   *Failed because liquidity restrictions due to locking
   */
  LiquidityRestrictions: undefined;
  /**
   *Failed because the maximum locks was exceeded
   */
  MaxLocksExceeded: undefined;
  /**
   *Transfer/payment would kill account
   */
  KeepAlive: undefined;
  /**
   *Value too low to create account due to existential deposit
   */
  ExistentialDeposit: undefined;
  /**
   *Beneficiary account must pre-exist
   */
  DeadAccount: undefined;
  TooManyReserves: undefined;
}>;
export type Iejalhtid1s0pt = AnonymousEnum<{
  /**
   *Unable to convert the Amount type into Balance.
   */
  AmountIntoBalanceFailed: undefined;
  /**
   *Balance is too low.
   */
  BalanceTooLow: undefined;
  /**
   *Deposit result is not expected
   */
  DepositFailed: undefined;
  /**
   *Operation is not supported for this currency
   */
  NotSupported: undefined;
}>;
export type Ifkcmnj410r9fh = AnonymousEnum<{
  /**
   *Vesting period is zero
   */
  ZeroVestingPeriod: undefined;
  /**
   *Number of vests is zero
   */
  ZeroVestingPeriodCount: undefined;
  /**
   *Insufficient amount of balance to lock
   */
  InsufficientBalanceToLock: undefined;
  /**
   *This account have too many vesting schedules
   */
  TooManyVestingSchedules: undefined;
  /**
   *The vested transfer amount is too low
   */
  AmountLow: undefined;
  /**
   *Failed because the maximum vesting schedules was exceeded
   */
  MaxVestingSchedulesExceeded: undefined;
}>;
export type I4pkfap0t7vk0t = AnonymousEnum<{
  /**
   *Not enough balance to perform action
   */
  BalanceLow: undefined;
  /**
   *Calculating total fee overflowed
   */
  FeeOverflow: undefined;
  /**
   *Calculating total payment overflowed
   */
  PaymentOverflow: undefined;
  /**
   *Withdraw fee failed
   */
  WithdrawFailed: undefined;
  /**
   *Gas price is too low.
   */
  GasPriceTooLow: undefined;
  /**
   *Nonce is invalid
   */
  InvalidNonce: undefined;
  /**
   *Gas limit is too low.
   */
  GasLimitTooLow: undefined;
  /**
   *Gas limit is too high.
   */
  GasLimitTooHigh: undefined;
  /**
   *The chain id is invalid.
   */
  InvalidChainId: undefined;
  /**
   *the signature is invalid.
   */
  InvalidSignature: undefined;
  /**
   *EVM reentrancy
   */
  Reentrancy: undefined;
  /**
   *EIP-3607,
   */
  TransactionMustComeFromEOA: undefined;
  /**
   *Undefined error.
   */
  Undefined: undefined;
}>;
export type I1mp6vnoh32l4q = AnonymousEnum<{
  /**
   *Signature is invalid.
   */
  InvalidSignature: undefined;
  /**
   *Pre-log is present, therefore transact is not allowed.
   */
  PreLogExists: undefined;
}>;
export type Ie65vecqacffpm = AnonymousEnum<{
  /**
   *Active EVM account cannot be bound
   */
  TruncatedAccountAlreadyUsed: undefined;
  /**
   *Address is already bound
   */
  AddressAlreadyBound: undefined;
  /**
   *Bound address cannot be used
   */
  BoundAddressCannotBeUsed: undefined;
  /**
   *Address not whitelisted
   */
  AddressNotWhitelisted: undefined;
}>;
export type I6q09f6hmj7elp = AnonymousEnum<{
  /**
   *Nft pallet didn't return an owner.
   */
  CantFindDepositOwner: undefined;
  /**
   *Account balance of XYK pool shares is not sufficient.
   */
  InsufficientXykSharesBalance: undefined;
  /**
   *XYK pool does not exist
   */
  XykPoolDoesntExist: undefined;
  /**
   *Account is not deposit owner.
   */
  NotDepositOwner: undefined;
  /**
   *XYK did not return assets for given pool id
   */
  CantGetXykAssets: undefined;
  /**
   *Deposit data not found
   */
  DepositDataNotFound: undefined;
  /**
   *Calculated reward to claim is 0.
   */
  ZeroClaimedRewards: undefined;
  /**
   *Asset is not in the `AssetPair`.
   */
  AssetNotInAssetPair: undefined;
  /**
   *Provided `AssetPair` is not used by the deposit.
   */
  InvalidAssetPair: undefined;
  /**
   *Asset is not registered in asset registry.
   */
  AssetNotRegistered: undefined;
  /**
   *Failed to calculate `pot`'s account.
   */
  FailToGetPotId: undefined;
  /**
   *No global farm - yield farm pairs specified to join
   */
  NoFarmsSpecified: undefined;
}>;
export type Ic4d0pk1ndfilm = AnonymousEnum<{
  /**
   *Schedule not exist
   */
  ScheduleNotFound: undefined;
  /**
   *The min trade amount is not reached
   */
  MinTradeAmountNotReached: undefined;
  /**
   *Forbidden as the user is not the owner of the schedule
   */
  Forbidden: undefined;
  /**
   *The next execution block number is not in the future
   */
  BlockNumberIsNotInFuture: undefined;
  /**
   *Price is unstable as price change from oracle data is bigger than max allowed
   */
  PriceUnstable: undefined;
  /**
   *Order was randomly rescheduled to next block
   */
  Bumped: undefined;
  /**
   *Error occurred when calculating price
   */
  CalculatingPriceError: undefined;
  /**
   *The total amount to be reserved is smaller than min budget
   */
  TotalAmountIsSmallerThanMinBudget: undefined;
  /**
   *The budget is too low for executing at least two orders
   */
  BudgetTooLow: undefined;
  /**
   *There is no free block found to plan DCA execution
   */
  NoFreeBlockFound: undefined;
  /**
   *The DCA schedule has been manually terminated
   */
  ManuallyTerminated: undefined;
  /**
   *Max number of retries reached for schedule
   */
  MaxRetryReached: undefined;
  /**
   *Absolutely trade limit reached, leading to retry
   */
  TradeLimitReached: undefined;
  /**
   *Slippage limit calculated from oracle is reached, leading to retry
   */
  SlippageLimitReached: undefined;
  /**
   *No parent hash has been found from relay chain
   */
  NoParentHashFound: undefined;
  /**
   *Error that should not really happen only in case of invalid state of the schedule storage entries
   */
  InvalidState: undefined;
  /**
   *Period should be longer than 5 blocks
   */
  PeriodTooShort: undefined;
  /**
   *Stability threshold cannot be higher than `MaxConfigurablePriceDifferenceBetweenBlock`
   */
  StabilityThresholdTooHigh: undefined;
}>;
export type If7oa8fprnilo5 = AnonymousEnum<{
  /**
   *Failed to schedule a call
   */
  FailedToSchedule: undefined;
  /**
   *Cannot find the scheduled call.
   */
  NotFound: undefined;
  /**
   *Given target block number is in the past.
   */
  TargetBlockNumberInPast: undefined;
  /**
   *Reschedule failed because it does not change scheduled time.
   */
  RescheduleNoChange: undefined;
  /**
   *Attempt to use a non-named function on a named task.
   */
  Named: undefined;
}>;
export type I9aoshicggice1 = AnonymousEnum<{
  /**
   *Setting the queue config failed since one of its values was invalid.
   */
  BadQueueConfig: undefined;
  /**
   *The execution is already suspended.
   */
  AlreadySuspended: undefined;
  /**
   *The execution is already resumed.
   */
  AlreadyResumed: undefined;
}>;
export type Ifv4efjta13rhe = AnonymousEnum<{
  /**
   *The message and destination combination was not recognized as being
   *reachable.
   */
  Unreachable: undefined;
  /**
   *The message and destination was recognized as being reachable but
   *the operation could not be completed.
   */
  SendFailure: undefined;
  /**
   *The version of the `Versioned` value used is not able to be
   *interpreted.
   */
  BadVersion: undefined;
}>;
export type I8g8tbk0anjali = AnonymousEnum<{
  /**
   *Asset has no reserve location.
   */
  AssetHasNoReserve: undefined;
  /**
   *Not cross-chain transfer.
   */
  NotCrossChainTransfer: undefined;
  /**
   *Invalid transfer destination.
   */
  InvalidDest: undefined;
  /**
   *Currency is not cross-chain transferable.
   */
  NotCrossChainTransferableCurrency: undefined;
  /**
   *The message's weight could not be determined.
   */
  UnweighableMessage: undefined;
  /**
   *XCM execution failed.
   */
  XcmExecutionFailed: undefined;
  /**
   *Could not re-anchor the assets to declare the fees for the
   *destination chain.
   */
  CannotReanchor: undefined;
  /**
   *Could not get ancestry of asset reserve location.
   */
  InvalidAncestry: undefined;
  /**
   *The Asset is invalid.
   */
  InvalidAsset: undefined;
  /**
   *The destination `Location` provided cannot be inverted.
   */
  DestinationNotInvertible: undefined;
  /**
   *The version of the `Versioned` value used is not able to be
   *interpreted.
   */
  BadVersion: undefined;
  /**
   *We tried sending distinct asset and fee but they have different
   *reserve chains.
   */
  DistinctReserveForAssetAndFee: undefined;
  /**
   *The fee is zero.
   */
  ZeroFee: undefined;
  /**
   *The transfering asset amount is zero.
   */
  ZeroAmount: undefined;
  /**
   *The number of assets to be sent is over the maximum.
   */
  TooManyAssetsBeingSent: undefined;
  /**
   *The specified index does not exist in a Assets struct.
   */
  AssetIndexNonExistent: undefined;
  /**
   *Fee is not enough.
   */
  FeeNotEnough: undefined;
  /**
   *Not supported Location
   */
  NotSupportedLocation: undefined;
  /**
   *MinXcmFee not registered for certain reserve location
   */
  MinXcmFeeNotDefined: undefined;
  /**
   *Asset transfer is limited by RateLimiter.
   */
  RateLimited: undefined;
}>;
export type I5llpdov40t5vu = AnonymousEnum<{
  /**
   *The balance is too low.
   */
  BalanceTooLow: undefined;
  /**
   *The operation will cause balance to overflow.
   */
  BalanceOverflow: undefined;
  /**
   *Unhandled asset.
   */
  UnhandledAsset: undefined;
}>;
export type Iek7hro9nhqg2o = AnonymousEnum<{
  TooManyUniqueEntries: undefined;
  OnTradeValueZero: undefined;
  OracleNotFound: undefined;
}>;
export type I8rr9o6g84pu5j = AnonymousEnum<{
  /**
   *CurrencySet
   *[who, currency]
   */
  CurrencySet: Anonymize<I1o37fpk9vgbri>;
  /**
   *New accepted currency added
   *[currency]
   */
  CurrencyAdded: Anonymize<Ia5le7udkgbaq9>;
  /**
   *Accepted currency removed
   *[currency]
   */
  CurrencyRemoved: Anonymize<Ia5le7udkgbaq9>;
  /**
   *Transaction fee paid in non-native currency
   *[Account, Currency, Native fee amount, Non-native fee amount, Destination account]
   */
  FeeWithdrawn: Anonymize<I859063tfqget1>;
}>;
export type I1o37fpk9vgbri = {
  account_id: SS58String;
  asset_id: number;
};
export type I859063tfqget1 = {
  account_id: SS58String;
  asset_id: number;
  native_fee_amount: bigint;
  non_native_fee_amount: bigint;
  destination_account_id: SS58String;
};
export type I3f75km8j5v1nd = AnonymousEnum<{
  /**
   *New proposal.
   */
  Proposed: Anonymize<I44hc4lgsn4o1j>;
  /**
   *We have ended a spend period and will now allocate funds.
   */
  Spending: Anonymize<I8iksqi3eani0a>;
  /**
   *Some funds have been allocated.
   */
  Awarded: Anonymize<I16enopmju1p0q>;
  /**
   *A proposal was rejected; funds were slashed.
   */
  Rejected: Anonymize<Ifgqhle2413de7>;
  /**
   *Some of our funds have been burnt.
   */
  Burnt: Anonymize<I43kq8qudg7pq9>;
  /**
   *Spending has finished; this is the amount that rolls over until next spend.
   */
  Rollover: Anonymize<I76riseemre533>;
  /**
   *Some funds have been deposited.
   */
  Deposit: Anonymize<Ie5v6njpckr05b>;
  /**
   *A new spend proposal has been approved.
   */
  SpendApproved: Anonymize<I38bmcrmh852rk>;
  /**
   *The inactive funds of the pallet have been updated.
   */
  UpdatedInactive: Anonymize<I4hcillge8de5f>;
  /**
   *A new asset spend proposal has been approved.
   */
  AssetSpendApproved: Anonymize<I8usdc6tg7829p>;
  /**
   *An approved spend was voided.
   */
  AssetSpendVoided: Anonymize<I666bl2fqjkejo>;
  /**
   *A payment happened.
   */
  Paid: Anonymize<I666bl2fqjkejo>;
  /**
   *A payment failed and can be retried.
   */
  PaymentFailed: Anonymize<I666bl2fqjkejo>;
  /**
   *A spend was processed and removed from the storage. It might have been successfully
   *paid or it may have expired.
   */
  SpendProcessed: Anonymize<I666bl2fqjkejo>;
}>;
export type I44hc4lgsn4o1j = {
  proposal_index: number;
};
export type I8iksqi3eani0a = {
  budget_remaining: bigint;
};
export type I16enopmju1p0q = {
  proposal_index: number;
  award: bigint;
  account: SS58String;
};
export type Ifgqhle2413de7 = {
  proposal_index: number;
  slashed: bigint;
};
export type I43kq8qudg7pq9 = {
  burnt_funds: bigint;
};
export type I76riseemre533 = {
  rollover_balance: bigint;
};
export type Ie5v6njpckr05b = {
  value: bigint;
};
export type I38bmcrmh852rk = {
  proposal_index: number;
  amount: bigint;
  beneficiary: SS58String;
};
export type I4hcillge8de5f = {
  reactivated: bigint;
  deactivated: bigint;
};
export type I8usdc6tg7829p = {
  index: number;
  amount: bigint;
  beneficiary: SS58String;
  valid_from: number;
  expire_at: number;
};
export type I666bl2fqjkejo = {
  index: number;
};
export type I6env82qg39mi7 = AnonymousEnum<{
  /**
   *Batch of dispatches did not complete fully. Index of first failing dispatch given, as
   *well as the error.
   */
  BatchInterrupted: Anonymize<Idrghm97v133l7>;
  /**
   *Batch of dispatches completed fully with no error.
   */
  BatchCompleted: undefined;
  /**
   *Batch of dispatches completed but has errors.
   */
  BatchCompletedWithErrors: undefined;
  /**
   *A single item within a Batch of dispatches has completed with no error.
   */
  ItemCompleted: undefined;
  /**
   *A single item within a Batch of dispatches has completed with error.
   */
  ItemFailed: Anonymize<I2bgne8ai793cl>;
  /**
   *A call was dispatched.
   */
  DispatchedAs: Anonymize<I1d43pfvgh75ar>;
}>;
export type Idrghm97v133l7 = {
  index: number;
  error: Anonymize<I9sdjnqgsnrang>;
};
export type I2bgne8ai793cl = {
  error: Anonymize<I9sdjnqgsnrang>;
};
export type I1d43pfvgh75ar = {
  result: Anonymize<I5kcp0gmhl71c>;
};
export type I5kcp0gmhl71c = ResultPayload<undefined, Anonymize<I9sdjnqgsnrang>>;
export type PreimageEvent = Enum<{
  /**
   *A preimage has been noted.
   */
  Noted: Anonymize<I1jm8m1rh9e20v>;
  /**
   *A preimage has been requested.
   */
  Requested: Anonymize<I1jm8m1rh9e20v>;
  /**
   *A preimage has ben cleared.
   */
  Cleared: Anonymize<I1jm8m1rh9e20v>;
}>;
export declare const PreimageEvent: GetEnum<PreimageEvent>;
export type I1jm8m1rh9e20v = {
  hash: FixedSizeBinary<32>;
};
export type Ibju6hjiipokne = AnonymousEnum<{
  /**
   *A name was set or reset (which will remove all judgements).
   */
  IdentitySet: Anonymize<I4cbvqmqadhrea>;
  /**
   *A name was cleared, and the given balance returned.
   */
  IdentityCleared: Anonymize<Iep1lmt6q3s6r3>;
  /**
   *A name was removed and the given balance slashed.
   */
  IdentityKilled: Anonymize<Iep1lmt6q3s6r3>;
  /**
   *A judgement was asked from a registrar.
   */
  JudgementRequested: Anonymize<I1fac16213rie2>;
  /**
   *A judgement request was retracted.
   */
  JudgementUnrequested: Anonymize<I1fac16213rie2>;
  /**
   *A judgement was given by a registrar.
   */
  JudgementGiven: Anonymize<Ifjt77oc391o43>;
  /**
   *A registrar was added.
   */
  RegistrarAdded: Anonymize<Itvt1jsipv0lc>;
  /**
   *A sub-identity was added to an identity and the deposit paid.
   */
  SubIdentityAdded: Anonymize<Ick3mveut33f44>;
  /**
   *A sub-identity was removed from an identity and the deposit freed.
   */
  SubIdentityRemoved: Anonymize<Ick3mveut33f44>;
  /**
   *A sub-identity was cleared, and the given deposit repatriated from the
   *main identity account to the sub-identity account.
   */
  SubIdentityRevoked: Anonymize<Ick3mveut33f44>;
  /**
   *A username authority was added.
   */
  AuthorityAdded: Anonymize<I2rg5btjrsqec0>;
  /**
   *A username authority was removed.
   */
  AuthorityRemoved: Anonymize<I2rg5btjrsqec0>;
  /**
   *A username was set for `who`.
   */
  UsernameSet: Anonymize<Ibdqerrooruuq9>;
  /**
   *A username was queued, but `who` must accept it prior to `expiration`.
   */
  UsernameQueued: Anonymize<I8u2ba9jeiu6q0>;
  /**
   *A queued username passed its expiration without being claimed and was removed.
   */
  PreapprovalExpired: Anonymize<I7ieadb293k6b4>;
  /**
   *A username was set as a primary and can be looked up from `who`.
   */
  PrimaryUsernameSet: Anonymize<Ibdqerrooruuq9>;
  /**
   *A dangling username (as in, a username corresponding to an account that has removed its
   *identity) has been removed.
   */
  DanglingUsernameRemoved: Anonymize<Ibdqerrooruuq9>;
}>;
export type I1fac16213rie2 = {
  who: SS58String;
  registrar_index: number;
};
export type Ifjt77oc391o43 = {
  target: SS58String;
  registrar_index: number;
};
export type Itvt1jsipv0lc = {
  registrar_index: number;
};
export type Ick3mveut33f44 = {
  sub: SS58String;
  main: SS58String;
  deposit: bigint;
};
export type I2rg5btjrsqec0 = {
  authority: SS58String;
};
export type Ibdqerrooruuq9 = {
  who: SS58String;
  username: Binary;
};
export type I8u2ba9jeiu6q0 = {
  who: SS58String;
  username: Binary;
  expiration: number;
};
export type I7ieadb293k6b4 = {
  whose: SS58String;
};
export type Icfq8ap3e5p73t = AnonymousEnum<{
  /**
   *A motion has been proposed by a public account.
   */
  Proposed: Anonymize<I3peh714diura8>;
  /**
   *A public proposal has been tabled for referendum vote.
   */
  Tabled: Anonymize<I3peh714diura8>;
  /**
   *An external proposal has been tabled.
   */
  ExternalTabled: undefined;
  /**
   *A referendum has begun.
   */
  Started: Anonymize<I62ffgu6q2478o>;
  /**
   *A proposal has been approved by referendum.
   */
  Passed: Anonymize<Ied9mja4bq7va8>;
  /**
   *A proposal has been rejected by referendum.
   */
  NotPassed: Anonymize<Ied9mja4bq7va8>;
  /**
   *A referendum has been cancelled.
   */
  Cancelled: Anonymize<Ied9mja4bq7va8>;
  /**
   *An account has delegated their vote to another account.
   */
  Delegated: Anonymize<I10r7il4gvbcae>;
  /**
   *An account has cancelled a previous delegation operation.
   */
  Undelegated: Anonymize<Icbccs0ug47ilf>;
  /**
   *An external proposal has been vetoed.
   */
  Vetoed: Anonymize<I2c00i2bngegk9>;
  /**
   *A proposal_hash has been blacklisted permanently.
   */
  Blacklisted: Anonymize<I2ev73t79f46tb>;
  /**
   *An account has voted in a referendum
   */
  Voted: Anonymize<Iet7kfijhihjik>;
  /**
   *An account has secconded a proposal
   */
  Seconded: Anonymize<I2vrbos7ogo6ps>;
  /**
   *A proposal got canceled.
   */
  ProposalCanceled: Anonymize<I9mnj4k4u8ls2c>;
  /**
   *Metadata for a proposal or a referendum has been set.
   */
  MetadataSet: Anonymize<Iffeo46j957abe>;
  /**
   *Metadata for a proposal or a referendum has been cleared.
   */
  MetadataCleared: Anonymize<Iffeo46j957abe>;
  /**
   *Metadata has been transferred to new owner.
   */
  MetadataTransferred: Anonymize<I4ljshcevmm3p2>;
}>;
export type I3peh714diura8 = {
  proposal_index: number;
  deposit: bigint;
};
export type I62ffgu6q2478o = {
  ref_index: number;
  threshold: Anonymize<Ivbp9821csvot>;
};
export type Ivbp9821csvot = AnonymousEnum<{
  SuperMajorityApprove: undefined;
  SuperMajorityAgainst: undefined;
  SimpleMajority: undefined;
}>;
export type Ied9mja4bq7va8 = {
  ref_index: number;
};
export type I10r7il4gvbcae = {
  who: SS58String;
  target: SS58String;
};
export type I2c00i2bngegk9 = {
  who: SS58String;
  proposal_hash: FixedSizeBinary<32>;
  until: number;
};
export type I2ev73t79f46tb = {
  proposal_hash: FixedSizeBinary<32>;
};
export type Iet7kfijhihjik = {
  voter: SS58String;
  ref_index: number;
  vote: Anonymize<Ia9hdots6g53fs>;
};
export type Ia9hdots6g53fs = AnonymousEnum<{
  Standard: Anonymize<Ib024p97ls1cla>;
  Split: Anonymize<I5pi71t9bosoiv>;
}>;
export type Ib024p97ls1cla = {
  vote: number;
  balance: bigint;
};
export type I5pi71t9bosoiv = {
  aye: bigint;
  nay: bigint;
};
export type I2vrbos7ogo6ps = {
  seconder: SS58String;
  prop_index: number;
};
export type I9mnj4k4u8ls2c = {
  prop_index: number;
};
export type Iffeo46j957abe = {
  /**
   *Metadata owner.
   */
  owner: Anonymize<I2itl2k1j2q8nf>;
  /**
   *Preimage hash.
   */
  hash: FixedSizeBinary<32>;
};
export type I2itl2k1j2q8nf = AnonymousEnum<{
  External: undefined;
  Proposal: number;
  Referendum: number;
}>;
export type I4ljshcevmm3p2 = {
  /**
   *Previous metadata owner.
   */
  prev_owner: Anonymize<I2itl2k1j2q8nf>;
  /**
   *New metadata owner.
   */
  owner: Anonymize<I2itl2k1j2q8nf>;
  /**
   *Preimage hash.
   */
  hash: FixedSizeBinary<32>;
};
export type I4iamd5rd51ec2 = AnonymousEnum<{
  /**
   *A new term with new_members. This indicates that enough candidates existed to run
   *the election, not that enough have has been elected. The inner value must be examined
   *for this purpose. A `NewTerm(\[\])` indicates that some candidates got their bond
   *slashed and none were elected, whilst `EmptyTerm` means that no candidates existed to
   *begin with.
   */
  NewTerm: Anonymize<Iaofef34v2445a>;
  /**
   *No (or not enough) candidates existed for this round. This is different from
   *`NewTerm(\[\])`. See the description of `NewTerm`.
   */
  EmptyTerm: undefined;
  /**
   *Internal error happened while trying to perform election.
   */
  ElectionError: undefined;
  /**
   *A member has been removed. This should always be followed by either `NewTerm` or
   *`EmptyTerm`.
   */
  MemberKicked: Anonymize<Ie3gphha4ejh40>;
  /**
   *Someone has renounced their candidacy.
   */
  Renounced: Anonymize<I4b66js88p45m8>;
  /**
   *A candidate was slashed by amount due to failing to obtain a seat as member or
   *runner-up.
   *
   *Note that old members and runners-up are also candidates.
   */
  CandidateSlashed: Anonymize<I50d9r8lrdga93>;
  /**
   *A seat holder was slashed by amount by being forcefully removed from the set.
   */
  SeatHolderSlashed: Anonymize<I27avf13g71mla>;
}>;
export type Iaofef34v2445a = {
  new_members: Anonymize<Iba9inugg1atvo>;
};
export type Iba9inugg1atvo = Array<Anonymize<I95l2k9b1re95f>>;
export type Ie3gphha4ejh40 = {
  member: SS58String;
};
export type I4b66js88p45m8 = {
  candidate: SS58String;
};
export type I50d9r8lrdga93 = {
  candidate: SS58String;
  amount: bigint;
};
export type I27avf13g71mla = {
  seat_holder: SS58String;
  amount: bigint;
};
export type Icraqvvspogdb4 = AnonymousEnum<{
  /**
   *A motion (given hash) has been proposed (by given account) with a threshold (given
   *`MemberCount`).
   */
  Proposed: Anonymize<Ift6f10887nk72>;
  /**
   *A motion (given hash) has been voted on by given account, leaving
   *a tally (yes votes and no votes given respectively as `MemberCount`).
   */
  Voted: Anonymize<I7qc53b1tvqjg2>;
  /**
   *A motion was approved by the required threshold.
   */
  Approved: Anonymize<I2ev73t79f46tb>;
  /**
   *A motion was not approved by the required threshold.
   */
  Disapproved: Anonymize<I2ev73t79f46tb>;
  /**
   *A motion was executed; result will be `Ok` if it returned without error.
   */
  Executed: Anonymize<I4q0j6fg2t2god>;
  /**
   *A single member did some action; result will be `Ok` if it returned without error.
   */
  MemberExecuted: Anonymize<I4q0j6fg2t2god>;
  /**
   *A proposal was closed because its threshold was reached or after its duration was up.
   */
  Closed: Anonymize<Iak7fhrgb9jnnq>;
}>;
export type Ift6f10887nk72 = {
  account: SS58String;
  proposal_index: number;
  proposal_hash: FixedSizeBinary<32>;
  threshold: number;
};
export type I7qc53b1tvqjg2 = {
  account: SS58String;
  proposal_hash: FixedSizeBinary<32>;
  voted: boolean;
  yes: number;
  no: number;
};
export type I4q0j6fg2t2god = {
  proposal_hash: FixedSizeBinary<32>;
  result: Anonymize<I5kcp0gmhl71c>;
};
export type Iak7fhrgb9jnnq = {
  proposal_hash: FixedSizeBinary<32>;
  yes: number;
  no: number;
};
export type Imaosic05it19 = AnonymousEnum<{
  /**
   *A new tip suggestion has been opened.
   */
  NewTip: Anonymize<Iep7an7g10jgpc>;
  /**
   *A tip suggestion has reached threshold and is closing.
   */
  TipClosing: Anonymize<Iep7an7g10jgpc>;
  /**
   *A tip suggestion has been closed.
   */
  TipClosed: Anonymize<Ierev02d74bpoa>;
  /**
   *A tip suggestion has been retracted.
   */
  TipRetracted: Anonymize<Iep7an7g10jgpc>;
  /**
   *A tip suggestion has been slashed.
   */
  TipSlashed: Anonymize<Ic836gl3ins837>;
}>;
export type Iep7an7g10jgpc = {
  tip_hash: FixedSizeBinary<32>;
};
export type Ierev02d74bpoa = {
  tip_hash: FixedSizeBinary<32>;
  who: SS58String;
  payout: bigint;
};
export type Ic836gl3ins837 = {
  tip_hash: FixedSizeBinary<32>;
  finder: SS58String;
  deposit: bigint;
};
export type I9f78q7spmcstc = AnonymousEnum<{
  /**
   *A proxy was executed correctly, with the given.
   */
  ProxyExecuted: Anonymize<I1d43pfvgh75ar>;
  /**
   *A pure account has been created by new proxy with given
   *disambiguation index and proxy type.
   */
  PureCreated: Anonymize<Ic3vmcebni2jj7>;
  /**
   *An announcement was placed to make a call in the future.
   */
  Announced: Anonymize<I2ur0oeqg495j8>;
  /**
   *A proxy was added.
   */
  ProxyAdded: Anonymize<I3opji3hcv2fmd>;
  /**
   *A proxy was removed.
   */
  ProxyRemoved: Anonymize<I3opji3hcv2fmd>;
}>;
export type Ic3vmcebni2jj7 = {
  pure: SS58String;
  who: SS58String;
  proxy_type: Anonymize<Ie9g2psuhuu510>;
  disambiguation_index: number;
};
export type Ie9g2psuhuu510 = AnonymousEnum<{
  Any: undefined;
  CancelProxy: undefined;
  Governance: undefined;
  Transfer: undefined;
  Liquidity: undefined;
  LiquidityMining: undefined;
}>;
export type I3opji3hcv2fmd = {
  delegator: SS58String;
  delegatee: SS58String;
  proxy_type: Anonymize<Ie9g2psuhuu510>;
  delay: number;
};
export type Ieabsm7duvg6q2 = AnonymousEnum<{
  /**
   *A new multisig operation has begun.
   */
  NewMultisig: Anonymize<Iep27ialq4a7o7>;
  /**
   *A multisig operation has been approved by someone.
   */
  MultisigApproval: Anonymize<Iasu5jvoqr43mv>;
  /**
   *A multisig operation has been executed.
   */
  MultisigExecuted: Anonymize<I1s1qkhv9546hq>;
  /**
   *A multisig operation has been cancelled.
   */
  MultisigCancelled: Anonymize<I5qolde99acmd1>;
}>;
export type I1s1qkhv9546hq = {
  approving: SS58String;
  timepoint: Anonymize<Itvprrpb0nm3o>;
  multisig: SS58String;
  call_hash: FixedSizeBinary<32>;
  result: Anonymize<I5kcp0gmhl71c>;
};
export type I27c883vr18l6d = AnonymousEnum<{
  /**
   *A `collection` was created.
   */
  Created: Anonymize<I86naabrotue2j>;
  /**
   *A `collection` was force-created.
   */
  ForceCreated: Anonymize<I2r637rurl4t61>;
  /**
   *A `collection` was destroyed.
   */
  Destroyed: Anonymize<I88sl1jplq27bh>;
  /**
   *An `item` was issued.
   */
  Issued: Anonymize<I846j8gk91gp4q>;
  /**
   *An `item` was transferred.
   */
  Transferred: Anonymize<Iar6hlsh10hqst>;
  /**
   *An `item` was destroyed.
   */
  Burned: Anonymize<I846j8gk91gp4q>;
  /**
   *Some `item` was frozen.
   */
  Frozen: Anonymize<I92ucef7ff2o7l>;
  /**
   *Some `item` was thawed.
   */
  Thawed: Anonymize<I92ucef7ff2o7l>;
  /**
   *Some `collection` was frozen.
   */
  CollectionFrozen: Anonymize<I88sl1jplq27bh>;
  /**
   *Some `collection` was thawed.
   */
  CollectionThawed: Anonymize<I88sl1jplq27bh>;
  /**
   *The owner changed.
   */
  OwnerChanged: Anonymize<I2970lus2v0qct>;
  /**
   *The management team changed.
   */
  TeamChanged: Anonymize<I1vsbo63n9pu69>;
  /**
   *An `item` of a `collection` has been approved by the `owner` for transfer by
   *a `delegate`.
   */
  ApprovedTransfer: Anonymize<I89nkv9adctj3n>;
  /**
   *An approval for a `delegate` account to transfer the `item` of an item
   *`collection` was cancelled by its `owner`.
   */
  ApprovalCancelled: Anonymize<I89nkv9adctj3n>;
  /**
   *A `collection` has had its attributes changed by the `Force` origin.
   */
  ItemStatusChanged: Anonymize<I88sl1jplq27bh>;
  /**
   *New metadata has been set for a `collection`.
   */
  CollectionMetadataSet: Anonymize<I9oai3q0an1tbo>;
  /**
   *Metadata has been cleared for a `collection`.
   */
  CollectionMetadataCleared: Anonymize<I88sl1jplq27bh>;
  /**
   *New metadata has been set for an item.
   */
  MetadataSet: Anonymize<I9e4bfe80t2int>;
  /**
   *Metadata has been cleared for an item.
   */
  MetadataCleared: Anonymize<I92ucef7ff2o7l>;
  /**
   *Metadata has been cleared for an item.
   */
  Redeposited: Anonymize<I5seehdocrcoau>;
  /**
   *New attribute metadata has been set for a `collection` or `item`.
   */
  AttributeSet: Anonymize<I62ht2i39rtkaa>;
  /**
   *Attribute metadata has been cleared for a `collection` or `item`.
   */
  AttributeCleared: Anonymize<Ichf8eu9t3dtc2>;
  /**
   *Ownership acceptance has changed for an account.
   */
  OwnershipAcceptanceChanged: Anonymize<Ic2kg6kak0gd23>;
  /**
   *Max supply has been set for a collection.
   */
  CollectionMaxSupplySet: Anonymize<Idj9k8sn80h3m6>;
  /**
   *The price was set for the instance.
   */
  ItemPriceSet: Anonymize<I2odpdgf7k5003>;
  /**
   *The price for the instance was removed.
   */
  ItemPriceRemoved: Anonymize<I92ucef7ff2o7l>;
  /**
   *An item was bought.
   */
  ItemBought: Anonymize<Ifmob7l1au7mdj>;
}>;
export type I86naabrotue2j = {
  collection: bigint;
  creator: SS58String;
  owner: SS58String;
};
export type I2r637rurl4t61 = {
  collection: bigint;
  owner: SS58String;
};
export type I88sl1jplq27bh = {
  collection: bigint;
};
export type I846j8gk91gp4q = {
  collection: bigint;
  item: bigint;
  owner: SS58String;
};
export type Iar6hlsh10hqst = {
  collection: bigint;
  item: bigint;
  from: SS58String;
  to: SS58String;
};
export type I92ucef7ff2o7l = {
  collection: bigint;
  item: bigint;
};
export type I2970lus2v0qct = {
  collection: bigint;
  new_owner: SS58String;
};
export type I1vsbo63n9pu69 = {
  collection: bigint;
  issuer: SS58String;
  admin: SS58String;
  freezer: SS58String;
};
export type I89nkv9adctj3n = {
  collection: bigint;
  item: bigint;
  owner: SS58String;
  delegate: SS58String;
};
export type I9oai3q0an1tbo = {
  collection: bigint;
  data: Binary;
  is_frozen: boolean;
};
export type I9e4bfe80t2int = {
  collection: bigint;
  item: bigint;
  data: Binary;
  is_frozen: boolean;
};
export type I5seehdocrcoau = {
  collection: bigint;
  successful_items: Anonymize<Iafqnechp3omqg>;
};
export type Iafqnechp3omqg = Array<bigint>;
export type I62ht2i39rtkaa = {
  collection: bigint;
  maybe_item?: Anonymize<I35p85j063s0il>;
  key: Binary;
  value: Binary;
};
export type Ichf8eu9t3dtc2 = {
  collection: bigint;
  maybe_item?: Anonymize<I35p85j063s0il>;
  key: Binary;
};
export type Ic2kg6kak0gd23 = {
  who: SS58String;
  maybe_collection?: Anonymize<I35p85j063s0il>;
};
export type Idj9k8sn80h3m6 = {
  collection: bigint;
  max_supply: number;
};
export type I2odpdgf7k5003 = {
  collection: bigint;
  item: bigint;
  price: bigint;
  whitelisted_buyer?: Anonymize<Ihfphjolmsqq1>;
};
export type Ifmob7l1au7mdj = {
  collection: bigint;
  item: bigint;
  price: bigint;
  seller: SS58String;
  buyer: SS58String;
};
export type I61dksvl51aujo = AnonymousEnum<{
  /**
   *Given number of `(top, child)` keys were migrated respectively, with the given
   *`compute`.
   */
  Migrated: Anonymize<Iagqcb06kbevb1>;
  /**
   *Some account got slashed by the given amount.
   */
  Slashed: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *The auto migration task finished.
   */
  AutoMigrationFinished: undefined;
  /**
   *Migration got halted due to an error or miss-configuration.
   */
  Halted: Anonymize<Iec8defeh924b6>;
}>;
export type Iagqcb06kbevb1 = {
  top: number;
  child: number;
  compute: Anonymize<I85ah77hcf4cpl>;
};
export type I85ah77hcf4cpl = AnonymousEnum<{
  Signed: undefined;
  Auto: undefined;
}>;
export type Iec8defeh924b6 = {
  error: Anonymize<I96objte63brjr>;
};
export type ConvictionVotingEvent = Enum<{
  /**
   *An account has delegated their vote to another account. \[who, target\]
   */
  Delegated: Anonymize<I2na29tt2afp0j>;
  /**
   *An \[account\] has cancelled a previous delegation operation.
   */
  Undelegated: SS58String;
}>;
export declare const ConvictionVotingEvent: GetEnum<ConvictionVotingEvent>;
export type I2na29tt2afp0j = FixedSizeArray<2, SS58String>;
export type Idfraa3b4eu018 = AnonymousEnum<{
  /**
   *A referendum has been submitted.
   */
  Submitted: Anonymize<I229ijht536qdu>;
  /**
   *The decision deposit has been placed.
   */
  DecisionDepositPlaced: Anonymize<I62nte77gksm0f>;
  /**
   *The decision deposit has been refunded.
   */
  DecisionDepositRefunded: Anonymize<I62nte77gksm0f>;
  /**
   *A deposit has been slashed.
   */
  DepositSlashed: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *A referendum has moved into the deciding phase.
   */
  DecisionStarted: Anonymize<I9cg2delv92pvq>;
  ConfirmStarted: Anonymize<I666bl2fqjkejo>;
  ConfirmAborted: Anonymize<I666bl2fqjkejo>;
  /**
   *A referendum has ended its confirmation phase and is ready for approval.
   */
  Confirmed: Anonymize<Ilhp45uime5tp>;
  /**
   *A referendum has been approved and its proposal has been scheduled.
   */
  Approved: Anonymize<I666bl2fqjkejo>;
  /**
   *A proposal has been rejected by referendum.
   */
  Rejected: Anonymize<Ilhp45uime5tp>;
  /**
   *A referendum has been timed out without being decided.
   */
  TimedOut: Anonymize<Ilhp45uime5tp>;
  /**
   *A referendum has been cancelled.
   */
  Cancelled: Anonymize<Ilhp45uime5tp>;
  /**
   *A referendum has been killed.
   */
  Killed: Anonymize<Ilhp45uime5tp>;
  /**
   *The submission deposit has been refunded.
   */
  SubmissionDepositRefunded: Anonymize<I62nte77gksm0f>;
  /**
   *Metadata for a referendum has been set.
   */
  MetadataSet: Anonymize<I4f1hv034jf1dt>;
  /**
   *Metadata for a referendum has been cleared.
   */
  MetadataCleared: Anonymize<I4f1hv034jf1dt>;
}>;
export type I229ijht536qdu = {
  /**
   *Index of the referendum.
   */
  index: number;
  /**
   *The track (and by extension proposal dispatch origin) of this referendum.
   */
  track: number;
  /**
   *The proposal for the referendum.
   */
  proposal: PreimagesBounded;
};
export type PreimagesBounded = Enum<{
  Legacy: Anonymize<I1jm8m1rh9e20v>;
  Inline: Binary;
  Lookup: Anonymize<Ieln2r0qa0hb4j>;
}>;
export declare const PreimagesBounded: GetEnum<PreimagesBounded>;
export type Ieln2r0qa0hb4j = {
  hash: FixedSizeBinary<32>;
  len: number;
};
export type I62nte77gksm0f = {
  /**
   *Index of the referendum.
   */
  index: number;
  /**
   *The account who placed the deposit.
   */
  who: SS58String;
  /**
   *The amount placed by the account.
   */
  amount: bigint;
};
export type I9cg2delv92pvq = {
  /**
   *Index of the referendum.
   */
  index: number;
  /**
   *The track (and by extension proposal dispatch origin) of this referendum.
   */
  track: number;
  /**
   *The proposal for the referendum.
   */
  proposal: PreimagesBounded;
  /**
   *The current tally of votes in this referendum.
   */
  tally: Anonymize<Ifsk7cbmtit1jd>;
};
export type Ifsk7cbmtit1jd = {
  ayes: bigint;
  nays: bigint;
  support: bigint;
};
export type Ilhp45uime5tp = {
  /**
   *Index of the referendum.
   */
  index: number;
  /**
   *The final tally of votes in this referendum.
   */
  tally: Anonymize<Ifsk7cbmtit1jd>;
};
export type I4f1hv034jf1dt = {
  /**
   *Index of the referendum.
   */
  index: number;
  /**
   *Preimage hash.
   */
  hash: FixedSizeBinary<32>;
};
export type Id9ai2vqibcn9d = AnonymousEnum<{
  CallWhitelisted: Anonymize<I1adbcfi5uc62r>;
  WhitelistedCallRemoved: Anonymize<I1adbcfi5uc62r>;
  WhitelistedCallDispatched: Anonymize<I7tn5uocmj423n>;
}>;
export type I1adbcfi5uc62r = {
  call_hash: FixedSizeBinary<32>;
};
export type I7tn5uocmj423n = {
  call_hash: FixedSizeBinary<32>;
  result: Anonymize<Idk72ugrjus1ot>;
};
export type Idk72ugrjus1ot = ResultPayload<
  Anonymize<Ia1u1r3n74r13c>,
  Anonymize<Ib7a0k024ul5i5>
>;
export type Ib7a0k024ul5i5 = {
  post_info: Anonymize<Ia1u1r3n74r13c>;
  error: Anonymize<I9sdjnqgsnrang>;
};
export type Ics6l0t7ahfldh = AnonymousEnum<{
  TreasuryManagerCallDispatched: Anonymize<I7tn5uocmj423n>;
  AaveManagerCallDispatched: Anonymize<I7tn5uocmj423n>;
}>;
export type Ian7ibscsh312g = AnonymousEnum<{
  /**
   *Existential deposit for insufficinet asset was paid.
   *`SufficiencyCheck` triggers this event.
   */
  ExistentialDepositPaid: Anonymize<I6cn8fgvhihc8u>;
  /**
   *Asset was registered.
   */
  Registered: Anonymize<Iaa8ldhnekkm2a>;
  /**
   *Asset was updated.
   */
  Updated: Anonymize<Iaa8ldhnekkm2a>;
  /**
   *Native location set for an asset.
   */
  LocationSet: Anonymize<Ir72g75rutn0i>;
  /**
   *Asset was banned.
   */
  AssetBanned: Anonymize<Ia5le7udkgbaq9>;
  /**
   *Asset's ban was removed.
   */
  AssetUnbanned: Anonymize<Ia5le7udkgbaq9>;
}>;
export type I6cn8fgvhihc8u = {
  who: SS58String;
  fee_asset: number;
  amount: bigint;
};
export type Iaa8ldhnekkm2a = {
  asset_id: number;
  asset_name?: Anonymize<Iabpgqcjikia83>;
  asset_type: Anonymize<I95262dsbtfh4d>;
  existential_deposit: bigint;
  xcm_rate_limit?: Anonymize<I35p85j063s0il>;
  symbol?: Anonymize<Iabpgqcjikia83>;
  decimals?: Anonymize<I4arjljr6dpflb>;
  is_sufficient: boolean;
};
export type I95262dsbtfh4d = AnonymousEnum<{
  Token: undefined;
  XYK: undefined;
  StableSwap: undefined;
  Bond: undefined;
  External: undefined;
  Erc20: undefined;
}>;
export type Ir72g75rutn0i = {
  asset_id: number;
  location: Anonymize<I4c0s5cioidn76>;
};
export type I8cen1qssvc0qs = AnonymousEnum<{
  Claim: Anonymize<I7i2rquf9o1sc4>;
}>;
export type I7i2rquf9o1sc4 = [SS58String, FixedSizeBinary<20>, bigint];
export type I3ktde60bb7807 = AnonymousEnum<{
  /**
   *Collator was rewarded.
   */
  CollatorRewarded: Anonymize<I32ndibr4v59gl>;
}>;
export type I32ndibr4v59gl = {
  who: SS58String;
  amount: bigint;
  currency: number;
};
export type I7lkql4318bauj = AnonymousEnum<{
  /**
   *An asset was added to Omnipool
   */
  TokenAdded: Anonymize<Ichvhj93no2r9s>;
  /**
   *An asset was removed from Omnipool
   */
  TokenRemoved: Anonymize<Ibo4guh1r2d417>;
  /**
   *Liquidity of an asset was added to Omnipool.
   */
  LiquidityAdded: Anonymize<I5bdik3e9dtr9m>;
  /**
   *Liquidity of an asset was removed from Omnipool.
   */
  LiquidityRemoved: Anonymize<Idml4kfacbec4q>;
  /**
   *PRotocol Liquidity was removed from Omnipool.
   */
  ProtocolLiquidityRemoved: Anonymize<I5po34152rrdd1>;
  /**
   *Sell trade executed.
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  SellExecuted: Anonymize<I8gu0uupiacpfc>;
  /**
   *Buy trade executed.
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  BuyExecuted: Anonymize<I8gu0uupiacpfc>;
  /**
   *LP Position was created and NFT instance minted.
   */
  PositionCreated: Anonymize<I3qaapujidulnv>;
  /**
   *LP Position was destroyed and NFT instance burned.
   */
  PositionDestroyed: Anonymize<I5u2c8nrbcec0n>;
  /**
   *LP Position was updated.
   */
  PositionUpdated: Anonymize<I3qaapujidulnv>;
  /**
   *Asset's tradable state has been updated.
   */
  TradableStateUpdated: Anonymize<Iefviakco48cs2>;
  /**
   *Amount has been refunded for asset which has not been accepted to add to omnipool.
   */
  AssetRefunded: Anonymize<Iakb7idgif10m8>;
  /**
   *Asset's weight cap has been updated.
   */
  AssetWeightCapUpdated: Anonymize<Id7aqsj1u6b2r2>;
}>;
export type Ichvhj93no2r9s = {
  asset_id: number;
  initial_amount: bigint;
  initial_price: bigint;
};
export type Ibo4guh1r2d417 = {
  asset_id: number;
  amount: bigint;
  hub_withdrawn: bigint;
};
export type I5bdik3e9dtr9m = {
  who: SS58String;
  asset_id: number;
  amount: bigint;
  position_id: bigint;
};
export type Idml4kfacbec4q = {
  who: SS58String;
  position_id: bigint;
  asset_id: number;
  shares_removed: bigint;
  fee: bigint;
};
export type I5po34152rrdd1 = {
  who: SS58String;
  asset_id: number;
  amount: bigint;
  hub_amount: bigint;
  shares_removed: bigint;
};
export type I8gu0uupiacpfc = {
  who: SS58String;
  asset_in: number;
  asset_out: number;
  amount_in: bigint;
  amount_out: bigint;
  hub_amount_in: bigint;
  hub_amount_out: bigint;
  asset_fee_amount: bigint;
  protocol_fee_amount: bigint;
};
export type I3qaapujidulnv = {
  position_id: bigint;
  owner: SS58String;
  asset: number;
  amount: bigint;
  shares: bigint;
  price: bigint;
};
export type I5u2c8nrbcec0n = {
  position_id: bigint;
  owner: SS58String;
};
export type Iefviakco48cs2 = {
  asset_id: number;
  state: number;
};
export type Iakb7idgif10m8 = {
  asset_id: number;
  amount: bigint;
  recipient: SS58String;
};
export type Id7aqsj1u6b2r2 = {
  asset_id: number;
  cap: number;
};
export type I1e1tlbqeorb14 = AnonymousEnum<{
  /**
   *Paused transaction
   */
  TransactionPaused: Anonymize<I193fovq1blcqu>;
  /**
   *Unpaused transaction
   */
  TransactionUnpaused: Anonymize<I193fovq1blcqu>;
}>;
export type I193fovq1blcqu = {
  pallet_name_bytes: Binary;
  function_name_bytes: Binary;
};
export type Ick156bqlvrfqh = AnonymousEnum<{
  /**
   *Account dusted.
   */
  Dusted: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Account added to non-dustable list.
   */
  Added: Anonymize<I4cbvqmqadhrea>;
  /**
   *Account removed from non-dustable list.
   */
  Removed: Anonymize<I4cbvqmqadhrea>;
}>;
export type Ibc0cs73olrilv = AnonymousEnum<{
  /**
   *Global farm accumulated reward per share was updated.
   */
  GlobalFarmAccRPZUpdated: Anonymize<I4qeb32vu4p1o2>;
  /**
   *Yield farm accumulated reward per valued share was updated.
   */
  YieldFarmAccRPVSUpdated: Anonymize<Icatb69nkfsv2d>;
  /**
   *Global farm has no more rewards to distribute in the moment.
   */
  AllRewardsDistributed: Anonymize<I9q8qmop6bko5m>;
}>;
export type I4qeb32vu4p1o2 = {
  global_farm_id: number;
  accumulated_rpz: bigint;
  total_shares_z: bigint;
};
export type Icatb69nkfsv2d = {
  global_farm_id: number;
  yield_farm_id: number;
  accumulated_rpvs: bigint;
  total_valued_shares: bigint;
};
export type I9q8qmop6bko5m = {
  global_farm_id: number;
};
export type Ibd5re511t83ta = AnonymousEnum<{
  /**
   *New global farm was created.
   */
  GlobalFarmCreated: Anonymize<Iao3tfuiovep78>;
  /**
   *Global farm was updated
   */
  GlobalFarmUpdated: Anonymize<I1cq0joe6ba7us>;
  /**
   *Global farm was terminated.
   */
  GlobalFarmTerminated: Anonymize<I8p8774nu1gec7>;
  /**
   *New yield farm was added to the farm.
   */
  YieldFarmCreated: Anonymize<I58kb78e8933i0>;
  /**
   *Yield farm multiplier was updated.
   */
  YieldFarmUpdated: Anonymize<Idhf8n2m782jc6>;
  /**
   *Yield farm for `asset_id` was stopped.
   */
  YieldFarmStopped: Anonymize<I8qbcd8kjt9b35>;
  /**
   *Yield farm for `asset_id` was resumed.
   */
  YieldFarmResumed: Anonymize<Idhf8n2m782jc6>;
  /**
   *Yield farm was terminated from the global farm.
   */
  YieldFarmTerminated: Anonymize<I8qbcd8kjt9b35>;
  /**
   *New LP shares(LP position) were deposited.
   */
  SharesDeposited: Anonymize<I9fddbmtajbhgk>;
  /**
   *Already locked LP shares were redeposited to another yield farm.
   */
  SharesRedeposited: Anonymize<I9fddbmtajbhgk>;
  /**
   *Rewards were claimed.
   */
  RewardClaimed: Anonymize<I16oglmrf6q8h2>;
  /**
   *LP shares were withdrawn.
   */
  SharesWithdrawn: Anonymize<I56vurdc4pd324>;
  /**
   *All LP shares were unlocked and NFT representing deposit was destroyed.
   */
  DepositDestroyed: Anonymize<Iv3iro9hpdvcu>;
}>;
export type Iao3tfuiovep78 = {
  id: number;
  owner: SS58String;
  total_rewards: bigint;
  reward_currency: number;
  yield_per_period: bigint;
  planned_yielding_periods: number;
  blocks_per_period: number;
  max_reward_per_period: bigint;
  min_deposit: bigint;
  lrna_price_adjustment: bigint;
};
export type I1cq0joe6ba7us = {
  id: number;
  planned_yielding_periods: number;
  yield_per_period: bigint;
  min_deposit: bigint;
};
export type I8p8774nu1gec7 = {
  global_farm_id: number;
  who: SS58String;
  reward_currency: number;
  undistributed_rewards: bigint;
};
export type I58kb78e8933i0 = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_id: number;
  multiplier: bigint;
  loyalty_curve?: Anonymize<Ieot4d4ofvtguv>;
};
export type Ieot4d4ofvtguv = Anonymize<I8mn8vdj1tn1ml> | undefined;
export type I8mn8vdj1tn1ml = {
  initial_reward_percentage: bigint;
  scale_coef: number;
};
export type Idhf8n2m782jc6 = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_id: number;
  who: SS58String;
  multiplier: bigint;
};
export type I8qbcd8kjt9b35 = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_id: number;
  who: SS58String;
};
export type I9fddbmtajbhgk = {
  global_farm_id: number;
  yield_farm_id: number;
  deposit_id: bigint;
  asset_id: number;
  who: SS58String;
  shares_amount: bigint;
  position_id: bigint;
};
export type I16oglmrf6q8h2 = {
  global_farm_id: number;
  yield_farm_id: number;
  who: SS58String;
  claimed: bigint;
  reward_currency: number;
  deposit_id: bigint;
};
export type I56vurdc4pd324 = {
  global_farm_id: number;
  yield_farm_id: number;
  who: SS58String;
  amount: bigint;
  deposit_id: bigint;
};
export type Iv3iro9hpdvcu = {
  who: SS58String;
  deposit_id: bigint;
};
export type I4e560fvgcsh15 = AnonymousEnum<{
  /**
   *An Order has been cancelled
   */
  Cancelled: Anonymize<Ibq6b0nsk23kj8>;
  /**
   *An Order has been completely filled
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  Filled: Anonymize<I725512ll00rul>;
  /**
   *An Order has been partially filled
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  PartiallyFilled: Anonymize<I725512ll00rul>;
  /**
   *An Order has been placed
   */
  Placed: Anonymize<Ibnohbnq46n24i>;
}>;
export type Ibq6b0nsk23kj8 = {
  order_id: number;
};
export type I725512ll00rul = {
  order_id: number;
  who: SS58String;
  amount_in: bigint;
  amount_out: bigint;
  fee: bigint;
};
export type Ibnohbnq46n24i = {
  order_id: number;
  asset_in: number;
  asset_out: number;
  amount_in: bigint;
  amount_out: bigint;
  partially_fillable: boolean;
};
export type Ichskhtdtbf0vo = AnonymousEnum<{
  /**
   *Trade volume limit of an asset was changed.
   */
  TradeVolumeLimitChanged: Anonymize<I2i1tilmsb1rl1>;
  /**
   *Add liquidity limit of an asset was changed.
   */
  AddLiquidityLimitChanged: Anonymize<I4l0u1h71fhj81>;
  /**
   *Remove liquidity limit of an asset was changed.
   */
  RemoveLiquidityLimitChanged: Anonymize<I4l0u1h71fhj81>;
}>;
export type I2i1tilmsb1rl1 = {
  asset_id: number;
  trade_volume_limit: Anonymize<I9jd27rnpm8ttv>;
};
export type I4l0u1h71fhj81 = {
  asset_id: number;
  liquidity_limit?: Anonymize<Iep7au1720bm0e>;
};
export type Iep7au1720bm0e = Anonymize<I9jd27rnpm8ttv> | undefined;
export type I29ur4pnf751bn = AnonymousEnum<{
  /**
   *The route with trades has been successfully executed
   */
  Executed: Anonymize<If1007933akv96>;
  /**
   *The route with trades has been successfully executed
   */
  RouteUpdated: Anonymize<I11glevchscfbg>;
}>;
export type If1007933akv96 = {
  asset_in: number;
  asset_out: number;
  amount_in: bigint;
  amount_out: bigint;
  event_id: number;
};
export type I11glevchscfbg = {
  asset_ids: Anonymize<Icgljjb6j82uhn>;
};
export type I578f2b006bplq = AnonymousEnum<{
  /**
   *New staking position was created and NFT was minted.
   */
  PositionCreated: Anonymize<Ifrsdu7763lo3e>;
  /**
   *Staked amount for existing position was increased.
   */
  StakeAdded: Anonymize<I1rcm9o2k31p0u>;
  /**
   *Rewards were claimed.
   */
  RewardsClaimed: Anonymize<I90op6i3kabg2t>;
  /**
   *Staked amount was withdrawn and NFT was burned.
   */
  Unstaked: Anonymize<If7ps0a75qku2k>;
  /**
   *Staking was initialized.
   */
  StakingInitialized: Anonymize<I4qcsbrcg45e5p>;
  /**
   *Staking's `accumulated_reward_per_stake` was updated.
   */
  AccumulatedRpsUpdated: Anonymize<I2gupahud9i8tv>;
}>;
export type Ifrsdu7763lo3e = {
  who: SS58String;
  position_id: bigint;
  stake: bigint;
};
export type I1rcm9o2k31p0u = {
  who: SS58String;
  position_id: bigint;
  stake: bigint;
  total_stake: bigint;
  locked_rewards: bigint;
  slashed_points: bigint;
  payable_percentage: bigint;
};
export type I90op6i3kabg2t = {
  who: SS58String;
  position_id: bigint;
  paid_rewards: bigint;
  unlocked_rewards: bigint;
  slashed_points: bigint;
  slashed_unpaid_rewards: bigint;
  payable_percentage: bigint;
};
export type If7ps0a75qku2k = {
  who: SS58String;
  position_id: bigint;
  unlocked_stake: bigint;
};
export type I4qcsbrcg45e5p = {
  non_dustable_balance: bigint;
};
export type I2gupahud9i8tv = {
  accumulated_rps: bigint;
  total_stake: bigint;
};
export type I7d404mb06b8kk = AnonymousEnum<{
  /**
   *A pool was created.
   */
  PoolCreated: Anonymize<Idmv46n4bkamls>;
  /**
   *Pool fee has been updated.
   */
  FeeUpdated: Anonymize<Ics8sn0t3vlpat>;
  /**
   *Liquidity of an asset was added to a pool.
   */
  LiquidityAdded: Anonymize<I88qo502j1hm6r>;
  /**
   *Liquidity removed.
   */
  LiquidityRemoved: Anonymize<I44sqbdseede38>;
  /**
   *Sell trade executed. Trade fee paid in asset leaving the pool (already subtracted from amount_out).
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  SellExecuted: Anonymize<I203slt75ll6b5>;
  /**
   *Buy trade executed. Trade fee paid in asset entering the pool (already included in amount_in).
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  BuyExecuted: Anonymize<I203slt75ll6b5>;
  /**
   *Asset's tradable state has been updated.
   */
  TradableStateUpdated: Anonymize<Iest0fomljvrb6>;
  /**
   *Amplification of a pool has been scheduled to change.
   */
  AmplificationChanging: Anonymize<I9buamva6m987d>;
  /**
   *A pool has been destroyed.
   */
  PoolDestroyed: Anonymize<I931cottvong90>;
}>;
export type Idmv46n4bkamls = {
  pool_id: number;
  assets: Anonymize<Icgljjb6j82uhn>;
  amplification: number;
  fee: number;
};
export type Ics8sn0t3vlpat = {
  pool_id: number;
  fee: number;
};
export type I88qo502j1hm6r = {
  pool_id: number;
  who: SS58String;
  shares: bigint;
  assets: Anonymize<Id7i7r9a29m8o2>;
};
export type Id7i7r9a29m8o2 = Array<Anonymize<Id2vo4qi5agnp0>>;
export type Id2vo4qi5agnp0 = {
  asset_id: number;
  amount: bigint;
};
export type I44sqbdseede38 = {
  pool_id: number;
  who: SS58String;
  shares: bigint;
  amounts: Anonymize<Id7i7r9a29m8o2>;
  fee: bigint;
};
export type I203slt75ll6b5 = {
  who: SS58String;
  pool_id: number;
  asset_in: number;
  asset_out: number;
  amount_in: bigint;
  amount_out: bigint;
  fee: bigint;
};
export type Iest0fomljvrb6 = {
  pool_id: number;
  asset_id: number;
  state: number;
};
export type I9buamva6m987d = {
  pool_id: number;
  current_amplification: number;
  final_amplification: number;
  start_block: number;
  end_block: number;
};
export type I931cottvong90 = {
  pool_id: number;
};
export type I3ans31bk1md2j = AnonymousEnum<{
  /**
   *A bond asset was registered
   */
  TokenCreated: Anonymize<I15i908ukdv01j>;
  /**
   *New bond were issued
   */
  Issued: Anonymize<I3md9r9ud9jcmi>;
  /**
   *Bonds were redeemed
   */
  Redeemed: Anonymize<I4rlrhubptb25s>;
}>;
export type I15i908ukdv01j = {
  issuer: SS58String;
  asset_id: number;
  bond_id: number;
  maturity: bigint;
};
export type I3md9r9ud9jcmi = {
  issuer: SS58String;
  bond_id: number;
  amount: bigint;
  fee: bigint;
};
export type I4rlrhubptb25s = {
  who: SS58String;
  bond_id: number;
  amount: bigint;
};
export type I7t4kltkut18qv = AnonymousEnum<{
  /**
   *A trade has been executed
   */
  Executed: Anonymize<Ibb0j2hs2i32f5>;
}>;
export type Ibb0j2hs2i32f5 = {
  asset_id: number;
  profit: bigint;
};
export type Iafgde8gm8mhvt = AnonymousEnum<{
  /**
   *Pool was created by the `CreatePool` origin.
   */
  PoolCreated: Anonymize<Iae6luacdfosbm>;
  /**
   *Pool data were updated.
   */
  PoolUpdated: Anonymize<Iae6luacdfosbm>;
  /**
   *New liquidity was provided to the pool.
   */
  LiquidityAdded: Anonymize<Idvrgp2jjkjaee>;
  /**
   *Liquidity was removed from the pool and the pool was destroyed.
   */
  LiquidityRemoved: Anonymize<Idvrgp2jjkjaee>;
  /**
   *Sale executed.
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  SellExecuted: Anonymize<I6q2a2o24kbh1n>;
  /**
   *Purchase executed.
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  BuyExecuted: Anonymize<Iflfus32kckdgg>;
}>;
export type Iae6luacdfosbm = {
  pool: SS58String;
  data: Anonymize<Iesq88051ch8ht>;
};
export type Iesq88051ch8ht = {
  owner: SS58String;
  start?: Anonymize<I4arjljr6dpflb>;
  end?: Anonymize<I4arjljr6dpflb>;
  assets: Anonymize<I9jd27rnpm8ttv>;
  initial_weight: number;
  final_weight: number;
  weight_curve: Anonymize<I9ismjef26dgjt>;
  fee: Anonymize<I9jd27rnpm8ttv>;
  fee_collector: SS58String;
  repay_target: bigint;
};
export type I9ismjef26dgjt = AnonymousEnum<{
  Linear: undefined;
}>;
export type Idvrgp2jjkjaee = {
  who: SS58String;
  asset_a: number;
  asset_b: number;
  amount_a: bigint;
  amount_b: bigint;
};
export type I6q2a2o24kbh1n = {
  who: SS58String;
  asset_in: number;
  asset_out: number;
  amount: bigint;
  sale_price: bigint;
  fee_asset: number;
  fee_amount: bigint;
};
export type Iflfus32kckdgg = {
  who: SS58String;
  asset_out: number;
  asset_in: number;
  amount: bigint;
  buy_price: bigint;
  fee_asset: number;
  fee_amount: bigint;
};
export type Ii9d7rb1uqb69 = AnonymousEnum<{
  /**
   *New liquidity was provided to the pool.
   */
  LiquidityAdded: Anonymize<Idvrgp2jjkjaee>;
  /**
   *Liquidity was removed from the pool.
   */
  LiquidityRemoved: Anonymize<I7e9lbuqrul79d>;
  /**
   *Pool was created.
   */
  PoolCreated: Anonymize<Idpc6o3gv6oduv>;
  /**
   *Pool was destroyed.
   */
  PoolDestroyed: Anonymize<I789ltv1nd8rlg>;
  /**
   *Asset sale executed.
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  SellExecuted: Anonymize<I5nm6uebbrcvd2>;
  /**
   *Asset purchase executed.
   *Deprecated. Replaced by pallet_broadcast::Swapped
   */
  BuyExecuted: Anonymize<I1966f4idd9els>;
}>;
export type I7e9lbuqrul79d = {
  who: SS58String;
  asset_a: number;
  asset_b: number;
  shares: bigint;
};
export type Idpc6o3gv6oduv = {
  who: SS58String;
  asset_a: number;
  asset_b: number;
  initial_shares_amount: bigint;
  share_token: number;
  pool: SS58String;
};
export type I789ltv1nd8rlg = {
  who: SS58String;
  asset_a: number;
  asset_b: number;
  share_token: number;
  pool: SS58String;
};
export type I5nm6uebbrcvd2 = {
  who: SS58String;
  asset_in: number;
  asset_out: number;
  amount: bigint;
  sale_price: bigint;
  fee_asset: number;
  fee_amount: bigint;
  pool: SS58String;
};
export type I1966f4idd9els = {
  who: SS58String;
  asset_out: number;
  asset_in: number;
  amount: bigint;
  buy_price: bigint;
  fee_asset: number;
  fee_amount: bigint;
  pool: SS58String;
};
export type Idpbcufjvb4ib7 = AnonymousEnum<{
  /**
   *Referral code has been registered.
   */
  CodeRegistered: Anonymize<I8hof8vbjel5j0>;
  /**
   *Referral code has been linked to an account.
   */
  CodeLinked: Anonymize<Ic20as3skakdjb>;
  /**
   *Asset has been converted to RewardAsset.
   */
  Converted: Anonymize<Ieg2h8ei7d5hi>;
  /**
   *Rewards claimed.
   */
  Claimed: Anonymize<I8c5lgkcpg07sj>;
  /**
   *New asset rewards has been set.
   */
  AssetRewardsUpdated: Anonymize<Ionfhf9va2t31>;
  /**
   *Referrer reached new level.
   */
  LevelUp: Anonymize<Ieas3thfe5cojl>;
}>;
export type I8hof8vbjel5j0 = {
  code: Binary;
  account: SS58String;
};
export type Ic20as3skakdjb = {
  account: SS58String;
  code: Binary;
  referral_account: SS58String;
};
export type Ieg2h8ei7d5hi = {
  from: Anonymize<Id2vo4qi5agnp0>;
  to: Anonymize<Id2vo4qi5agnp0>;
};
export type I8c5lgkcpg07sj = {
  who: SS58String;
  referrer_rewards: bigint;
  trade_rewards: bigint;
};
export type Ionfhf9va2t31 = {
  asset_id: number;
  level: Anonymize<I4k5pg22d1rdhq>;
  rewards: Anonymize<I4qc61lpfqml75>;
};
export type I4k5pg22d1rdhq = AnonymousEnum<{
  None: undefined;
  Tier0: undefined;
  Tier1: undefined;
  Tier2: undefined;
  Tier3: undefined;
  Tier4: undefined;
}>;
export type I4qc61lpfqml75 = {
  referrer: number;
  trader: number;
  external: number;
};
export type Ieas3thfe5cojl = {
  who: SS58String;
  level: Anonymize<I4k5pg22d1rdhq>;
};
export type Iephmdb4ru40md = AnonymousEnum<{
  /**
   *Money market position has been liquidated
   */
  Liquidated: Anonymize<I2rjku3c860luj>;
}>;
export type I2rjku3c860luj = {
  liquidator: SS58String;
  evm_address: FixedSizeBinary<20>;
  collateral_asset: number;
  debt_asset: number;
  debt_to_cover: bigint;
  profit: bigint;
};
export type I6h8581jnodhqc = AnonymousEnum<{
  /**
   *An account was created with some free balance.
   */
  Endowed: Anonymize<I24s4g6gkj5oec>;
  /**
   *An account was removed whose balance was non-zero but below
   *ExistentialDeposit, resulting in an outright loss.
   */
  DustLost: Anonymize<I24s4g6gkj5oec>;
  /**
   *Transfer succeeded.
   */
  Transfer: Anonymize<I82vqlr4shhaso>;
  /**
   *Some balance was reserved (moved from free to reserved).
   */
  Reserved: Anonymize<I24s4g6gkj5oec>;
  /**
   *Some balance was unreserved (moved from reserved to free).
   */
  Unreserved: Anonymize<I24s4g6gkj5oec>;
  /**
   *Some reserved balance was repatriated (moved from reserved to
   *another account).
   */
  ReserveRepatriated: Anonymize<I2age4ibb0qdmq>;
  /**
   *A balance was set by root.
   */
  BalanceSet: Anonymize<I4do2q74i35m>;
  /**
   *The total issuance of an currency has been set
   */
  TotalIssuanceSet: Anonymize<Iehf2srrsvlrt4>;
  /**
   *Some balances were withdrawn (e.g. pay for transaction fee)
   */
  Withdrawn: Anonymize<I24s4g6gkj5oec>;
  /**
   *Some balances were slashed (e.g. due to mis-behavior)
   */
  Slashed: Anonymize<I1a3321bv4rsn2>;
  /**
   *Deposited some balance into an account
   */
  Deposited: Anonymize<I24s4g6gkj5oec>;
  /**
   *Some funds are locked
   */
  LockSet: Anonymize<Ibmagsilt697o6>;
  /**
   *Some locked funds were unlocked
   */
  LockRemoved: Anonymize<I73g6utvpcmklb>;
  /**
   *Some free balance was locked.
   */
  Locked: Anonymize<I24s4g6gkj5oec>;
  /**
   *Some locked balance was freed.
   */
  Unlocked: Anonymize<I24s4g6gkj5oec>;
  Issued: Anonymize<Iehf2srrsvlrt4>;
  Rescinded: Anonymize<Iehf2srrsvlrt4>;
}>;
export type I24s4g6gkj5oec = {
  currency_id: number;
  who: SS58String;
  amount: bigint;
};
export type I82vqlr4shhaso = {
  currency_id: number;
  from: SS58String;
  to: SS58String;
  amount: bigint;
};
export type I2age4ibb0qdmq = {
  currency_id: number;
  from: SS58String;
  to: SS58String;
  amount: bigint;
  status: BalanceStatus;
};
export type I4do2q74i35m = {
  currency_id: number;
  who: SS58String;
  free: bigint;
  reserved: bigint;
};
export type Iehf2srrsvlrt4 = {
  currency_id: number;
  amount: bigint;
};
export type I1a3321bv4rsn2 = {
  currency_id: number;
  who: SS58String;
  free_amount: bigint;
  reserved_amount: bigint;
};
export type Ibmagsilt697o6 = {
  lock_id: FixedSizeBinary<8>;
  currency_id: number;
  who: SS58String;
  amount: bigint;
};
export type I73g6utvpcmklb = {
  lock_id: FixedSizeBinary<8>;
  currency_id: number;
  who: SS58String;
};
export type I6qgq0m7o225jg = AnonymousEnum<{
  /**
   *Currency transfer success.
   */
  Transferred: Anonymize<I82vqlr4shhaso>;
  /**
   *Update balance success.
   */
  BalanceUpdated: Anonymize<I24s4g6gkj5oec>;
  /**
   *Deposit success.
   */
  Deposited: Anonymize<I24s4g6gkj5oec>;
  /**
   *Withdraw success.
   */
  Withdrawn: Anonymize<I24s4g6gkj5oec>;
}>;
export type I3jgv45gfqgi7c = AnonymousEnum<{
  /**
   *Added new vesting schedule.
   */
  VestingScheduleAdded: Anonymize<I4uo49pmivhb33>;
  /**
   *Claimed vesting.
   */
  Claimed: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Updated vesting schedules.
   */
  VestingSchedulesUpdated: Anonymize<I4cbvqmqadhrea>;
}>;
export type I4uo49pmivhb33 = {
  from: SS58String;
  to: SS58String;
  vesting_schedule: Anonymize<I6k9mlgqa572np>;
};
export type I6k9mlgqa572np = {
  start: number;
  period: number;
  period_count: number;
  per_period: bigint;
};
export type I9k071kk4cn1u8 = AnonymousEnum<{
  /**
   *Ethereum events from contracts.
   */
  Log: Anonymize<Ifmc9boeeia623>;
  /**
   *A contract has been created at given address.
   */
  Created: Anonymize<Itmchvgqfl28g>;
  /**
   *A contract was attempted to be created, but the execution failed.
   */
  CreatedFailed: Anonymize<Itmchvgqfl28g>;
  /**
   *A contract has been executed successfully with states applied.
   */
  Executed: Anonymize<Itmchvgqfl28g>;
  /**
   *A contract has been executed with errors. States are reverted with only gas fees applied.
   */
  ExecutedFailed: Anonymize<Itmchvgqfl28g>;
}>;
export type Ifmc9boeeia623 = {
  log: Anonymize<I10qb03fpuk6em>;
};
export type I10qb03fpuk6em = {
  address: FixedSizeBinary<20>;
  topics: Anonymize<Ic5m5lp1oioo8r>;
  data: Binary;
};
export type Itmchvgqfl28g = {
  address: FixedSizeBinary<20>;
};
export type I510u4q1qqh897 = AnonymousEnum<{
  /**
   *An ethereum transaction was successfully executed.
   */
  Executed: Anonymize<Iea4g5ovhnolus>;
}>;
export type Iea4g5ovhnolus = {
  from: FixedSizeBinary<20>;
  to: FixedSizeBinary<20>;
  transaction_hash: FixedSizeBinary<32>;
  exit_reason: Anonymize<Iag9iovb9j5ijo>;
  extra_data: Binary;
};
export type Iag9iovb9j5ijo = AnonymousEnum<{
  Succeed: Anonymize<Ifbj2gu50vf7nt>;
  Error: Anonymize<I5ksr7ru2gk4nh>;
  Revert: Anonymize<I802eqdju1ngib>;
  Fatal: Anonymize<I85tliolbaj39g>;
}>;
export type Ifbj2gu50vf7nt = AnonymousEnum<{
  Stopped: undefined;
  Returned: undefined;
  Suicided: undefined;
}>;
export type I5ksr7ru2gk4nh = AnonymousEnum<{
  StackUnderflow: undefined;
  StackOverflow: undefined;
  InvalidJump: undefined;
  InvalidRange: undefined;
  DesignatedInvalid: undefined;
  CallTooDeep: undefined;
  CreateCollision: undefined;
  CreateContractLimit: undefined;
  InvalidCode: number;
  OutOfOffset: undefined;
  OutOfGas: undefined;
  OutOfFund: undefined;
  PCUnderflow: undefined;
  CreateEmpty: undefined;
  Other: string;
  MaxNonce: undefined;
}>;
export type I802eqdju1ngib = AnonymousEnum<{
  Reverted: undefined;
}>;
export type I85tliolbaj39g = AnonymousEnum<{
  NotSupported: undefined;
  UnhandledInterrupt: undefined;
  CallErrorAsFatal: Anonymize<I5ksr7ru2gk4nh>;
  Other: string;
}>;
export type I5g0cg8sq1eggv = AnonymousEnum<{
  /**
   *Binding was created.
   */
  Bound: Anonymize<I8363i1h1dgh0n>;
  /**
   *Deployer was added.
   */
  DeployerAdded: Anonymize<Ibqjgs3foip9fb>;
  /**
   *Deployer was removed.
   */
  DeployerRemoved: Anonymize<Ibqjgs3foip9fb>;
  /**
   *Contract was approved.
   */
  ContractApproved: Anonymize<Itmchvgqfl28g>;
  /**
   *Contract was disapproved.
   */
  ContractDisapproved: Anonymize<Itmchvgqfl28g>;
}>;
export type I8363i1h1dgh0n = {
  account: SS58String;
  address: FixedSizeBinary<20>;
};
export type Ibqjgs3foip9fb = {
  who: FixedSizeBinary<20>;
};
export type I479nm08b6ujjd = AnonymousEnum<{
  /**
   *New global farm was created.
   */
  GlobalFarmCreated: Anonymize<I4o7otrppfgqfl>;
  /**
   *Global farm's `price_adjustment` was updated.
   */
  GlobalFarmUpdated: Anonymize<I4h1hamhsvt02v>;
  /**
   *New yield farm was added into the farm.
   */
  YieldFarmCreated: Anonymize<Ibil4nv30gc4gi>;
  /**
   *Global farm was terminated.
   */
  GlobalFarmTerminated: Anonymize<I8p8774nu1gec7>;
  /**
   *New LP tokens was deposited.
   */
  SharesDeposited: Anonymize<I2k8785n6tr14a>;
  /**
   *LP token was redeposited for a new yield farm entry
   */
  SharesRedeposited: Anonymize<I2k8785n6tr14a>;
  /**
   *Rewards was claimed.
   */
  RewardClaimed: Anonymize<I16oglmrf6q8h2>;
  /**
   *LP tokens was withdrawn.
   */
  SharesWithdrawn: Anonymize<I2k8785n6tr14a>;
  /**
   *Yield farm for asset pair was stopped.
   */
  YieldFarmStopped: Anonymize<I1mm5epgr01rv3>;
  /**
   *Yield farm for asset pair was resumed.
   */
  YieldFarmResumed: Anonymize<Ia4163nej70ub3>;
  /**
   *Yield farm was terminated from global farm.
   */
  YieldFarmTerminated: Anonymize<I1mm5epgr01rv3>;
  /**
   *Yield farm multiplier was updated.
   */
  YieldFarmUpdated: Anonymize<Ia4163nej70ub3>;
  /**
   *NFT representing deposit has been destroyed
   */
  DepositDestroyed: Anonymize<Iv3iro9hpdvcu>;
}>;
export type I4o7otrppfgqfl = {
  id: number;
  owner: SS58String;
  total_rewards: bigint;
  reward_currency: number;
  yield_per_period: bigint;
  planned_yielding_periods: number;
  blocks_per_period: number;
  incentivized_asset: number;
  max_reward_per_period: bigint;
  min_deposit: bigint;
  price_adjustment: bigint;
};
export type I4h1hamhsvt02v = {
  id: number;
  price_adjustment: bigint;
};
export type Ibil4nv30gc4gi = {
  global_farm_id: number;
  yield_farm_id: number;
  multiplier: bigint;
  asset_pair: Anonymize<I4kv0johj9i346>;
  loyalty_curve?: Anonymize<Ieot4d4ofvtguv>;
};
export type I4kv0johj9i346 = {
  asset_in: number;
  asset_out: number;
};
export type I2k8785n6tr14a = {
  global_farm_id: number;
  yield_farm_id: number;
  who: SS58String;
  amount: bigint;
  lp_token: number;
  deposit_id: bigint;
};
export type I1mm5epgr01rv3 = {
  global_farm_id: number;
  yield_farm_id: number;
  who: SS58String;
  asset_pair: Anonymize<I4kv0johj9i346>;
};
export type Ia4163nej70ub3 = {
  global_farm_id: number;
  yield_farm_id: number;
  who: SS58String;
  asset_pair: Anonymize<I4kv0johj9i346>;
  multiplier: bigint;
};
export type I3cdbmcrrt95qk = AnonymousEnum<{
  /**
   *Current block numbers
   *[ Parachain block number, Relaychain Block number ]
   */
  CurrentBlockNumbers: Anonymize<Iec641q1s1ifm2>;
}>;
export type Iec641q1s1ifm2 = {
  parachain_block_number: number;
  relaychain_block_number: number;
};
export type I7n8b0ets25mll = AnonymousEnum<{
  /**
   *The DCA execution is started
   */
  ExecutionStarted: Anonymize<I4rrqp6atse8pe>;
  /**
   *The DCA is scheduled for next execution
   */
  Scheduled: Anonymize<I17mdck5880djt>;
  /**
   *The DCA is planned for blocknumber
   */
  ExecutionPlanned: Anonymize<I140nraqvlukpk>;
  /**
   *Deprecated. Use pallet_amm::Event::Swapped instead.
   *The DCA trade is successfully executed
   */
  TradeExecuted: Anonymize<Irs8utdvl0ftp>;
  /**
   *The DCA trade execution is failed
   */
  TradeFailed: Anonymize<Ib2ojij8i8r7vn>;
  /**
   *The DCA is terminated and completely removed from the chain
   */
  Terminated: Anonymize<Ib2ojij8i8r7vn>;
  /**
   *The DCA is completed and completely removed from the chain
   */
  Completed: Anonymize<Iumh462jqskl8>;
  /**
   *Randomness generation failed possibly coming from missing data about relay chain
   */
  RandomnessGenerationFailed: Anonymize<I88onmld8ptm2c>;
}>;
export type I4rrqp6atse8pe = {
  id: number;
  block: number;
};
export type I17mdck5880djt = {
  id: number;
  who: SS58String;
  period: number;
  total_amount: bigint;
  order: Anonymize<I773hpv1qdisu8>;
};
export type I773hpv1qdisu8 = AnonymousEnum<{
  Sell: Anonymize<Iet9su1uri0qgo>;
  Buy: Anonymize<I242odhgbhik24>;
}>;
export type Iet9su1uri0qgo = {
  asset_in: number;
  asset_out: number;
  amount_in: bigint;
  min_amount_out: bigint;
  route: Anonymize<Iesal24fi7slt9>;
};
export type Iesal24fi7slt9 = Array<Anonymize<I3ptra4kqn7hbc>>;
export type I3ptra4kqn7hbc = {
  pool: Anonymize<I9efrv8p154h0u>;
  asset_in: number;
  asset_out: number;
};
export type I9efrv8p154h0u = AnonymousEnum<{
  XYK: undefined;
  LBP: undefined;
  Stableswap: number;
  Omnipool: undefined;
}>;
export type I242odhgbhik24 = {
  asset_in: number;
  asset_out: number;
  amount_out: bigint;
  max_amount_in: bigint;
  route: Anonymize<Iesal24fi7slt9>;
};
export type I140nraqvlukpk = {
  id: number;
  who: SS58String;
  block: number;
};
export type Irs8utdvl0ftp = {
  id: number;
  who: SS58String;
  amount_in: bigint;
  amount_out: bigint;
};
export type Ib2ojij8i8r7vn = {
  id: number;
  who: SS58String;
  error: Anonymize<I9sdjnqgsnrang>;
};
export type Iumh462jqskl8 = {
  id: number;
  who: SS58String;
};
export type I88onmld8ptm2c = {
  block: number;
  error: Anonymize<I9sdjnqgsnrang>;
};
export type I6hp9satpajc60 = AnonymousEnum<{
  /**
   *Scheduled some task.
   */
  Scheduled: Anonymize<I5n4sebgkfr760>;
  /**
   *Canceled some task.
   */
  Canceled: Anonymize<I5n4sebgkfr760>;
  /**
   *Dispatched some task.
   */
  Dispatched: Anonymize<I91fqhmftmm9on>;
  /**
   *Set a retry configuration for some task.
   */
  RetrySet: Anonymize<Ia3c82eadg79bj>;
  /**
   *Cancel a retry configuration for some task.
   */
  RetryCancelled: Anonymize<Ienusoeb625ftq>;
  /**
   *The call for the provided hash was not found so the task has been aborted.
   */
  CallUnavailable: Anonymize<Ienusoeb625ftq>;
  /**
   *The given task was unable to be renewed since the agenda is full at that block.
   */
  PeriodicFailed: Anonymize<Ienusoeb625ftq>;
  /**
   *The given task was unable to be retried since the agenda is full at that block or there
   *was not enough weight to reschedule it.
   */
  RetryFailed: Anonymize<Ienusoeb625ftq>;
  /**
   *The given task can never be executed since it is overweight.
   */
  PermanentlyOverweight: Anonymize<Ienusoeb625ftq>;
}>;
export type I5n4sebgkfr760 = {
  when: number;
  index: number;
};
export type I91fqhmftmm9on = {
  task: Anonymize<I9jd27rnpm8ttv>;
  id?: Anonymize<I4s6vifaf8k998>;
  result: Anonymize<I5kcp0gmhl71c>;
};
export type Ia3c82eadg79bj = {
  task: Anonymize<I9jd27rnpm8ttv>;
  id?: Anonymize<I4s6vifaf8k998>;
  period: number;
  retries: number;
};
export type Ienusoeb625ftq = {
  task: Anonymize<I9jd27rnpm8ttv>;
  id?: Anonymize<I4s6vifaf8k998>;
};
export type Idrvf3ouahq8la = AnonymousEnum<{
  /**
   *Message discarded due to an error in the `MessageProcessor` (usually a format error).
   */
  ProcessingFailed: Anonymize<I3vs6qhrit34fa>;
  /**
   *Message is processed.
   */
  Processed: Anonymize<Ia3uu7lqcc1q1i>;
  /**
   *Message placed in overweight queue.
   */
  OverweightEnqueued: Anonymize<I7crucfnonitkn>;
  /**
   *This page was reaped.
   */
  PageReaped: Anonymize<I7tmrp94r9sq4n>;
}>;
export type I3vs6qhrit34fa = {
  /**
   *The `blake2_256` hash of the message.
   */
  id: FixedSizeBinary<32>;
  /**
   *The queue of the message.
   */
  origin: Anonymize<Iejeo53sea6n4q>;
  /**
   *The error that occurred.
   *
   *This error is pretty opaque. More fine-grained errors need to be emitted as events
   *by the `MessageProcessor`.
   */
  error: ProcessMessageError;
};
export type ProcessMessageError = Enum<{
  BadFormat: undefined;
  Corrupt: undefined;
  Unsupported: undefined;
  Overweight: Anonymize<I4q39t5hn830vp>;
  Yield: undefined;
}>;
export declare const ProcessMessageError: GetEnum<ProcessMessageError>;
export type I1615emstntqta = AnonymousEnum<{
  /**
   *XCM message sent. \[to, message\]
   */
  Sent: Anonymize<Id3ajno3thjgec>;
}>;
export type Id3ajno3thjgec = {
  to: Anonymize<I4c0s5cioidn76>;
  message: Anonymize<Iegrepoo0c1jc5>;
};
export type Ie93bvvt769opj = AnonymousEnum<{
  /**
   *Transferred `Asset` with fee.
   */
  TransferredAssets: Anonymize<Ic04t5m0ihvrp5>;
}>;
export type Ic04t5m0ihvrp5 = {
  sender: SS58String;
  assets: Anonymize<I50mli3hb64f9b>;
  fee: Anonymize<Ia5l7mu5a6v49o>;
  dest: Anonymize<I4c0s5cioidn76>;
};
export type Ia2698nr6jkt = AnonymousEnum<{
  /**
   *Deposit success.
   */
  Deposited: Anonymize<I7id9rd759h17f>;
  /**
   *Withdraw success.
   */
  Withdrawn: Anonymize<I7id9rd759h17f>;
}>;
export type I7id9rd759h17f = {
  asset: Anonymize<Ia5l7mu5a6v49o>;
  who: Anonymize<I4c0s5cioidn76>;
};
export type Iehrcm8i7udvpg = AnonymousEnum<{
  /**
   *Oracle was added to the whitelist.
   */
  AddedToWhitelist: Anonymize<Iabgdocrka40v9>;
  /**
   *Oracle was removed from the whitelist.
   */
  RemovedFromWhitelist: Anonymize<Iabgdocrka40v9>;
}>;
export type Iabgdocrka40v9 = {
  source: FixedSizeBinary<8>;
  assets: Anonymize<I9jd27rnpm8ttv>;
};
export type I3muc97flmjou2 = AnonymousEnum<{
  /**
   *Trade executed.
   */
  Swapped: Anonymize<Ieud99mk6qrhbc>;
}>;
export type Ieud99mk6qrhbc = {
  swapper: SS58String;
  filler: SS58String;
  filler_type: Anonymize<I87khv6m9bdfag>;
  operation: Anonymize<I7g7hunr3bvtdn>;
  inputs: Anonymize<I45p8ugb1i0k16>;
  outputs: Anonymize<I45p8ugb1i0k16>;
  fees: Anonymize<Iclr0lb1si1e81>;
  operation_stack: Anonymize<I7k4nkfs24tj3>;
};
export type I87khv6m9bdfag = AnonymousEnum<{
  Omnipool: undefined;
  Stableswap: number;
  XYK: number;
  LBP: undefined;
  OTC: number;
}>;
export type I7g7hunr3bvtdn = AnonymousEnum<{
  ExactIn: undefined;
  ExactOut: undefined;
  Limit: undefined;
  LiquidityAdd: undefined;
  LiquidityRemove: undefined;
}>;
export type I45p8ugb1i0k16 = Array<Anonymize<Ing3etrevsfg0>>;
export type Ing3etrevsfg0 = {
  asset: number;
  amount: bigint;
};
export type Iclr0lb1si1e81 = Array<Anonymize<I4dhj9tc4sc4dv>>;
export type I4dhj9tc4sc4dv = {
  asset: number;
  amount: bigint;
  destination: Anonymize<Ibsj5b1md36boh>;
};
export type Ibsj5b1md36boh = AnonymousEnum<{
  Account: SS58String;
  Burned: undefined;
}>;
export type I7k4nkfs24tj3 = Array<Anonymize<Ib5qn3el7ts2l9>>;
export type Ib5qn3el7ts2l9 = AnonymousEnum<{
  Router: number;
  DCA: Anonymize<I9jd27rnpm8ttv>;
  Batch: number;
  Omnipool: number;
  XcmExchange: number;
  Xcm: Anonymize<I4pact7n2e9a0i>;
}>;
export type I4pact7n2e9a0i = [FixedSizeBinary<32>, number];
export type I3oiqtmlj7klbr = Array<Anonymize<Ifde25j06ecor0>>;
export type Ifde25j06ecor0 = {
  id: Anonymize<I8qhoqaff9bl1a>;
  amount: bigint;
};
export type I8qhoqaff9bl1a = AnonymousEnum<{
  Preimage: PreimagePalletHoldReason;
  StateTrieMigration: Anonymize<I7lf1val3vmpq0>;
}>;
export type PreimagePalletHoldReason = Enum<{
  Preimage: undefined;
}>;
export declare const PreimagePalletHoldReason: GetEnum<PreimagePalletHoldReason>;
export type I7lf1val3vmpq0 = AnonymousEnum<{
  SlashForMigrate: undefined;
}>;
export type Iegmj7n48sc3am = {
  proposer: SS58String;
  value: bigint;
  beneficiary: SS58String;
  bond: bigint;
};
export type Ie9j1itogtv7p5 = {
  amount: bigint;
  beneficiary: SS58String;
  valid_from: number;
  expire_at: number;
  status: Anonymize<Ier5jvvb5iqu1g>;
};
export type Ier5jvvb5iqu1g = AnonymousEnum<{
  Pending: undefined;
  Attempted: Anonymize<I3m5sq54sjdlso>;
  Failed: undefined;
}>;
export type I3m5sq54sjdlso = {};
export type PreimageOldRequestStatus = Enum<{
  Unrequested: Anonymize<I5jej6bvdjrisr>;
  Requested: Anonymize<Is7sg1rr9u2nm>;
}>;
export declare const PreimageOldRequestStatus: GetEnum<PreimageOldRequestStatus>;
export type I5jej6bvdjrisr = {
  deposit: Anonymize<I95l2k9b1re95f>;
  len: number;
};
export type Is7sg1rr9u2nm = {
  deposit?: Anonymize<I92hdo1clkbp4g>;
  count: number;
  len?: Anonymize<I4arjljr6dpflb>;
};
export type I92hdo1clkbp4g = Anonymize<I95l2k9b1re95f> | undefined;
export type PreimageRequestStatus = Enum<{
  Unrequested: Anonymize<Idvcv8961o32th>;
  Requested: Anonymize<In82i9avte5re>;
}>;
export declare const PreimageRequestStatus: GetEnum<PreimageRequestStatus>;
export type Idvcv8961o32th = {
  ticket: Anonymize<I95l2k9b1re95f>;
  len: number;
};
export type In82i9avte5re = {
  maybe_ticket?: Anonymize<I92hdo1clkbp4g>;
  count: number;
  maybe_len?: Anonymize<I4arjljr6dpflb>;
};
export type I1evsr8hplu1lg = [
  Anonymize<I4ftk0glls7946>,
  Anonymize<Iabpgqcjikia83>,
];
export type I4ftk0glls7946 = {
  judgements: Anonymize<I5lbssihti472g>;
  deposit: bigint;
  info: Anonymize<I1o57snqt6f4v5>;
};
export type I5lbssihti472g = Array<Anonymize<I7uhmpkgp9kq6>>;
export type I7uhmpkgp9kq6 = [number, Anonymize<IdentityJudgement>];
export type IdentityJudgement = Enum<{
  Unknown: undefined;
  FeePaid: bigint;
  Reasonable: undefined;
  KnownGood: undefined;
  OutOfDate: undefined;
  LowQuality: undefined;
  Erroneous: undefined;
}>;
export declare const IdentityJudgement: GetEnum<IdentityJudgement>;
export type I1o57snqt6f4v5 = {
  additional: Anonymize<I9rp1vd8cfo0na>;
  display: Anonymize<IdentityData>;
  legal: Anonymize<IdentityData>;
  web: Anonymize<IdentityData>;
  riot: Anonymize<IdentityData>;
  email: Anonymize<IdentityData>;
  pgp_fingerprint?: Anonymize<If7b8240vgt2q5>;
  image: Anonymize<IdentityData>;
  twitter: Anonymize<IdentityData>;
};
export type I9rp1vd8cfo0na = Array<Anonymize<Ifqv6alck9pqqn>>;
export type Ifqv6alck9pqqn = FixedSizeArray<2, Anonymize<IdentityData>>;
export type IdentityData = Enum<{
  None: undefined;
  Raw0: undefined;
  Raw1: number;
  Raw2: FixedSizeBinary<2>;
  Raw3: FixedSizeBinary<3>;
  Raw4: FixedSizeBinary<4>;
  Raw5: FixedSizeBinary<5>;
  Raw6: FixedSizeBinary<6>;
  Raw7: FixedSizeBinary<7>;
  Raw8: FixedSizeBinary<8>;
  Raw9: FixedSizeBinary<9>;
  Raw10: FixedSizeBinary<10>;
  Raw11: FixedSizeBinary<11>;
  Raw12: FixedSizeBinary<12>;
  Raw13: FixedSizeBinary<13>;
  Raw14: FixedSizeBinary<14>;
  Raw15: FixedSizeBinary<15>;
  Raw16: FixedSizeBinary<16>;
  Raw17: FixedSizeBinary<17>;
  Raw18: FixedSizeBinary<18>;
  Raw19: FixedSizeBinary<19>;
  Raw20: FixedSizeBinary<20>;
  Raw21: FixedSizeBinary<21>;
  Raw22: FixedSizeBinary<22>;
  Raw23: FixedSizeBinary<23>;
  Raw24: FixedSizeBinary<24>;
  Raw25: FixedSizeBinary<25>;
  Raw26: FixedSizeBinary<26>;
  Raw27: FixedSizeBinary<27>;
  Raw28: FixedSizeBinary<28>;
  Raw29: FixedSizeBinary<29>;
  Raw30: FixedSizeBinary<30>;
  Raw31: FixedSizeBinary<31>;
  Raw32: FixedSizeBinary<32>;
  BlakeTwo256: FixedSizeBinary<32>;
  Sha256: FixedSizeBinary<32>;
  Keccak256: FixedSizeBinary<32>;
  ShaThree256: FixedSizeBinary<32>;
}>;
export declare const IdentityData: GetEnum<IdentityData>;
export type If7b8240vgt2q5 = FixedSizeBinary<20> | undefined;
export type I910puuahutflf = [SS58String, Anonymize<IdentityData>];
export type I4nfjdef0ibh44 = [bigint, Anonymize<Ia2lhg7l2hilo3>];
export type I74af64m08r6as = Array<Anonymize<I48v3sekdprq30>>;
export type I48v3sekdprq30 = Anonymize<Icj8lp9f0lq0bm> | undefined;
export type Icj8lp9f0lq0bm = {
  account: SS58String;
  fee: bigint;
  fields: bigint;
};
export type I9bhbof2vim227 = {
  suffix: Binary;
  allocation: number;
};
export type I6mhebgj62g585 = Array<Anonymize<Iev2vf4qidj2bb>>;
export type Iev2vf4qidj2bb = [number, PreimagesBounded, SS58String];
export type I3vhcedhm4hpvm = [Anonymize<Ia2lhg7l2hilo3>, bigint];
export type I526daka7j7b17 = AnonymousEnum<{
  Ongoing: Anonymize<Ib7kb5hesu2n89>;
  Finished: Anonymize<If3rj324plfvri>;
}>;
export type Ib7kb5hesu2n89 = {
  end: number;
  proposal: PreimagesBounded;
  threshold: Anonymize<Ivbp9821csvot>;
  delay: number;
  tally: Anonymize<I2t2oo1s4d4ktl>;
};
export type I2t2oo1s4d4ktl = {
  ayes: bigint;
  nays: bigint;
  turnout: bigint;
};
export type If3rj324plfvri = {
  approved: boolean;
  end: number;
};
export type Ifanv2kvm586s4 = AnonymousEnum<{
  Direct: Anonymize<I4am87oq5cml79>;
  Delegating: Anonymize<I251o9sbu5566f>;
}>;
export type I4am87oq5cml79 = {
  votes: Anonymize<Id6vlpeidk3q34>;
  delegations: Anonymize<I538qha8r4j3ii>;
  prior: Anonymize<I4ojmnsk1dchql>;
};
export type Id6vlpeidk3q34 = Array<Anonymize<I9fcbs3jkoqnc>>;
export type I9fcbs3jkoqnc = [number, Anonymize<Ia9hdots6g53fs>];
export type I538qha8r4j3ii = {
  votes: bigint;
  capital: bigint;
};
export type I4ojmnsk1dchql = [number, bigint];
export type I251o9sbu5566f = {
  balance: bigint;
  target: SS58String;
  conviction: VotingConviction;
  delegations: Anonymize<I538qha8r4j3ii>;
  prior: Anonymize<I4ojmnsk1dchql>;
};
export type VotingConviction = Enum<{
  None: undefined;
  Locked1x: undefined;
  Locked2x: undefined;
  Locked3x: undefined;
  Locked4x: undefined;
  Locked5x: undefined;
  Locked6x: undefined;
}>;
export declare const VotingConviction: GetEnum<VotingConviction>;
export type I5rsgtofmn5lli = [PreimagesBounded, Anonymize<Ivbp9821csvot>];
export type Idned7t7knml6b = [number, Anonymize<Ia2lhg7l2hilo3>];
export type I8nj9dlo7lnbb3 = Array<Anonymize<I7jaj0isqeg12v>>;
export type I7jaj0isqeg12v = {
  who: SS58String;
  stake: bigint;
  deposit: bigint;
};
export type Ib23vkkc52tqbu = {
  votes: Anonymize<Ia2lhg7l2hilo3>;
  stake: bigint;
  deposit: bigint;
};
export type I3334u30i909c2 = AnonymousEnum<{
  System: Anonymize<Iekve0i6djpd9f>;
  Timestamp: Anonymize<I7d75gqfg6jh9c>;
  Balances: Anonymize<Ibji81a0gss9ru>;
  MultiTransactionPayment: Anonymize<I76nh75sf57g68>;
  Treasury: Anonymize<I6f06951njrcra>;
  Utility: Anonymize<I2f40hfd8hc94h>;
  Preimage: Anonymize<If81ks88t5mpk5>;
  Identity: Anonymize<I27rv6v6kueehs>;
  Democracy: Anonymize<I6u9fdc1fne8nd>;
  Elections: Anonymize<Ifj3hlfbcdobl3>;
  Council: Anonymize<Icbun7a2ilh0ie>;
  TechnicalCommittee: Anonymize<Icbun7a2ilh0ie>;
  Tips: Anonymize<Ibcos58g5647s0>;
  Proxy: Anonymize<Ice7b5qchdur34>;
  Multisig: Anonymize<I24s5pro59pp48>;
  Uniques: Anonymize<I1aih3rf2i8nc0>;
  StateTrieMigration: Anonymize<I39l72gdmkk30t>;
  ConvictionVoting: Anonymize<I2n8tlau8fpfvp>;
  Referenda: Anonymize<Id898bhfhj4av7>;
  Whitelist: Anonymize<I7uniqr4bcb80r>;
  Dispatcher: Anonymize<I8hpku63o0lr7m>;
  AssetRegistry: Anonymize<I8bdjcphmftv62>;
  Claims: Anonymize<I5queflebive1d>;
  GenesisHistory: undefined;
  Omnipool: Anonymize<I72obq5poq736n>;
  TransactionPause: Anonymize<I851i9piqh9qel>;
  Duster: Anonymize<I6kr4saq8f2pd8>;
  OmnipoolWarehouseLM: undefined;
  OmnipoolLiquidityMining: Anonymize<Ibsr3gp7asrav3>;
  OTC: Anonymize<I5ophbk33alrde>;
  CircuitBreaker: Anonymize<Ihq0rdic3bdqe>;
  Router: Anonymize<Ifia7upsofqkg9>;
  DynamicFees: undefined;
  Staking: Anonymize<Iaikdgvqtjn8sd>;
  Stableswap: Anonymize<I2buckaidasvkd>;
  Bonds: Anonymize<It0rq8pffd1r>;
  OtcSettlements: Anonymize<I75o581gpaivou>;
  LBP: Anonymize<I4ogitqakc83nm>;
  XYK: Anonymize<I1bhk4tkod8r9d>;
  Referrals: Anonymize<Ibe97e14cmm4e9>;
  Liquidation: Anonymize<I2apo1k5eu55qq>;
  Tokens: Anonymize<I6a7o6bu2n2amk>;
  Currencies: Anonymize<Id0m4jim3jch3f>;
  Vesting: Anonymize<Ieps3dhtu498hk>;
  EVM: Anonymize<I8s4v176jtv80g>;
  Ethereum: Anonymize<Icu3fce0sripq4>;
  EVMAccounts: Anonymize<Icg33f60pm7v85>;
  XYKLiquidityMining: Anonymize<I7ecgc6etbbr5p>;
  XYKWarehouseLM: undefined;
  RelayChainInfo: undefined;
  DCA: Anonymize<Io4g1ahr3evjh>;
  Scheduler: Anonymize<Id1q91j6hrn3l8>;
  ParachainSystem: Anonymize<I3jmip7qjlcqot>;
  ParachainInfo: undefined;
  PolkadotXcm: Anonymize<I9nbjvlrb9bp1g>;
  CumulusXcm: undefined;
  MessageQueue: Anonymize<Ic2uoe7jdksosp>;
  OrmlXcm: Anonymize<I9r7qbm7jckmoe>;
  XTokens: Anonymize<I5088lfff92ve7>;
  CollatorSelection: Anonymize<I9dpq5287dur8b>;
  Session: Anonymize<I77dda7hps0u37>;
  EmaOracle: Anonymize<I46ka778gu5a9a>;
  Broadcast: undefined;
}>;
export type Ibji81a0gss9ru = AnonymousEnum<{
  /**
   *Transfer some liquid free balance to another account.
   *
   *`transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
   *If the sender's account is below the existential deposit as a result
   *of the transfer, the account will be reaped.
   *
   *The dispatch origin for this call must be `Signed` by the transactor.
   */
  transfer_allow_death: Anonymize<I1o12ibtjm10ot>;
  /**
   *Exactly as `transfer_allow_death`, except the origin must be root and the source account
   *may be specified.
   */
  force_transfer: Anonymize<I8vn14j8a40qm>;
  /**
   *Same as the [`transfer_allow_death`] call, but with a check that the transfer will not
   *kill the origin account.
   *
   *99% of the time you want [`transfer_allow_death`] instead.
   *
   *[`transfer_allow_death`]: struct.Pallet.html#method.transfer
   */
  transfer_keep_alive: Anonymize<I1o12ibtjm10ot>;
  /**
   *Transfer the entire transferable balance from the caller account.
   *
   *NOTE: This function only attempts to transfer _transferable_ balances. This means that
   *any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
   *transferred by this function. To ensure that this function results in a killed account,
   *you might need to prepare the account by removing any reference counters, storage
   *deposits, etc...
   *
   *The dispatch origin of this call must be Signed.
   *
   *- `dest`: The recipient of the transfer.
   *- `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
   *  of the funds the account has, causing the sender account to be killed (false), or
   *  transfer everything except at least the existential deposit, which will guarantee to
   *  keep the sender account alive (true).
   */
  transfer_all: Anonymize<I493o732nahjlr>;
  /**
   *Unreserve some balance from a user by force.
   *
   *Can only be called by ROOT.
   */
  force_unreserve: Anonymize<Id5fm4p8lj5qgi>;
  /**
   *Upgrade a specified account.
   *
   *- `origin`: Must be `Signed`.
   *- `who`: The account to be upgraded.
   *
   *This will waive the transaction fee if at least all but 10% of the accounts needed to
   *be upgraded. (We let some not have to be upgraded just in order to allow for the
   *possibility of churn).
   */
  upgrade_accounts: Anonymize<Ibmr18suc9ikh9>;
  /**
   *Set the regular balance of a given account.
   *
   *The dispatch origin for this call is `root`.
   */
  force_set_balance: Anonymize<I4og34pg4ruv5d>;
  /**
   *Adjust the total issuance in a saturating way.
   *
   *Can only be called by root and always needs a positive `delta`.
   *
   *# Example
   */
  force_adjust_total_issuance: Anonymize<I5u8olqbbvfnvf>;
}>;
export type I1o12ibtjm10ot = {
  dest: SS58String;
  value: bigint;
};
export type I8vn14j8a40qm = {
  source: SS58String;
  dest: SS58String;
  value: bigint;
};
export type I493o732nahjlr = {
  dest: SS58String;
  keep_alive: boolean;
};
export type I4og34pg4ruv5d = {
  who: SS58String;
  new_free: bigint;
};
export type I76nh75sf57g68 = AnonymousEnum<{
  /**
   *Set selected currency for given account.
   *
   *This allows to set a currency for an account in which all transaction fees will be paid.
   *Account balance cannot be zero.
   *
   *In case of sufficient asset, the chosen currency must be in the list of accepted currencies
   *In case of insufficient asset, the chosen currency must have a XYK pool with DOT
   *
   *When currency is set, fixed fee is withdrawn from the account to pay for the currency change
   *
   *EVM accounts are now allowed to change thier payment currency.
   *
   *Emits `CurrencySet` event when successful.
   */
  set_currency: Anonymize<Ic1e6uvbf8ado3>;
  /**
   *Add a currency to the list of accepted currencies.
   *
   *Only member can perform this action.
   *
   *Currency must not be already accepted. Core asset id cannot be explicitly added.
   *
   *Emits `CurrencyAdded` event when successful.
   */
  add_currency: Anonymize<Ie7oqvfdar8r2>;
  /**
   *Remove currency from the list of supported currencies
   *Only selected members can perform this action
   *
   *Core asset cannot be removed.
   *
   *Emits `CurrencyRemoved` when successful.
   */
  remove_currency: Anonymize<Ic1e6uvbf8ado3>;
  /**
   *Reset currency of the specified account to HDX.
   *If the account is EVM account, the payment currency is reset to WETH.
   *Only selected members can perform this action.
   *
   *Emits `CurrencySet` when successful.
   */
  reset_payment_currency: Anonymize<I6v8sm60vvkmk7>;
  /**
   *Dispatch EVM permit.
   *The main purpose of this function is to allow EVM accounts to pay for the transaction fee in non-native currency
   *by allowing them to self-dispatch pre-signed permit.
   *The EVM fee is paid in the currency set for the account.
   */
  dispatch_permit: Anonymize<I92pum5p0t4pat>;
}>;
export type Ic1e6uvbf8ado3 = {
  currency: number;
};
export type Ie7oqvfdar8r2 = {
  currency: number;
  price: bigint;
};
export type I92pum5p0t4pat = {
  from: FixedSizeBinary<20>;
  to: FixedSizeBinary<20>;
  value: Anonymize<I4totqt881mlti>;
  data: Binary;
  gas_limit: bigint;
  deadline: Anonymize<I4totqt881mlti>;
  v: number;
  r: FixedSizeBinary<32>;
  s: FixedSizeBinary<32>;
};
export type I4totqt881mlti = FixedSizeArray<4, bigint>;
export type I6f06951njrcra = AnonymousEnum<{
  /**
   *Put forward a suggestion for spending.
   *
   *## Dispatch Origin
   *
   *Must be signed.
   *
   *## Details
   *A deposit proportional to the value is reserved and slashed if the proposal is rejected.
   *It is returned once the proposal is awarded.
   *
   *### Complexity
   *- O(1)
   *
   *## Events
   *
   *Emits [`Event::Proposed`] if successful.
   */
  propose_spend: Anonymize<I1g5tojdtkn6tu>;
  /**
   *Reject a proposed spend.
   *
   *## Dispatch Origin
   *
   *Must be [`Config::RejectOrigin`].
   *
   *## Details
   *The original deposit will be slashed.
   *
   *### Complexity
   *- O(1)
   *
   *## Events
   *
   *Emits [`Event::Rejected`] if successful.
   */
  reject_proposal: Anonymize<Icm9m0qeemu66d>;
  /**
   *Approve a proposal.
   *
   *## Dispatch Origin
   *
   *Must be [`Config::ApproveOrigin`].
   *
   *## Details
   *
   *At a later time, the proposal will be allocated to the beneficiary and the original
   *deposit will be returned.
   *
   *### Complexity
   * - O(1).
   *
   *## Events
   *
   *No events are emitted from this dispatch.
   */
  approve_proposal: Anonymize<Icm9m0qeemu66d>;
  /**
   *Propose and approve a spend of treasury funds.
   *
   *## Dispatch Origin
   *
   *Must be [`Config::SpendOrigin`] with the `Success` value being at least `amount`.
   *
   *### Details
   *NOTE: For record-keeping purposes, the proposer is deemed to be equivalent to the
   *beneficiary.
   *
   *### Parameters
   *- `amount`: The amount to be transferred from the treasury to the `beneficiary`.
   *- `beneficiary`: The destination account for the transfer.
   *
   *## Events
   *
   *Emits [`Event::SpendApproved`] if successful.
   */
  spend_local: Anonymize<Idscf6boak49q1>;
  /**
   *Force a previously approved proposal to be removed from the approval queue.
   *
   *## Dispatch Origin
   *
   *Must be [`Config::RejectOrigin`].
   *
   *## Details
   *
   *The original deposit will no longer be returned.
   *
   *### Parameters
   *- `proposal_id`: The index of a proposal
   *
   *### Complexity
   *- O(A) where `A` is the number of approvals
   *
   *### Errors
   *- [`Error::ProposalNotApproved`]: The `proposal_id` supplied was not found in the
   *  approval queue, i.e., the proposal has not been approved. This could also mean the
   *  proposal does not exist altogether, thus there is no way it would have been approved
   *  in the first place.
   */
  remove_approval: Anonymize<Icm9m0qeemu66d>;
  /**
   *Propose and approve a spend of treasury funds.
   *
   *## Dispatch Origin
   *
   *Must be [`Config::SpendOrigin`] with the `Success` value being at least
   *`amount` of `asset_kind` in the native asset. The amount of `asset_kind` is converted
   *for assertion using the [`Config::BalanceConverter`].
   *
   *## Details
   *
   *Create an approved spend for transferring a specific `amount` of `asset_kind` to a
   *designated beneficiary. The spend must be claimed using the `payout` dispatchable within
   *the [`Config::PayoutPeriod`].
   *
   *### Parameters
   *- `asset_kind`: An indicator of the specific asset class to be spent.
   *- `amount`: The amount to be transferred from the treasury to the `beneficiary`.
   *- `beneficiary`: The beneficiary of the spend.
   *- `valid_from`: The block number from which the spend can be claimed. It can refer to
   *  the past if the resulting spend has not yet expired according to the
   *  [`Config::PayoutPeriod`]. If `None`, the spend can be claimed immediately after
   *  approval.
   *
   *## Events
   *
   *Emits [`Event::AssetSpendApproved`] if successful.
   */
  spend: Anonymize<I6qq5nnbjegi8u>;
  /**
   *Claim a spend.
   *
   *## Dispatch Origin
   *
   *Must be signed.
   *
   *## Details
   *
   *Spends must be claimed within some temporal bounds. A spend may be claimed within one
   *[`Config::PayoutPeriod`] from the `valid_from` block.
   *In case of a payout failure, the spend status must be updated with the `check_status`
   *dispatchable before retrying with the current function.
   *
   *### Parameters
   *- `index`: The spend index.
   *
   *## Events
   *
   *Emits [`Event::Paid`] if successful.
   */
  payout: Anonymize<I666bl2fqjkejo>;
  /**
   *Check the status of the spend and remove it from the storage if processed.
   *
   *## Dispatch Origin
   *
   *Must be signed.
   *
   *## Details
   *
   *The status check is a prerequisite for retrying a failed payout.
   *If a spend has either succeeded or expired, it is removed from the storage by this
   *function. In such instances, transaction fees are refunded.
   *
   *### Parameters
   *- `index`: The spend index.
   *
   *## Events
   *
   *Emits [`Event::PaymentFailed`] if the spend payout has failed.
   *Emits [`Event::SpendProcessed`] if the spend payout has succeed.
   */
  check_status: Anonymize<I666bl2fqjkejo>;
  /**
   *Void previously approved spend.
   *
   *## Dispatch Origin
   *
   *Must be [`Config::RejectOrigin`].
   *
   *## Details
   *
   *A spend void is only possible if the payout has not been attempted yet.
   *
   *### Parameters
   *- `index`: The spend index.
   *
   *## Events
   *
   *Emits [`Event::AssetSpendVoided`] if successful.
   */
  void_spend: Anonymize<I666bl2fqjkejo>;
}>;
export type I1g5tojdtkn6tu = {
  value: bigint;
  beneficiary: SS58String;
};
export type Icm9m0qeemu66d = {
  proposal_id: number;
};
export type Idscf6boak49q1 = {
  amount: bigint;
  beneficiary: SS58String;
};
export type I6qq5nnbjegi8u = {
  amount: bigint;
  beneficiary: SS58String;
  valid_from?: Anonymize<I4arjljr6dpflb>;
};
export type I2f40hfd8hc94h = AnonymousEnum<{
  /**
   *Send a batch of dispatch calls.
   *
   *May be called from any origin except `None`.
   *
   *- `calls`: The calls to be dispatched from the same origin. The number of call must not
   *  exceed the constant: `batched_calls_limit` (available in constant metadata).
   *
   *If origin is root then the calls are dispatched without checking origin filter. (This
   *includes bypassing `frame_system::Config::BaseCallFilter`).
   *
   *## Complexity
   *- O(C) where C is the number of calls to be batched.
   *
   *This will return `Ok` in all circumstances. To determine the success of the batch, an
   *event is deposited. If a call failed and the batch was interrupted, then the
   *`BatchInterrupted` event is deposited, along with the number of successful calls made
   *and the error of the failed call. If all were successful, then the `BatchCompleted`
   *event is deposited.
   */
  batch: Anonymize<Ibvmpv5kha43st>;
  /**
   *Send a call through an indexed pseudonym of the sender.
   *
   *Filter from origin are passed along. The call will be dispatched with an origin which
   *use the same filter as the origin of this call.
   *
   *NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
   *because you expect `proxy` to have been used prior in the call stack and you do not want
   *the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
   *in the Multisig pallet instead.
   *
   *NOTE: Prior to version *12, this was called `as_limited_sub`.
   *
   *The dispatch origin for this call must be _Signed_.
   */
  as_derivative: Anonymize<Ic30ooaln1e62m>;
  /**
   *Send a batch of dispatch calls and atomically execute them.
   *The whole transaction will rollback and fail if any of the calls failed.
   *
   *May be called from any origin except `None`.
   *
   *- `calls`: The calls to be dispatched from the same origin. The number of call must not
   *  exceed the constant: `batched_calls_limit` (available in constant metadata).
   *
   *If origin is root then the calls are dispatched without checking origin filter. (This
   *includes bypassing `frame_system::Config::BaseCallFilter`).
   *
   *## Complexity
   *- O(C) where C is the number of calls to be batched.
   */
  batch_all: Anonymize<Ibvmpv5kha43st>;
  /**
   *Dispatches a function call with a provided origin.
   *
   *The dispatch origin for this call must be _Root_.
   *
   *## Complexity
   *- O(1).
   */
  dispatch_as: Anonymize<Ifc9cjhms1f6t5>;
  /**
   *Send a batch of dispatch calls.
   *Unlike `batch`, it allows errors and won't interrupt.
   *
   *May be called from any origin except `None`.
   *
   *- `calls`: The calls to be dispatched from the same origin. The number of call must not
   *  exceed the constant: `batched_calls_limit` (available in constant metadata).
   *
   *If origin is root then the calls are dispatch without checking origin filter. (This
   *includes bypassing `frame_system::Config::BaseCallFilter`).
   *
   *## Complexity
   *- O(C) where C is the number of calls to be batched.
   */
  force_batch: Anonymize<Ibvmpv5kha43st>;
  /**
   *Dispatch a function call with a specified weight.
   *
   *This function does not check the weight of the call, and instead allows the
   *Root origin to specify the weight of the call.
   *
   *The dispatch origin for this call must be _Root_.
   */
  with_weight: Anonymize<I21uv2pp95ebqd>;
}>;
export type Ibvmpv5kha43st = {
  calls: Anonymize<I4c0u01r0fvb81>;
};
export type I4c0u01r0fvb81 = Array<TxCallData>;
export type Ic30ooaln1e62m = {
  index: number;
  call: TxCallData;
};
export type Ifc9cjhms1f6t5 = {
  as_origin: Anonymize<I8rbu1vdc38cnp>;
  call: TxCallData;
};
export type I8rbu1vdc38cnp = AnonymousEnum<{
  system: DispatchRawOrigin;
  Council: Anonymize<I637q9f60cmh3e>;
  TechnicalCommittee: Anonymize<I637q9f60cmh3e>;
  Origins: Anonymize<I9cjbmj33c143s>;
  Ethereum: Anonymize<I9hp9au9bfqil7>;
  PolkadotXcm: XcmPalletOrigin;
  CumulusXcm: Anonymize<I3in0d0lb61qi8>;
  Void: undefined;
}>;
export type I637q9f60cmh3e = AnonymousEnum<{
  Members: Anonymize<I9jd27rnpm8ttv>;
  Member: SS58String;
  _Phantom: undefined;
}>;
export type I9cjbmj33c143s = AnonymousEnum<{
  WhitelistedCaller: undefined;
  ReferendumCanceller: undefined;
  ReferendumKiller: undefined;
  GeneralAdmin: undefined;
  OmnipoolAdmin: undefined;
  Treasurer: undefined;
  Spender: undefined;
  Tipper: undefined;
  EconomicParameters: undefined;
}>;
export type I9hp9au9bfqil7 = AnonymousEnum<{
  EthereumTransaction: FixedSizeBinary<20>;
}>;
export type I21uv2pp95ebqd = {
  call: TxCallData;
  weight: Anonymize<I4q39t5hn830vp>;
};
export type If81ks88t5mpk5 = AnonymousEnum<{
  /**
   *Register a preimage on-chain.
   *
   *If the preimage was previously requested, no fees or deposits are taken for providing
   *the preimage. Otherwise, a deposit is taken proportional to the size of the preimage.
   */
  note_preimage: Anonymize<I82nfqfkd48n10>;
  /**
   *Clear an unrequested preimage from the runtime storage.
   *
   *If `len` is provided, then it will be a much cheaper operation.
   *
   *- `hash`: The hash of the preimage to be removed from the store.
   *- `len`: The length of the preimage of `hash`.
   */
  unnote_preimage: Anonymize<I1jm8m1rh9e20v>;
  /**
   *Request a preimage be uploaded to the chain without paying any fees or deposits.
   *
   *If the preimage requests has already been provided on-chain, we unreserve any deposit
   *a user may have paid, and take the control of the preimage out of their hands.
   */
  request_preimage: Anonymize<I1jm8m1rh9e20v>;
  /**
   *Clear a previously made request for a preimage.
   *
   *NOTE: THIS MUST NOT BE CALLED ON `hash` MORE TIMES THAN `request_preimage`.
   */
  unrequest_preimage: Anonymize<I1jm8m1rh9e20v>;
  /**
   *Ensure that the a bulk of pre-images is upgraded.
   *
   *The caller pays no fee if at least 90% of pre-images were successfully updated.
   */
  ensure_updated: Anonymize<I3o5j3bli1pd8e>;
}>;
export type I82nfqfkd48n10 = {
  bytes: Binary;
};
export type I3o5j3bli1pd8e = {
  hashes: Anonymize<Ic5m5lp1oioo8r>;
};
export type I27rv6v6kueehs = AnonymousEnum<{
  /**
   *Add a registrar to the system.
   *
   *The dispatch origin for this call must be `T::RegistrarOrigin`.
   *
   *- `account`: the account of the registrar.
   *
   *Emits `RegistrarAdded` if successful.
   */
  add_registrar: Anonymize<Icbccs0ug47ilf>;
  /**
   *Set an account's identity information and reserve the appropriate deposit.
   *
   *If the account already has identity information, the deposit is taken as part payment
   *for the new deposit.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `info`: The identity information.
   *
   *Emits `IdentitySet` if successful.
   */
  set_identity: Anonymize<I2kds5jji7slh8>;
  /**
   *Set the sub-accounts of the sender.
   *
   *Payment: Any aggregate balance reserved by previous `set_subs` calls will be returned
   *and an amount `SubAccountDeposit` will be reserved for each item in `subs`.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *identity.
   *
   *- `subs`: The identity's (new) sub-accounts.
   */
  set_subs: Anonymize<Ia9mkdf6l44shb>;
  /**
   *Clear an account's identity info and all sub-accounts and return all deposits.
   *
   *Payment: All reserved balances on the account are returned.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *identity.
   *
   *Emits `IdentityCleared` if successful.
   */
  clear_identity: undefined;
  /**
   *Request a judgement from a registrar.
   *
   *Payment: At most `max_fee` will be reserved for payment to the registrar if judgement
   *given.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have a
   *registered identity.
   *
   *- `reg_index`: The index of the registrar whose judgement is requested.
   *- `max_fee`: The maximum fee that may be paid. This should just be auto-populated as:
   *
   *```nocompile
   *Self::registrars().get(reg_index).unwrap().fee
   *```
   *
   *Emits `JudgementRequested` if successful.
   */
  request_judgement: Anonymize<I9l2s4klu0831o>;
  /**
   *Cancel a previous request.
   *
   *Payment: A previously reserved deposit is returned on success.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have a
   *registered identity.
   *
   *- `reg_index`: The index of the registrar whose judgement is no longer requested.
   *
   *Emits `JudgementUnrequested` if successful.
   */
  cancel_request: Anonymize<I2ctrt5nqb8o7c>;
  /**
   *Set the fee required for a judgement to be requested from a registrar.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must be the account
   *of the registrar whose index is `index`.
   *
   *- `index`: the index of the registrar whose fee is to be set.
   *- `fee`: the new fee.
   */
  set_fee: Anonymize<I711qahikocb1c>;
  /**
   *Change the account associated with a registrar.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must be the account
   *of the registrar whose index is `index`.
   *
   *- `index`: the index of the registrar whose fee is to be set.
   *- `new`: the new account ID.
   */
  set_account_id: Anonymize<I93c18nim2s66c>;
  /**
   *Set the field information for a registrar.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must be the account
   *of the registrar whose index is `index`.
   *
   *- `index`: the index of the registrar whose fee is to be set.
   *- `fields`: the fields that the registrar concerns themselves with.
   */
  set_fields: Anonymize<Id6gojh30v9ib2>;
  /**
   *Provide a judgement for an account's identity.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must be the account
   *of the registrar whose index is `reg_index`.
   *
   *- `reg_index`: the index of the registrar whose judgement is being made.
   *- `target`: the account whose identity the judgement is upon. This must be an account
   *  with a registered identity.
   *- `judgement`: the judgement of the registrar of index `reg_index` about `target`.
   *- `identity`: The hash of the [`IdentityInformationProvider`] for that the judgement is
   *  provided.
   *
   *Note: Judgements do not apply to a username.
   *
   *Emits `JudgementGiven` if successful.
   */
  provide_judgement: Anonymize<Ica5n28rlj0lk6>;
  /**
   *Remove an account's identity and sub-account information and slash the deposits.
   *
   *Payment: Reserved balances from `set_subs` and `set_identity` are slashed and handled by
   *`Slash`. Verification request deposits are not returned; they should be cancelled
   *manually using `cancel_request`.
   *
   *The dispatch origin for this call must match `T::ForceOrigin`.
   *
   *- `target`: the account whose identity the judgement is upon. This must be an account
   *  with a registered identity.
   *
   *Emits `IdentityKilled` if successful.
   */
  kill_identity: Anonymize<I14p0q0qs0fqbj>;
  /**
   *Add the given account to the sender's subs.
   *
   *Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
   *to the sender.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *sub identity of `sub`.
   */
  add_sub: Anonymize<Ie3u4phm019a8l>;
  /**
   *Alter the associated name of the given sub-account.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *sub identity of `sub`.
   */
  rename_sub: Anonymize<Ie3u4phm019a8l>;
  /**
   *Remove the given account from the sender's subs.
   *
   *Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
   *to the sender.
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *sub identity of `sub`.
   */
  remove_sub: Anonymize<I9jie72r7q6717>;
  /**
   *Remove the sender as a sub-account.
   *
   *Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
   *to the sender (*not* the original depositor).
   *
   *The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *super-identity.
   *
   *NOTE: This should not normally be used, but is provided in the case that the non-
   *controller of an account is maliciously registered as a sub-account.
   */
  quit_sub: undefined;
  /**
   *Add an `AccountId` with permission to grant usernames with a given `suffix` appended.
   *
   *The authority can grant up to `allocation` usernames. To top up their allocation, they
   *should just issue (or request via governance) a new `add_username_authority` call.
   */
  add_username_authority: Anonymize<I3alo542n0mgp>;
  /**
   *Remove `authority` from the username authorities.
   */
  remove_username_authority: Anonymize<I2rg5btjrsqec0>;
  /**
   *Set the username for `who`. Must be called by a username authority.
   *
   *The authority must have an `allocation`. Users can either pre-sign their usernames or
   *accept them later.
   *
   *Usernames must:
   *  - Only contain lowercase ASCII characters or digits.
   *  - When combined with the suffix of the issuing authority be _less than_ the
   *    `MaxUsernameLength`.
   */
  set_username_for: Anonymize<I21r37il499a97>;
  /**
   *Accept a given username that an `authority` granted. The call must include the full
   *username, as in `username.suffix`.
   */
  accept_username: Anonymize<Ie5l999tf7t2te>;
  /**
   *Remove an expired username approval. The username was approved by an authority but never
   *accepted by the user and must now be beyond its expiration. The call must include the
   *full username, as in `username.suffix`.
   */
  remove_expired_approval: Anonymize<Ie5l999tf7t2te>;
  /**
   *Set a given username as the primary. The username should include the suffix.
   */
  set_primary_username: Anonymize<Ie5l999tf7t2te>;
  /**
   *Remove a username that corresponds to an account with no identity. Exists when a user
   *gets a username but then calls `clear_identity`.
   */
  remove_dangling_username: Anonymize<Ie5l999tf7t2te>;
}>;
export type I2kds5jji7slh8 = {
  info: Anonymize<I1o57snqt6f4v5>;
};
export type Ia9mkdf6l44shb = {
  subs: Anonymize<I2ugvgusn08dsq>;
};
export type I2ugvgusn08dsq = Array<Anonymize<I910puuahutflf>>;
export type I9l2s4klu0831o = {
  reg_index: number;
  max_fee: bigint;
};
export type I2ctrt5nqb8o7c = {
  reg_index: number;
};
export type I711qahikocb1c = {
  index: number;
  fee: bigint;
};
export type I93c18nim2s66c = {
  index: number;
  new: SS58String;
};
export type Id6gojh30v9ib2 = {
  index: number;
  fields: bigint;
};
export type Ica5n28rlj0lk6 = {
  reg_index: number;
  target: SS58String;
  judgement: Anonymize<IdentityJudgement>;
  identity: FixedSizeBinary<32>;
};
export type I14p0q0qs0fqbj = {
  target: SS58String;
};
export type Ie3u4phm019a8l = {
  sub: SS58String;
  data: Anonymize<IdentityData>;
};
export type I9jie72r7q6717 = {
  sub: SS58String;
};
export type I3alo542n0mgp = {
  authority: SS58String;
  suffix: Binary;
  allocation: number;
};
export type I21r37il499a97 = {
  who: SS58String;
  username: Binary;
  signature?: Anonymize<I86cdjmsf3a81s>;
};
export type I86cdjmsf3a81s = MultiSignature | undefined;
export type Ie5l999tf7t2te = {
  username: Binary;
};
export type I6u9fdc1fne8nd = AnonymousEnum<{
  /**
   *Propose a sensitive action to be taken.
   *
   *The dispatch origin of this call must be _Signed_ and the sender must
   *have funds to cover the deposit.
   *
   *- `proposal_hash`: The hash of the proposal preimage.
   *- `value`: The amount of deposit (must be at least `MinimumDeposit`).
   *
   *Emits `Proposed`.
   */
  propose: Anonymize<I1moso5oagpiea>;
  /**
   *Signals agreement with a particular proposal.
   *
   *The dispatch origin of this call must be _Signed_ and the sender
   *must have funds to cover the deposit, equal to the original deposit.
   *
   *- `proposal`: The index of the proposal to second.
   */
  second: Anonymize<Ibeb4n9vpjefp3>;
  /**
   *Vote in a referendum. If `vote.is_aye()`, the vote is to enact the proposal;
   *otherwise it is a vote to keep the status quo.
   *
   *The dispatch origin of this call must be _Signed_.
   *
   *- `ref_index`: The index of the referendum to vote for.
   *- `vote`: The vote configuration.
   */
  vote: Anonymize<Id7murq9s9fg6h>;
  /**
   *Schedule an emergency cancellation of a referendum. Cannot happen twice to the same
   *referendum.
   *
   *The dispatch origin of this call must be `CancellationOrigin`.
   *
   *-`ref_index`: The index of the referendum to cancel.
   *
   *Weight: `O(1)`.
   */
  emergency_cancel: Anonymize<Ied9mja4bq7va8>;
  /**
   *Schedule a referendum to be tabled once it is legal to schedule an external
   *referendum.
   *
   *The dispatch origin of this call must be `ExternalOrigin`.
   *
   *- `proposal_hash`: The preimage hash of the proposal.
   */
  external_propose: Anonymize<I4f7jul8ljs54r>;
  /**
   *Schedule a majority-carries referendum to be tabled next once it is legal to schedule
   *an external referendum.
   *
   *The dispatch of this call must be `ExternalMajorityOrigin`.
   *
   *- `proposal_hash`: The preimage hash of the proposal.
   *
   *Unlike `external_propose`, blacklisting has no effect on this and it may replace a
   *pre-scheduled `external_propose` call.
   *
   *Weight: `O(1)`
   */
  external_propose_majority: Anonymize<I4f7jul8ljs54r>;
  /**
   *Schedule a negative-turnout-bias referendum to be tabled next once it is legal to
   *schedule an external referendum.
   *
   *The dispatch of this call must be `ExternalDefaultOrigin`.
   *
   *- `proposal_hash`: The preimage hash of the proposal.
   *
   *Unlike `external_propose`, blacklisting has no effect on this and it may replace a
   *pre-scheduled `external_propose` call.
   *
   *Weight: `O(1)`
   */
  external_propose_default: Anonymize<I4f7jul8ljs54r>;
  /**
   *Schedule the currently externally-proposed majority-carries referendum to be tabled
   *immediately. If there is no externally-proposed referendum currently, or if there is one
   *but it is not a majority-carries referendum then it fails.
   *
   *The dispatch of this call must be `FastTrackOrigin`.
   *
   *- `proposal_hash`: The hash of the current external proposal.
   *- `voting_period`: The period that is allowed for voting on this proposal. Increased to
   *	Must be always greater than zero.
   *	For `FastTrackOrigin` must be equal or greater than `FastTrackVotingPeriod`.
   *- `delay`: The number of block after voting has ended in approval and this should be
   *  enacted. This doesn't have a minimum amount.
   *
   *Emits `Started`.
   *
   *Weight: `O(1)`
   */
  fast_track: Anonymize<I5agg650597e49>;
  /**
   *Veto and blacklist the external proposal hash.
   *
   *The dispatch origin of this call must be `VetoOrigin`.
   *
   *- `proposal_hash`: The preimage hash of the proposal to veto and blacklist.
   *
   *Emits `Vetoed`.
   *
   *Weight: `O(V + log(V))` where V is number of `existing vetoers`
   */
  veto_external: Anonymize<I2ev73t79f46tb>;
  /**
   *Remove a referendum.
   *
   *The dispatch origin of this call must be _Root_.
   *
   *- `ref_index`: The index of the referendum to cancel.
   *
   *# Weight: `O(1)`.
   */
  cancel_referendum: Anonymize<Ied9mja4bq7va8>;
  /**
   *Delegate the voting power (with some given conviction) of the sending account.
   *
   *The balance delegated is locked for as long as it's delegated, and thereafter for the
   *time appropriate for the conviction's lock period.
   *
   *The dispatch origin of this call must be _Signed_, and the signing account must either:
   *  - be delegating already; or
   *  - have no voting activity (if there is, then it will need to be removed/consolidated
   *    through `reap_vote` or `unvote`).
   *
   *- `to`: The account whose voting the `target` account's voting power will follow.
   *- `conviction`: The conviction that will be attached to the delegated votes. When the
   *  account is undelegated, the funds will be locked for the corresponding period.
   *- `balance`: The amount of the account's balance to be used in delegating. This must not
   *  be more than the account's current balance.
   *
   *Emits `Delegated`.
   *
   *Weight: `O(R)` where R is the number of referendums the voter delegating to has
   *  voted on. Weight is charged as if maximum votes.
   */
  delegate: Anonymize<Iab64mce6q91i>;
  /**
   *Undelegate the voting power of the sending account.
   *
   *Tokens may be unlocked following once an amount of time consistent with the lock period
   *of the conviction with which the delegation was issued.
   *
   *The dispatch origin of this call must be _Signed_ and the signing account must be
   *currently delegating.
   *
   *Emits `Undelegated`.
   *
   *Weight: `O(R)` where R is the number of referendums the voter delegating to has
   *  voted on. Weight is charged as if maximum votes.
   */
  undelegate: undefined;
  /**
   *Clears all public proposals.
   *
   *The dispatch origin of this call must be _Root_.
   *
   *Weight: `O(1)`.
   */
  clear_public_proposals: undefined;
  /**
   *Unlock tokens that have an expired lock.
   *
   *The dispatch origin of this call must be _Signed_.
   *
   *- `target`: The account to remove the lock on.
   *
   *Weight: `O(R)` with R number of vote of target.
   */
  unlock: Anonymize<I14p0q0qs0fqbj>;
  /**
   *Remove a vote for a referendum.
   *
   *If:
   *- the referendum was cancelled, or
   *- the referendum is ongoing, or
   *- the referendum has ended such that
   *  - the vote of the account was in opposition to the result; or
   *  - there was no conviction to the account's vote; or
   *  - the account made a split vote
   *...then the vote is removed cleanly and a following call to `unlock` may result in more
   *funds being available.
   *
   *If, however, the referendum has ended and:
   *- it finished corresponding to the vote of the account, and
   *- the account made a standard vote with conviction, and
   *- the lock period of the conviction is not over
   *...then the lock will be aggregated into the overall account's lock, which may involve
   **overlocking* (where the two locks are combined into a single lock that is the maximum
   *of both the amount locked and the time is it locked for).
   *
   *The dispatch origin of this call must be _Signed_, and the signer must have a vote
   *registered for referendum `index`.
   *
   *- `index`: The index of referendum of the vote to be removed.
   *
   *Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
   *  Weight is calculated for the maximum number of vote.
   */
  remove_vote: Anonymize<I666bl2fqjkejo>;
  /**
   *Remove a vote for a referendum.
   *
   *If the `target` is equal to the signer, then this function is exactly equivalent to
   *`remove_vote`. If not equal to the signer, then the vote must have expired,
   *either because the referendum was cancelled, because the voter lost the referendum or
   *because the conviction period is over.
   *
   *The dispatch origin of this call must be _Signed_.
   *
   *- `target`: The account of the vote to be removed; this account must have voted for
   *  referendum `index`.
   *- `index`: The index of referendum of the vote to be removed.
   *
   *Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
   *  Weight is calculated for the maximum number of vote.
   */
  remove_other_vote: Anonymize<I7ji3jng252el9>;
  /**
   *Permanently place a proposal into the blacklist. This prevents it from ever being
   *proposed again.
   *
   *If called on a queued public or external proposal, then this will result in it being
   *removed. If the `ref_index` supplied is an active referendum with the proposal hash,
   *then it will be cancelled.
   *
   *The dispatch origin of this call must be `BlacklistOrigin`.
   *
   *- `proposal_hash`: The proposal hash to blacklist permanently.
   *- `ref_index`: An ongoing referendum whose hash is `proposal_hash`, which will be
   *cancelled.
   *
   *Weight: `O(p)` (though as this is an high-privilege dispatch, we assume it has a
   *  reasonable value).
   */
  blacklist: Anonymize<I3v9h9f3mpm1l8>;
  /**
   *Remove a proposal.
   *
   *The dispatch origin of this call must be `CancelProposalOrigin`.
   *
   *- `prop_index`: The index of the proposal to cancel.
   *
   *Weight: `O(p)` where `p = PublicProps::<T>::decode_len()`
   */
  cancel_proposal: Anonymize<I9mnj4k4u8ls2c>;
  /**
   *Set or clear a metadata of a proposal or a referendum.
   *
   *Parameters:
   *- `origin`: Must correspond to the `MetadataOwner`.
   *    - `ExternalOrigin` for an external proposal with the `SuperMajorityApprove`
   *      threshold.
   *    - `ExternalDefaultOrigin` for an external proposal with the `SuperMajorityAgainst`
   *      threshold.
   *    - `ExternalMajorityOrigin` for an external proposal with the `SimpleMajority`
   *      threshold.
   *    - `Signed` by a creator for a public proposal.
   *    - `Signed` to clear a metadata for a finished referendum.
   *    - `Root` to set a metadata for an ongoing referendum.
   *- `owner`: an identifier of a metadata owner.
   *- `maybe_hash`: The hash of an on-chain stored preimage. `None` to clear a metadata.
   */
  set_metadata: Anonymize<I2kt2u1flctk2q>;
  /**
   *Allow to force remove a vote for a referendum.
   *
   *Same as `remove_other_vote`, except the scope is overriden by forced flag.
   *The dispatch origin of this call must be `VoteRemovalOrigin`.
   *
   *Only allowed if the referendum is finished.
   *
   *The dispatch origin of this call must be _Signed_.
   *
   *- `target`: The account of the vote to be removed; this account must have voted for
   *  referendum `index`.
   *- `index`: The index of referendum of the vote to be removed.
   *
   *Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
   *  Weight is calculated for the maximum number of vote.
   */
  force_remove_vote: Anonymize<I7ji3jng252el9>;
}>;
export type I1moso5oagpiea = {
  proposal: PreimagesBounded;
  value: bigint;
};
export type Ibeb4n9vpjefp3 = {
  proposal: number;
};
export type Id7murq9s9fg6h = {
  ref_index: number;
  vote: Anonymize<Ia9hdots6g53fs>;
};
export type I4f7jul8ljs54r = {
  proposal: PreimagesBounded;
};
export type I5agg650597e49 = {
  proposal_hash: FixedSizeBinary<32>;
  voting_period: number;
  delay: number;
};
export type Iab64mce6q91i = {
  to: SS58String;
  conviction: VotingConviction;
  balance: bigint;
};
export type I7ji3jng252el9 = {
  target: SS58String;
  index: number;
};
export type I3v9h9f3mpm1l8 = {
  proposal_hash: FixedSizeBinary<32>;
  maybe_ref_index?: Anonymize<I4arjljr6dpflb>;
};
export type I2kt2u1flctk2q = {
  owner: Anonymize<I2itl2k1j2q8nf>;
  maybe_hash?: Anonymize<I4s6vifaf8k998>;
};
export type Ifj3hlfbcdobl3 = AnonymousEnum<{
  /**
   *Vote for a set of candidates for the upcoming round of election. This can be called to
   *set the initial votes, or update already existing votes.
   *
   *Upon initial voting, `value` units of `who`'s balance is locked and a deposit amount is
   *reserved. The deposit is based on the number of votes and can be updated over time.
   *
   *The `votes` should:
   *  - not be empty.
   *  - be less than the number of possible candidates. Note that all current members and
   *    runners-up are also automatically candidates for the next round.
   *
   *If `value` is more than `who`'s free balance, then the maximum of the two is used.
   *
   *The dispatch origin of this call must be signed.
   *
   *### Warning
   *
   *It is the responsibility of the caller to **NOT** place all of their balance into the
   *lock and keep some for further operations.
   */
  vote: Anonymize<Iaa13icjlsj13d>;
  /**
   *Remove `origin` as a voter.
   *
   *This removes the lock and returns the deposit.
   *
   *The dispatch origin of this call must be signed and be a voter.
   */
  remove_voter: undefined;
  /**
   *Submit oneself for candidacy. A fixed amount of deposit is recorded.
   *
   *All candidates are wiped at the end of the term. They either become a member/runner-up,
   *or leave the system while their deposit is slashed.
   *
   *The dispatch origin of this call must be signed.
   *
   *### Warning
   *
   *Even if a candidate ends up being a member, they must call [`Call::renounce_candidacy`]
   *to get their deposit back. Losing the spot in an election will always lead to a slash.
   *
   *The number of current candidates must be provided as witness data.
   *## Complexity
   *O(C + log(C)) where C is candidate_count.
   */
  submit_candidacy: Anonymize<I98vh5ccjtf1ev>;
  /**
   *Renounce one's intention to be a candidate for the next election round. 3 potential
   *outcomes exist:
   *
   *- `origin` is a candidate and not elected in any set. In this case, the deposit is
   *  unreserved, returned and origin is removed as a candidate.
   *- `origin` is a current runner-up. In this case, the deposit is unreserved, returned and
   *  origin is removed as a runner-up.
   *- `origin` is a current member. In this case, the deposit is unreserved and origin is
   *  removed as a member, consequently not being a candidate for the next round anymore.
   *  Similar to [`remove_member`](Self::remove_member), if replacement runners exists, they
   *  are immediately used. If the prime is renouncing, then no prime will exist until the
   *  next round.
   *
   *The dispatch origin of this call must be signed, and have one of the above roles.
   *The type of renouncing must be provided as witness data.
   *
   *## Complexity
   *  - Renouncing::Candidate(count): O(count + log(count))
   *  - Renouncing::Member: O(1)
   *  - Renouncing::RunnerUp: O(1)
   */
  renounce_candidacy: Anonymize<I3al0eab2u0gt2>;
  /**
   *Remove a particular member from the set. This is effective immediately and the bond of
   *the outgoing member is slashed.
   *
   *If a runner-up is available, then the best runner-up will be removed and replaces the
   *outgoing member. Otherwise, if `rerun_election` is `true`, a new phragmen election is
   *started, else, nothing happens.
   *
   *If `slash_bond` is set to true, the bond of the member being removed is slashed. Else,
   *it is returned.
   *
   *The dispatch origin of this call must be root.
   *
   *Note that this does not affect the designated block number of the next election.
   *
   *## Complexity
   *- Check details of remove_and_replace_member() and do_phragmen().
   */
  remove_member: Anonymize<I7hhej9ji2h5gt>;
  /**
   *Clean all voters who are defunct (i.e. they do not serve any purpose at all). The
   *deposit of the removed voters are returned.
   *
   *This is an root function to be used only for cleaning the state.
   *
   *The dispatch origin of this call must be root.
   *
   *## Complexity
   *- Check is_defunct_voter() details.
   */
  clean_defunct_voters: Anonymize<I6fuug4i4r04hi>;
}>;
export type Iaa13icjlsj13d = {
  votes: Anonymize<Ia2lhg7l2hilo3>;
  value: bigint;
};
export type I98vh5ccjtf1ev = {
  candidate_count: number;
};
export type I3al0eab2u0gt2 = {
  renouncing: Anonymize<I7jm8hdmluu21u>;
};
export type I7jm8hdmluu21u = AnonymousEnum<{
  Member: undefined;
  RunnerUp: undefined;
  Candidate: number;
}>;
export type I7hhej9ji2h5gt = {
  who: SS58String;
  slash_bond: boolean;
  rerun_election: boolean;
};
export type I6fuug4i4r04hi = {
  num_voters: number;
  num_defunct: number;
};
export type Icbun7a2ilh0ie = AnonymousEnum<{
  /**
   *Set the collective's membership.
   *
   *- `new_members`: The new member list. Be nice to the chain and provide it sorted.
   *- `prime`: The prime member whose vote sets the default.
   *- `old_count`: The upper bound for the previous number of members in storage. Used for
   *  weight estimation.
   *
   *The dispatch of this call must be `SetMembersOrigin`.
   *
   *NOTE: Does not enforce the expected `MaxMembers` limit on the amount of members, but
   *      the weight estimations rely on it to estimate dispatchable weight.
   *
   *# WARNING:
   *
   *The `pallet-collective` can also be managed by logic outside of the pallet through the
   *implementation of the trait [`ChangeMembers`].
   *Any call to `set_members` must be careful that the member set doesn't get out of sync
   *with other logic managing the member set.
   *
   *## Complexity:
   *- `O(MP + N)` where:
   *  - `M` old-members-count (code- and governance-bounded)
   *  - `N` new-members-count (code- and governance-bounded)
   *  - `P` proposals-count (code-bounded)
   */
  set_members: Anonymize<I38jfk5li8iang>;
  /**
   *Dispatch a proposal from a member using the `Member` origin.
   *
   *Origin must be a member of the collective.
   *
   *## Complexity:
   *- `O(B + M + P)` where:
   *- `B` is `proposal` size in bytes (length-fee-bounded)
   *- `M` members-count (code-bounded)
   *- `P` complexity of dispatching `proposal`
   */
  execute: Anonymize<If6o6gqb6cajtb>;
  /**
   *Add a new proposal to either be voted on or executed directly.
   *
   *Requires the sender to be member.
   *
   *`threshold` determines whether `proposal` is executed directly (`threshold < 2`)
   *or put up for voting.
   *
   *## Complexity
   *- `O(B + M + P1)` or `O(B + M + P2)` where:
   *  - `B` is `proposal` size in bytes (length-fee-bounded)
   *  - `M` is members-count (code- and governance-bounded)
   *  - branching is influenced by `threshold` where:
   *    - `P1` is proposal execution complexity (`threshold < 2`)
   *    - `P2` is proposals-count (code-bounded) (`threshold >= 2`)
   */
  propose: Anonymize<Iehb3squnhooig>;
  /**
   *Add an aye or nay vote for the sender to the given proposal.
   *
   *Requires the sender to be a member.
   *
   *Transaction fees will be waived if the member is voting on any particular proposal
   *for the first time and the call is successful. Subsequent vote changes will charge a
   *fee.
   *## Complexity
   *- `O(M)` where `M` is members-count (code- and governance-bounded)
   */
  vote: Anonymize<I2dtrijkm5601t>;
  /**
   *Disapprove a proposal, close, and remove it from the system, regardless of its current
   *state.
   *
   *Must be called by the Root origin.
   *
   *Parameters:
   ** `proposal_hash`: The hash of the proposal that should be disapproved.
   *
   *## Complexity
   *O(P) where P is the number of max proposals
   */
  disapprove_proposal: Anonymize<I2ev73t79f46tb>;
  /**
   *Close a vote that is either approved, disapproved or whose voting period has ended.
   *
   *May be called by any signed account in order to finish voting and close the proposal.
   *
   *If called before the end of the voting period it will only close the vote if it is
   *has enough votes to be approved or disapproved.
   *
   *If called after the end of the voting period abstentions are counted as rejections
   *unless there is a prime member set and the prime member cast an approval.
   *
   *If the close operation completes successfully with disapproval, the transaction fee will
   *be waived. Otherwise execution of the approved operation will be charged to the caller.
   *
   *+ `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed
   *proposal.
   *+ `length_bound`: The upper bound for the length of the proposal in storage. Checked via
   *`storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
   *
   *## Complexity
   *- `O(B + M + P1 + P2)` where:
   *  - `B` is `proposal` size in bytes (length-fee-bounded)
   *  - `M` is members-count (code- and governance-bounded)
   *  - `P1` is the complexity of `proposal` preimage.
   *  - `P2` is proposal-count (code-bounded)
   */
  close: Anonymize<Ib2obgji960euh>;
}>;
export type I38jfk5li8iang = {
  new_members: Anonymize<Ia2lhg7l2hilo3>;
  prime?: Anonymize<Ihfphjolmsqq1>;
  old_count: number;
};
export type If6o6gqb6cajtb = {
  proposal: TxCallData;
  length_bound: number;
};
export type Iehb3squnhooig = {
  threshold: number;
  proposal: TxCallData;
  length_bound: number;
};
export type I2dtrijkm5601t = {
  proposal: FixedSizeBinary<32>;
  index: number;
  approve: boolean;
};
export type Ib2obgji960euh = {
  proposal_hash: FixedSizeBinary<32>;
  index: number;
  proposal_weight_bound: Anonymize<I4q39t5hn830vp>;
  length_bound: number;
};
export type Ibcos58g5647s0 = AnonymousEnum<{
  /**
   *Report something `reason` that deserves a tip and claim any eventual the finder's fee.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Payment: `TipReportDepositBase` will be reserved from the origin account, as well as
   *`DataDepositPerByte` for each byte in `reason`.
   *
   *- `reason`: The reason for, or the thing that deserves, the tip; generally this will be
   *  a UTF-8-encoded URL.
   *- `who`: The account which should be credited for the tip.
   *
   *Emits `NewTip` if successful.
   *
   *## Complexity
   *- `O(R)` where `R` length of `reason`.
   *  - encoding and hashing of 'reason'
   */
  report_awesome: Anonymize<Ie6dn4p5chsk1u>;
  /**
   *Retract a prior tip-report from `report_awesome`, and cancel the process of tipping.
   *
   *If successful, the original deposit will be unreserved.
   *
   *The dispatch origin for this call must be _Signed_ and the tip identified by `hash`
   *must have been reported by the signing account through `report_awesome` (and not
   *through `tip_new`).
   *
   *- `hash`: The identity of the open tip for which a tip value is declared. This is formed
   *  as the hash of the tuple of the original tip `reason` and the beneficiary account ID.
   *
   *Emits `TipRetracted` if successful.
   *
   *## Complexity
   *- `O(1)`
   *  - Depends on the length of `T::Hash` which is fixed.
   */
  retract_tip: Anonymize<I1jm8m1rh9e20v>;
  /**
   *Give a tip for something new; no finder's fee will be taken.
   *
   *The dispatch origin for this call must be _Signed_ and the signing account must be a
   *member of the `Tippers` set.
   *
   *- `reason`: The reason for, or the thing that deserves, the tip; generally this will be
   *  a UTF-8-encoded URL.
   *- `who`: The account which should be credited for the tip.
   *- `tip_value`: The amount of tip that the sender would like to give. The median tip
   *  value of active tippers will be given to the `who`.
   *
   *Emits `NewTip` if successful.
   *
   *## Complexity
   *- `O(R + T)` where `R` length of `reason`, `T` is the number of tippers.
   *  - `O(T)`: decoding `Tipper` vec of length `T`. `T` is charged as upper bound given by
   *    `ContainsLengthBound`. The actual cost depends on the implementation of
   *    `T::Tippers`.
   *  - `O(R)`: hashing and encoding of reason of length `R`
   */
  tip_new: Anonymize<I2vi5dr4528rgv>;
  /**
   *Declare a tip value for an already-open tip.
   *
   *The dispatch origin for this call must be _Signed_ and the signing account must be a
   *member of the `Tippers` set.
   *
   *- `hash`: The identity of the open tip for which a tip value is declared. This is formed
   *  as the hash of the tuple of the hash of the original tip `reason` and the beneficiary
   *  account ID.
   *- `tip_value`: The amount of tip that the sender would like to give. The median tip
   *  value of active tippers will be given to the `who`.
   *
   *Emits `TipClosing` if the threshold of tippers has been reached and the countdown period
   *has started.
   *
   *## Complexity
   *- `O(T)` where `T` is the number of tippers. decoding `Tipper` vec of length `T`, insert
   *  tip and check closing, `T` is charged as upper bound given by `ContainsLengthBound`.
   *  The actual cost depends on the implementation of `T::Tippers`.
   *
   *  Actually weight could be lower as it depends on how many tips are in `OpenTip` but it
   *  is weighted as if almost full i.e of length `T-1`.
   */
  tip: Anonymize<I1pm30k3i4438u>;
  /**
   *Close and payout a tip.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *The tip identified by `hash` must have finished its countdown period.
   *
   *- `hash`: The identity of the open tip for which a tip value is declared. This is formed
   *  as the hash of the tuple of the original tip `reason` and the beneficiary account ID.
   *
   *## Complexity
   *- : `O(T)` where `T` is the number of tippers. decoding `Tipper` vec of length `T`. `T`
   *  is charged as upper bound given by `ContainsLengthBound`. The actual cost depends on
   *  the implementation of `T::Tippers`.
   */
  close_tip: Anonymize<I1jm8m1rh9e20v>;
  /**
   *Remove and slash an already-open tip.
   *
   *May only be called from `T::RejectOrigin`.
   *
   *As a result, the finder is slashed and the deposits are lost.
   *
   *Emits `TipSlashed` if successful.
   *
   *## Complexity
   *- O(1).
   */
  slash_tip: Anonymize<I1jm8m1rh9e20v>;
}>;
export type Ie6dn4p5chsk1u = {
  reason: Binary;
  who: SS58String;
};
export type I2vi5dr4528rgv = {
  reason: Binary;
  who: SS58String;
  tip_value: bigint;
};
export type I1pm30k3i4438u = {
  hash: FixedSizeBinary<32>;
  tip_value: bigint;
};
export type Ice7b5qchdur34 = AnonymousEnum<{
  /**
   *Dispatch the given `call` from an account that the sender is authorised for through
   *`add_proxy`.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `real`: The account that the proxy will make a call on behalf of.
   *- `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
   *- `call`: The call to be made by the `real` account.
   */
  proxy: Anonymize<Igd9530gfdrn3>;
  /**
   *Register a proxy account for the sender that is able to make calls on its behalf.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `proxy`: The account that the `caller` would like to make a proxy.
   *- `proxy_type`: The permissions allowed for this proxy account.
   *- `delay`: The announcement period required of the initial proxy. Will generally be
   *zero.
   */
  add_proxy: Anonymize<I2e1ekg17a2uj2>;
  /**
   *Unregister a proxy account for the sender.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `proxy`: The account that the `caller` would like to remove as a proxy.
   *- `proxy_type`: The permissions currently enabled for the removed proxy account.
   */
  remove_proxy: Anonymize<I2e1ekg17a2uj2>;
  /**
   *Unregister all proxy accounts for the sender.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *WARNING: This may be called on accounts created by `pure`, however if done, then
   *the unreserved fees will be inaccessible. **All access to this account will be lost.**
   */
  remove_proxies: undefined;
  /**
   *Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
   *initialize it with a proxy of `proxy_type` for `origin` sender.
   *
   *Requires a `Signed` origin.
   *
   *- `proxy_type`: The type of the proxy that the sender will be registered as over the
   *new account. This will almost always be the most permissive `ProxyType` possible to
   *allow for maximum flexibility.
   *- `index`: A disambiguation index, in case this is called multiple times in the same
   *transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
   *want to use `0`.
   *- `delay`: The announcement period required of the initial proxy. Will generally be
   *zero.
   *
   *Fails with `Duplicate` if this has already been called in this transaction, from the
   *same sender, with the same parameters.
   *
   *Fails if there are insufficient funds to pay for deposit.
   */
  create_pure: Anonymize<I9uff8o8g5b5av>;
  /**
   *Removes a previously spawned pure proxy.
   *
   *WARNING: **All access to this account will be lost.** Any funds held in it will be
   *inaccessible.
   *
   *Requires a `Signed` origin, and the sender account must have been created by a call to
   *`pure` with corresponding parameters.
   *
   *- `spawner`: The account that originally called `pure` to create this account.
   *- `index`: The disambiguation index originally passed to `pure`. Probably `0`.
   *- `proxy_type`: The proxy type originally passed to `pure`.
   *- `height`: The height of the chain when the call to `pure` was processed.
   *- `ext_index`: The extrinsic index in which the call to `pure` was processed.
   *
   *Fails with `NoPermission` in case the caller is not a previously created pure
   *account whose `pure` call has corresponding parameters.
   */
  kill_pure: Anonymize<I1acluqiqlacck>;
  /**
   *Publish the hash of a proxy-call that will be made in the future.
   *
   *This must be called some number of blocks before the corresponding `proxy` is attempted
   *if the delay associated with the proxy relationship is greater than zero.
   *
   *No more than `MaxPending` announcements may be made at any one time.
   *
   *This will take a deposit of `AnnouncementDepositFactor` as well as
   *`AnnouncementDepositBase` if there are no other pending announcements.
   *
   *The dispatch origin for this call must be _Signed_ and a proxy of `real`.
   *
   *Parameters:
   *- `real`: The account that the proxy will make a call on behalf of.
   *- `call_hash`: The hash of the call to be made by the `real` account.
   */
  announce: Anonymize<Idkqesere66fs7>;
  /**
   *Remove a given announcement.
   *
   *May be called by a proxy account to remove a call they previously announced and return
   *the deposit.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `real`: The account that the proxy will make a call on behalf of.
   *- `call_hash`: The hash of the call to be made by the `real` account.
   */
  remove_announcement: Anonymize<Idkqesere66fs7>;
  /**
   *Remove the given announcement of a delegate.
   *
   *May be called by a target (proxied) account to remove a call that one of their delegates
   *(`delegate`) has announced they want to execute. The deposit is returned.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `delegate`: The account that previously announced the call.
   *- `call_hash`: The hash of the call to be made.
   */
  reject_announcement: Anonymize<Ifs54vj2idl9k4>;
  /**
   *Dispatch the given `call` from an account that the sender is authorized for through
   *`add_proxy`.
   *
   *Removes any corresponding announcement(s).
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *Parameters:
   *- `real`: The account that the proxy will make a call on behalf of.
   *- `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
   *- `call`: The call to be made by the `real` account.
   */
  proxy_announced: Anonymize<Id0r8q2e0it0cs>;
}>;
export type Igd9530gfdrn3 = {
  real: SS58String;
  force_proxy_type?: Anonymize<Idnl0r1a4nmeek>;
  call: TxCallData;
};
export type Idnl0r1a4nmeek = Anonymize<Ie9g2psuhuu510> | undefined;
export type I2e1ekg17a2uj2 = {
  delegate: SS58String;
  proxy_type: Anonymize<Ie9g2psuhuu510>;
  delay: number;
};
export type I9uff8o8g5b5av = {
  proxy_type: Anonymize<Ie9g2psuhuu510>;
  delay: number;
  index: number;
};
export type I1acluqiqlacck = {
  spawner: SS58String;
  proxy_type: Anonymize<Ie9g2psuhuu510>;
  index: number;
  height: number;
  ext_index: number;
};
export type Idkqesere66fs7 = {
  real: SS58String;
  call_hash: FixedSizeBinary<32>;
};
export type Ifs54vj2idl9k4 = {
  delegate: SS58String;
  call_hash: FixedSizeBinary<32>;
};
export type Id0r8q2e0it0cs = {
  delegate: SS58String;
  real: SS58String;
  force_proxy_type?: Anonymize<Idnl0r1a4nmeek>;
  call: TxCallData;
};
export type I24s5pro59pp48 = AnonymousEnum<{
  /**
   *Immediately dispatch a multi-signature call using a single approval from the caller.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `other_signatories`: The accounts (other than the sender) who are part of the
   *multi-signature, but do not participate in the approval process.
   *- `call`: The call to be executed.
   *
   *Result is equivalent to the dispatched result.
   *
   *## Complexity
   *O(Z + C) where Z is the length of the call and C its execution weight.
   */
  as_multi_threshold_1: Anonymize<I8545phbh5off1>;
  /**
   *Register approval for a dispatch to be made from a deterministic composite account if
   *approved by a total of `threshold - 1` of `other_signatories`.
   *
   *If there are enough, then dispatch the call.
   *
   *Payment: `DepositBase` will be reserved if this is the first approval, plus
   *`threshold` times `DepositFactor`. It is returned once this dispatch happens or
   *is cancelled.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `threshold`: The total number of approvals for this dispatch before it is executed.
   *- `other_signatories`: The accounts (other than the sender) who can approve this
   *dispatch. May not be empty.
   *- `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
   *not the first approval, then it must be `Some`, with the timepoint (block number and
   *transaction index) of the first approval transaction.
   *- `call`: The call to be executed.
   *
   *NOTE: Unless this is the final approval, you will generally want to use
   *`approve_as_multi` instead, since it only requires a hash of the call.
   *
   *Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
   *on success, result is `Ok` and the result from the interior call, if it was executed,
   *may be found in the deposited `MultisigExecuted` event.
   *
   *## Complexity
   *- `O(S + Z + Call)`.
   *- Up to one balance-reserve or unreserve operation.
   *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
   *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
   *- One call encode & hash, both of complexity `O(Z)` where `Z` is tx-len.
   *- One encode & hash, both of complexity `O(S)`.
   *- Up to one binary search and insert (`O(logS + S)`).
   *- I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
   *- One event.
   *- The weight of the `call`.
   *- Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
   *  taken for its lifetime of `DepositBase + threshold * DepositFactor`.
   */
  as_multi: Anonymize<I5dr8mcko4nff>;
  /**
   *Register approval for a dispatch to be made from a deterministic composite account if
   *approved by a total of `threshold - 1` of `other_signatories`.
   *
   *Payment: `DepositBase` will be reserved if this is the first approval, plus
   *`threshold` times `DepositFactor`. It is returned once this dispatch happens or
   *is cancelled.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `threshold`: The total number of approvals for this dispatch before it is executed.
   *- `other_signatories`: The accounts (other than the sender) who can approve this
   *dispatch. May not be empty.
   *- `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
   *not the first approval, then it must be `Some`, with the timepoint (block number and
   *transaction index) of the first approval transaction.
   *- `call_hash`: The hash of the call to be executed.
   *
   *NOTE: If this is the final approval, you will want to use `as_multi` instead.
   *
   *## Complexity
   *- `O(S)`.
   *- Up to one balance-reserve or unreserve operation.
   *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
   *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
   *- One encode & hash, both of complexity `O(S)`.
   *- Up to one binary search and insert (`O(logS + S)`).
   *- I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
   *- One event.
   *- Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
   *  taken for its lifetime of `DepositBase + threshold * DepositFactor`.
   */
  approve_as_multi: Anonymize<Ideaemvoneh309>;
  /**
   *Cancel a pre-existing, on-going multisig transaction. Any deposit reserved previously
   *for this operation will be unreserved on success.
   *
   *The dispatch origin for this call must be _Signed_.
   *
   *- `threshold`: The total number of approvals for this dispatch before it is executed.
   *- `other_signatories`: The accounts (other than the sender) who can approve this
   *dispatch. May not be empty.
   *- `timepoint`: The timepoint (block number and transaction index) of the first approval
   *transaction for this dispatch.
   *- `call_hash`: The hash of the call to be executed.
   *
   *## Complexity
   *- `O(S)`.
   *- Up to one balance-reserve or unreserve operation.
   *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
   *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
   *- One encode & hash, both of complexity `O(S)`.
   *- One event.
   *- I/O: 1 read `O(S)`, one remove.
   *- Storage: removes one item.
   */
  cancel_as_multi: Anonymize<I3d9o9d7epp66v>;
}>;
export type I8545phbh5off1 = {
  other_signatories: Anonymize<Ia2lhg7l2hilo3>;
  call: TxCallData;
};
export type I5dr8mcko4nff = {
  threshold: number;
  other_signatories: Anonymize<Ia2lhg7l2hilo3>;
  maybe_timepoint?: Anonymize<I95jfd8j5cr5eh>;
  call: TxCallData;
  max_weight: Anonymize<I4q39t5hn830vp>;
};
export type I1aih3rf2i8nc0 = AnonymousEnum<{
  /**
   *Issue a new collection of non-fungible items from a public origin.
   *
   *This new collection has no items initially and its owner is the origin.
   *
   *The origin must conform to the configured `CreateOrigin` and have sufficient funds free.
   *
   *`ItemDeposit` funds of sender are reserved.
   *
   *Parameters:
   *- `collection`: The identifier of the new collection. This must not be currently in use.
   *- `admin`: The admin of this collection. The admin is the initial address of each
   *member of the collection's admin team.
   *
   *Emits `Created` event when successful.
   *
   *Weight: `O(1)`
   */
  create: Anonymize<I3rrsthr03bsf8>;
  /**
   *Issue a new collection of non-fungible items from a privileged origin.
   *
   *This new collection has no items initially.
   *
   *The origin must conform to `ForceOrigin`.
   *
   *Unlike `create`, no funds are reserved.
   *
   *- `collection`: The identifier of the new item. This must not be currently in use.
   *- `owner`: The owner of this collection of items. The owner has full superuser
   *  permissions
   *over this item, but may later change and configure the permissions using
   *`transfer_ownership` and `set_team`.
   *
   *Emits `ForceCreated` event when successful.
   *
   *Weight: `O(1)`
   */
  force_create: Anonymize<I1it6nfuocs3uo>;
  /**
   *Destroy a collection of fungible items.
   *
   *The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be the
   *owner of the `collection`.
   *
   *- `collection`: The identifier of the collection to be destroyed.
   *- `witness`: Information on the items minted in the collection. This must be
   *correct.
   *
   *Emits `Destroyed` event when successful.
   *
   *Weight: `O(n + m)` where:
   *- `n = witness.items`
   *- `m = witness.item_metadatas`
   *- `a = witness.attributes`
   */
  destroy: Anonymize<I83qeclck631s2>;
  /**
   *Mint an item of a particular collection.
   *
   *The origin must be Signed and the sender must be the Issuer of the `collection`.
   *
   *- `collection`: The collection of the item to be minted.
   *- `item`: The item value of the item to be minted.
   *- `beneficiary`: The initial owner of the minted item.
   *
   *Emits `Issued` event when successful.
   *
   *Weight: `O(1)`
   */
  mint: Anonymize<I846j8gk91gp4q>;
  /**
   *Destroy a single item.
   *
   *Origin must be Signed and the signing account must be either:
   *- the Admin of the `collection`;
   *- the Owner of the `item`;
   *
   *- `collection`: The collection of the item to be burned.
   *- `item`: The item of the item to be burned.
   *- `check_owner`: If `Some` then the operation will fail with `WrongOwner` unless the
   *  item is owned by this value.
   *
   *Emits `Burned` with the actual amount burned.
   *
   *Weight: `O(1)`
   *Modes: `check_owner.is_some()`.
   */
  burn: Anonymize<I4apbr3d7b110l>;
  /**
   *Move an item from the sender account to another.
   *
   *This resets the approved account of the item.
   *
   *Origin must be Signed and the signing account must be either:
   *- the Admin of the `collection`;
   *- the Owner of the `item`;
   *- the approved delegate for the `item` (in this case, the approval is reset).
   *
   *Arguments:
   *- `collection`: The collection of the item to be transferred.
   *- `item`: The item of the item to be transferred.
   *- `dest`: The account to receive ownership of the item.
   *
   *Emits `Transferred`.
   *
   *Weight: `O(1)`
   */
  transfer: Anonymize<I9svbf1ionsuba>;
  /**
   *Reevaluate the deposits on some items.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection to be frozen.
   *- `items`: The items of the collection whose deposits will be reevaluated.
   *
   *NOTE: This exists as a best-effort function. Any items which are unknown or
   *in the case that the owner account does not have reservable funds to pay for a
   *deposit increase are ignored. Generally the owner isn't going to call this on items
   *whose existing deposit is less than the refreshed deposit as it would only cost them,
   *so it's of little consequence.
   *
   *It will still return an error in the case that the collection is unknown of the signer
   *is not permitted to call it.
   *
   *Weight: `O(items.len())`
   */
  redeposit: Anonymize<I63enm20toa64c>;
  /**
   *Disallow further unprivileged transfer of an item.
   *
   *Origin must be Signed and the sender should be the Freezer of the `collection`.
   *
   *- `collection`: The collection of the item to be frozen.
   *- `item`: The item of the item to be frozen.
   *
   *Emits `Frozen`.
   *
   *Weight: `O(1)`
   */
  freeze: Anonymize<I92ucef7ff2o7l>;
  /**
   *Re-allow unprivileged transfer of an item.
   *
   *Origin must be Signed and the sender should be the Freezer of the `collection`.
   *
   *- `collection`: The collection of the item to be thawed.
   *- `item`: The item of the item to be thawed.
   *
   *Emits `Thawed`.
   *
   *Weight: `O(1)`
   */
  thaw: Anonymize<I92ucef7ff2o7l>;
  /**
   *Disallow further unprivileged transfers for a whole collection.
   *
   *Origin must be Signed and the sender should be the Freezer of the `collection`.
   *
   *- `collection`: The collection to be frozen.
   *
   *Emits `CollectionFrozen`.
   *
   *Weight: `O(1)`
   */
  freeze_collection: Anonymize<I88sl1jplq27bh>;
  /**
   *Re-allow unprivileged transfers for a whole collection.
   *
   *Origin must be Signed and the sender should be the Admin of the `collection`.
   *
   *- `collection`: The collection to be thawed.
   *
   *Emits `CollectionThawed`.
   *
   *Weight: `O(1)`
   */
  thaw_collection: Anonymize<I88sl1jplq27bh>;
  /**
   *Change the Owner of a collection.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection whose owner should be changed.
   *- `owner`: The new Owner of this collection. They must have called
   *  `set_accept_ownership` with `collection` in order for this operation to succeed.
   *
   *Emits `OwnerChanged`.
   *
   *Weight: `O(1)`
   */
  transfer_ownership: Anonymize<I2970lus2v0qct>;
  /**
   *Change the Issuer, Admin and Freezer of a collection.
   *
   *Origin must be Signed and the sender should be the Owner of the `collection`.
   *
   *- `collection`: The collection whose team should be changed.
   *- `issuer`: The new Issuer of this collection.
   *- `admin`: The new Admin of this collection.
   *- `freezer`: The new Freezer of this collection.
   *
   *Emits `TeamChanged`.
   *
   *Weight: `O(1)`
   */
  set_team: Anonymize<I1vsbo63n9pu69>;
  /**
   *Approve an item to be transferred by a delegated third-party account.
   *
   *The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be
   *either the owner of the `item` or the admin of the collection.
   *
   *- `collection`: The collection of the item to be approved for delegated transfer.
   *- `item`: The item of the item to be approved for delegated transfer.
   *- `delegate`: The account to delegate permission to transfer the item.
   *
   *Important NOTE: The `approved` account gets reset after each transfer.
   *
   *Emits `ApprovedTransfer` on success.
   *
   *Weight: `O(1)`
   */
  approve_transfer: Anonymize<I3fatc2oi4mp63>;
  /**
   *Cancel the prior approval for the transfer of an item by a delegate.
   *
   *Origin must be either:
   *- the `Force` origin;
   *- `Signed` with the signer being the Admin of the `collection`;
   *- `Signed` with the signer being the Owner of the `item`;
   *
   *Arguments:
   *- `collection`: The collection of the item of whose approval will be cancelled.
   *- `item`: The item of the item of whose approval will be cancelled.
   *- `maybe_check_delegate`: If `Some` will ensure that the given account is the one to
   *  which permission of transfer is delegated.
   *
   *Emits `ApprovalCancelled` on success.
   *
   *Weight: `O(1)`
   */
  cancel_approval: Anonymize<I1j3v9uknthnij>;
  /**
   *Alter the attributes of a given item.
   *
   *Origin must be `ForceOrigin`.
   *
   *- `collection`: The identifier of the item.
   *- `owner`: The new Owner of this item.
   *- `issuer`: The new Issuer of this item.
   *- `admin`: The new Admin of this item.
   *- `freezer`: The new Freezer of this item.
   *- `free_holding`: Whether a deposit is taken for holding an item of this collection.
   *- `is_frozen`: Whether this collection is frozen except for permissioned/admin
   *instructions.
   *
   *Emits `ItemStatusChanged` with the identity of the item.
   *
   *Weight: `O(1)`
   */
  force_item_status: Anonymize<I6ng2cdk1vvip6>;
  /**
   *Set an attribute for a collection or item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`collection`.
   *
   *If the origin is Signed, then funds of signer are reserved according to the formula:
   *`MetadataDepositBase + DepositPerByte * (key.len + value.len)` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the collection whose item's metadata to set.
   *- `maybe_item`: The identifier of the item whose metadata to set.
   *- `key`: The key of the attribute.
   *- `value`: The value to which to set the attribute.
   *
   *Emits `AttributeSet`.
   *
   *Weight: `O(1)`
   */
  set_attribute: Anonymize<I62ht2i39rtkaa>;
  /**
   *Clear an attribute for a collection or item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`collection`.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose item's metadata to clear.
   *- `maybe_item`: The identifier of the item whose metadata to clear.
   *- `key`: The key of the attribute.
   *
   *Emits `AttributeCleared`.
   *
   *Weight: `O(1)`
   */
  clear_attribute: Anonymize<Ichf8eu9t3dtc2>;
  /**
   *Set the metadata for an item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`collection`.
   *
   *If the origin is Signed, then funds of signer are reserved according to the formula:
   *`MetadataDepositBase + DepositPerByte * data.len` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the collection whose item's metadata to set.
   *- `item`: The identifier of the item whose metadata to set.
   *- `data`: The general information of this item. Limited in length by `StringLimit`.
   *- `is_frozen`: Whether the metadata should be frozen against further changes.
   *
   *Emits `MetadataSet`.
   *
   *Weight: `O(1)`
   */
  set_metadata: Anonymize<I9e4bfe80t2int>;
  /**
   *Clear the metadata for an item.
   *
   *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
   *`item`.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose item's metadata to clear.
   *- `item`: The identifier of the item whose metadata to clear.
   *
   *Emits `MetadataCleared`.
   *
   *Weight: `O(1)`
   */
  clear_metadata: Anonymize<I92ucef7ff2o7l>;
  /**
   *Set the metadata for a collection.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
   *the `collection`.
   *
   *If the origin is `Signed`, then funds of signer are reserved according to the formula:
   *`MetadataDepositBase + DepositPerByte * data.len` taking into
   *account any already reserved funds.
   *
   *- `collection`: The identifier of the item whose metadata to update.
   *- `data`: The general information of this item. Limited in length by `StringLimit`.
   *- `is_frozen`: Whether the metadata should be frozen against further changes.
   *
   *Emits `CollectionMetadataSet`.
   *
   *Weight: `O(1)`
   */
  set_collection_metadata: Anonymize<I9oai3q0an1tbo>;
  /**
   *Clear the metadata for a collection.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
   *the `collection`.
   *
   *Any deposit is freed for the collection's owner.
   *
   *- `collection`: The identifier of the collection whose metadata to clear.
   *
   *Emits `CollectionMetadataCleared`.
   *
   *Weight: `O(1)`
   */
  clear_collection_metadata: Anonymize<I88sl1jplq27bh>;
  /**
   *Set (or reset) the acceptance of ownership for a particular account.
   *
   *Origin must be `Signed` and if `maybe_collection` is `Some`, then the signer must have a
   *provider reference.
   *
   *- `maybe_collection`: The identifier of the collection whose ownership the signer is
   *  willing to accept, or if `None`, an indication that the signer is willing to accept no
   *  ownership transferal.
   *
   *Emits `OwnershipAcceptanceChanged`.
   */
  set_accept_ownership: Anonymize<I90ivo9n6p6nqo>;
  /**
   *Set the maximum amount of items a collection could have.
   *
   *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
   *the `collection`.
   *
   *Note: This function can only succeed once per collection.
   *
   *- `collection`: The identifier of the collection to change.
   *- `max_supply`: The maximum amount of items a collection could have.
   *
   *Emits `CollectionMaxSupplySet` event when successful.
   */
  set_collection_max_supply: Anonymize<Idj9k8sn80h3m6>;
  /**
   *Set (or reset) the price for an item.
   *
   *Origin must be Signed and must be the owner of the asset `item`.
   *
   *- `collection`: The collection of the item.
   *- `item`: The item to set the price for.
   *- `price`: The price for the item. Pass `None`, to reset the price.
   *- `buyer`: Restricts the buy operation to a specific account.
   *
   *Emits `ItemPriceSet` on success if the price is not `None`.
   *Emits `ItemPriceRemoved` on success if the price is `None`.
   */
  set_price: Anonymize<I64f3h3tf92u6f>;
  /**
   *Allows to buy an item if it's up for sale.
   *
   *Origin must be Signed and must not be the owner of the `item`.
   *
   *- `collection`: The collection of the item.
   *- `item`: The item the sender wants to buy.
   *- `bid_price`: The price the sender is willing to pay.
   *
   *Emits `ItemBought` on success.
   */
  buy_item: Anonymize<Ifnmu9mlmgtdbf>;
}>;
export type I3rrsthr03bsf8 = {
  collection: bigint;
  admin: SS58String;
};
export type I1it6nfuocs3uo = {
  collection: bigint;
  owner: SS58String;
  free_holding: boolean;
};
export type I83qeclck631s2 = {
  collection: bigint;
  witness: Anonymize<I59th026dnaruk>;
};
export type I4apbr3d7b110l = {
  collection: bigint;
  item: bigint;
  check_owner?: Anonymize<Ihfphjolmsqq1>;
};
export type I9svbf1ionsuba = {
  collection: bigint;
  item: bigint;
  dest: SS58String;
};
export type I63enm20toa64c = {
  collection: bigint;
  items: Anonymize<Iafqnechp3omqg>;
};
export type I3fatc2oi4mp63 = {
  collection: bigint;
  item: bigint;
  delegate: SS58String;
};
export type I1j3v9uknthnij = {
  collection: bigint;
  item: bigint;
  maybe_check_delegate?: Anonymize<Ihfphjolmsqq1>;
};
export type I6ng2cdk1vvip6 = {
  collection: bigint;
  owner: SS58String;
  issuer: SS58String;
  admin: SS58String;
  freezer: SS58String;
  free_holding: boolean;
  is_frozen: boolean;
};
export type I90ivo9n6p6nqo = {
  maybe_collection?: Anonymize<I35p85j063s0il>;
};
export type I64f3h3tf92u6f = {
  collection: bigint;
  item: bigint;
  price?: Anonymize<I35p85j063s0il>;
  whitelisted_buyer?: Anonymize<Ihfphjolmsqq1>;
};
export type Ifnmu9mlmgtdbf = {
  collection: bigint;
  item: bigint;
  bid_price: bigint;
};
export type I39l72gdmkk30t = AnonymousEnum<{
  /**
   *Control the automatic migration.
   *
   *The dispatch origin of this call must be [`Config::ControlOrigin`].
   */
  control_auto_migration: Anonymize<I7psec5e6ghc64>;
  /**
   *Continue the migration for the given `limits`.
   *
   *The dispatch origin of this call can be any signed account.
   *
   *This transaction has NO MONETARY INCENTIVES. calling it will not reward anyone. Albeit,
   *Upon successful execution, the transaction fee is returned.
   *
   *The (potentially over-estimated) of the byte length of all the data read must be
   *provided for up-front fee-payment and weighing. In essence, the caller is guaranteeing
   *that executing the current `MigrationTask` with the given `limits` will not exceed
   *`real_size_upper` bytes of read data.
   *
   *The `witness_task` is merely a helper to prevent the caller from being slashed or
   *generally trigger a migration that they do not intend. This parameter is just a message
   *from caller, saying that they believed `witness_task` was the last state of the
   *migration, and they only wish for their transaction to do anything, if this assumption
   *holds. In case `witness_task` does not match, the transaction fails.
   *
   *Based on the documentation of [`MigrationTask::migrate_until_exhaustion`], the
   *recommended way of doing this is to pass a `limit` that only bounds `count`, as the
   *`size` limit can always be overwritten.
   */
  continue_migrate: Anonymize<I2psb0sladd863>;
  /**
   *Migrate the list of top keys by iterating each of them one by one.
   *
   *This does not affect the global migration process tracker ([`MigrationProcess`]), and
   *should only be used in case any keys are leftover due to a bug.
   */
  migrate_custom_top: Anonymize<I585tk8khua0gk>;
  /**
   *Migrate the list of child keys by iterating each of them one by one.
   *
   *All of the given child keys must be present under one `child_root`.
   *
   *This does not affect the global migration process tracker ([`MigrationProcess`]), and
   *should only be used in case any keys are leftover due to a bug.
   */
  migrate_custom_child: Anonymize<I3ut99di214ru2>;
  /**
   *Set the maximum limit of the signed migration.
   */
  set_signed_max_limits: Anonymize<Iemkp87d26vsbh>;
  /**
   *Forcefully set the progress the running migration.
   *
   *This is only useful in one case: the next key to migrate is too big to be migrated with
   *a signed account, in a parachain context, and we simply want to skip it. A reasonable
   *example of this would be `:code:`, which is both very expensive to migrate, and commonly
   *used, so probably it is already migrated.
   *
   *In case you mess things up, you can also, in principle, use this to reset the migration
   *process.
   */
  force_set_progress: Anonymize<I4ahfrt5dscf6q>;
}>;
export type I7psec5e6ghc64 = {
  maybe_config?: Anonymize<Ib17t3992hb64n>;
};
export type Ib17t3992hb64n = Anonymize<I215mkl885p4da> | undefined;
export type I215mkl885p4da = {
  size: number;
  item: number;
};
export type I2psb0sladd863 = {
  limits: Anonymize<I215mkl885p4da>;
  real_size_upper: number;
  witness_task: Anonymize<If354jrdedj0pj>;
};
export type If354jrdedj0pj = {
  progress_top: Anonymize<I1ufmh6d8psvik>;
  progress_child: Anonymize<I1ufmh6d8psvik>;
  size: number;
  top_items: number;
  child_items: number;
};
export type I1ufmh6d8psvik = AnonymousEnum<{
  ToStart: undefined;
  LastKey: Binary;
  Complete: undefined;
}>;
export type I585tk8khua0gk = {
  keys: Anonymize<Itom7fk49o0c9>;
  witness_size: number;
};
export type I3ut99di214ru2 = {
  root: Binary;
  child_keys: Anonymize<Itom7fk49o0c9>;
  total_size: number;
};
export type Iemkp87d26vsbh = {
  limits: Anonymize<I215mkl885p4da>;
};
export type I4ahfrt5dscf6q = {
  progress_top: Anonymize<I1ufmh6d8psvik>;
  progress_child: Anonymize<I1ufmh6d8psvik>;
};
export type I2n8tlau8fpfvp = AnonymousEnum<{
  /**
   *Vote in a poll. If `vote.is_aye()`, the vote is to enact the proposal;
   *otherwise it is a vote to keep the status quo.
   *
   *The dispatch origin of this call must be _Signed_.
   *
   *- `poll_index`: The index of the poll to vote for.
   *- `vote`: The vote configuration.
   *
   *Weight: `O(R)` where R is the number of polls the voter has voted on.
   */
  vote: Anonymize<Idnsr2pndm36h0>;
  /**
   *Delegate the voting power (with some given conviction) of the sending account for a
   *particular class of polls.
   *
   *The balance delegated is locked for as long as it's delegated, and thereafter for the
   *time appropriate for the conviction's lock period.
   *
   *The dispatch origin of this call must be _Signed_, and the signing account must either:
   *  - be delegating already; or
   *  - have no voting activity (if there is, then it will need to be removed through
   *    `remove_vote`).
   *
   *- `to`: The account whose voting the `target` account's voting power will follow.
   *- `class`: The class of polls to delegate. To delegate multiple classes, multiple calls
   *  to this function are required.
   *- `conviction`: The conviction that will be attached to the delegated votes. When the
   *  account is undelegated, the funds will be locked for the corresponding period.
   *- `balance`: The amount of the account's balance to be used in delegating. This must not
   *  be more than the account's current balance.
   *
   *Emits `Delegated`.
   *
   *Weight: `O(R)` where R is the number of polls the voter delegating to has
   *  voted on. Weight is initially charged as if maximum votes, but is refunded later.
   */
  delegate: Anonymize<Itcpv4hqecjfj>;
  /**
   *Undelegate the voting power of the sending account for a particular class of polls.
   *
   *Tokens may be unlocked following once an amount of time consistent with the lock period
   *of the conviction with which the delegation was issued has passed.
   *
   *The dispatch origin of this call must be _Signed_ and the signing account must be
   *currently delegating.
   *
   *- `class`: The class of polls to remove the delegation from.
   *
   *Emits `Undelegated`.
   *
   *Weight: `O(R)` where R is the number of polls the voter delegating to has
   *  voted on. Weight is initially charged as if maximum votes, but is refunded later.
   */
  undelegate: Anonymize<I8steo882k7qns>;
  /**
   *Remove the lock caused by prior voting/delegating which has expired within a particular
   *class.
   *
   *The dispatch origin of this call must be _Signed_.
   *
   *- `class`: The class of polls to unlock.
   *- `target`: The account to remove the lock on.
   *
   *Weight: `O(R)` with R number of vote of target.
   */
  unlock: Anonymize<I9qtj66dgng975>;
  /**
   *Remove a vote for a poll.
   *
   *If:
   *- the poll was cancelled, or
   *- the poll is ongoing, or
   *- the poll has ended such that
   *  - the vote of the account was in opposition to the result; or
   *  - there was no conviction to the account's vote; or
   *  - the account made a split vote
   *...then the vote is removed cleanly and a following call to `unlock` may result in more
   *funds being available.
   *
   *If, however, the poll has ended and:
   *- it finished corresponding to the vote of the account, and
   *- the account made a standard vote with conviction, and
   *- the lock period of the conviction is not over
   *...then the lock will be aggregated into the overall account's lock, which may involve
   **overlocking* (where the two locks are combined into a single lock that is the maximum
   *of both the amount locked and the time is it locked for).
   *
   *The dispatch origin of this call must be _Signed_, and the signer must have a vote
   *registered for poll `index`.
   *
   *- `index`: The index of poll of the vote to be removed.
   *- `class`: Optional parameter, if given it indicates the class of the poll. For polls
   *  which have finished or are cancelled, this must be `Some`.
   *
   *Weight: `O(R + log R)` where R is the number of polls that `target` has voted on.
   *  Weight is calculated for the maximum number of vote.
   */
  remove_vote: Anonymize<I5f178ab6b89t3>;
  /**
   *Remove a vote for a poll.
   *
   *If the `target` is equal to the signer, then this function is exactly equivalent to
   *`remove_vote`. If not equal to the signer, then the vote must have expired,
   *either because the poll was cancelled, because the voter lost the poll or
   *because the conviction period is over.
   *
   *The dispatch origin of this call must be _Signed_.
   *
   *- `target`: The account of the vote to be removed; this account must have voted for poll
   *  `index`.
   *- `index`: The index of poll of the vote to be removed.
   *- `class`: The class of the poll.
   *
   *Weight: `O(R + log R)` where R is the number of polls that `target` has voted on.
   *  Weight is calculated for the maximum number of vote.
   */
  remove_other_vote: Anonymize<Iduerupfbc8ruc>;
}>;
export type Idnsr2pndm36h0 = {
  poll_index: number;
  vote: ConvictionVotingVoteAccountVote;
};
export type ConvictionVotingVoteAccountVote = Enum<{
  Standard: Anonymize<Ib024p97ls1cla>;
  Split: Anonymize<I5pi71t9bosoiv>;
  SplitAbstain: Anonymize<I89irppcaqmf1i>;
}>;
export declare const ConvictionVotingVoteAccountVote: GetEnum<ConvictionVotingVoteAccountVote>;
export type I89irppcaqmf1i = {
  aye: bigint;
  nay: bigint;
  abstain: bigint;
};
export type Itcpv4hqecjfj = {
  class: number;
  to: SS58String;
  conviction: VotingConviction;
  balance: bigint;
};
export type I8steo882k7qns = {
  class: number;
};
export type I9qtj66dgng975 = {
  class: number;
  target: SS58String;
};
export type I5f178ab6b89t3 = {
  class?: Anonymize<I4arjljr6dpflb>;
  index: number;
};
export type Iduerupfbc8ruc = {
  target: SS58String;
  class: number;
  index: number;
};
export type Id898bhfhj4av7 = AnonymousEnum<{
  /**
   *Propose a referendum on a privileged action.
   *
   *- `origin`: must be `SubmitOrigin` and the account must have `SubmissionDeposit` funds
   *  available.
   *- `proposal_origin`: The origin from which the proposal should be executed.
   *- `proposal`: The proposal.
   *- `enactment_moment`: The moment that the proposal should be enacted.
   *
   *Emits `Submitted`.
   */
  submit: Anonymize<I1q9ffekvj417t>;
  /**
   *Post the Decision Deposit for a referendum.
   *
   *- `origin`: must be `Signed` and the account must have funds available for the
   *  referendum's track's Decision Deposit.
   *- `index`: The index of the submitted referendum whose Decision Deposit is yet to be
   *  posted.
   *
   *Emits `DecisionDepositPlaced`.
   */
  place_decision_deposit: Anonymize<I666bl2fqjkejo>;
  /**
   *Refund the Decision Deposit for a closed referendum back to the depositor.
   *
   *- `origin`: must be `Signed` or `Root`.
   *- `index`: The index of a closed referendum whose Decision Deposit has not yet been
   *  refunded.
   *
   *Emits `DecisionDepositRefunded`.
   */
  refund_decision_deposit: Anonymize<I666bl2fqjkejo>;
  /**
   *Cancel an ongoing referendum.
   *
   *- `origin`: must be the `CancelOrigin`.
   *- `index`: The index of the referendum to be cancelled.
   *
   *Emits `Cancelled`.
   */
  cancel: Anonymize<I666bl2fqjkejo>;
  /**
   *Cancel an ongoing referendum and slash the deposits.
   *
   *- `origin`: must be the `KillOrigin`.
   *- `index`: The index of the referendum to be cancelled.
   *
   *Emits `Killed` and `DepositSlashed`.
   */
  kill: Anonymize<I666bl2fqjkejo>;
  /**
   *Advance a referendum onto its next logical state. Only used internally.
   *
   *- `origin`: must be `Root`.
   *- `index`: the referendum to be advanced.
   */
  nudge_referendum: Anonymize<I666bl2fqjkejo>;
  /**
   *Advance a track onto its next logical state. Only used internally.
   *
   *- `origin`: must be `Root`.
   *- `track`: the track to be advanced.
   *
   *Action item for when there is now one fewer referendum in the deciding phase and the
   *`DecidingCount` is not yet updated. This means that we should either:
   *- begin deciding another referendum (and leave `DecidingCount` alone); or
   *- decrement `DecidingCount`.
   */
  one_fewer_deciding: Anonymize<Icbio0e1f0034b>;
  /**
   *Refund the Submission Deposit for a closed referendum back to the depositor.
   *
   *- `origin`: must be `Signed` or `Root`.
   *- `index`: The index of a closed referendum whose Submission Deposit has not yet been
   *  refunded.
   *
   *Emits `SubmissionDepositRefunded`.
   */
  refund_submission_deposit: Anonymize<I666bl2fqjkejo>;
  /**
   *Set or clear metadata of a referendum.
   *
   *Parameters:
   *- `origin`: Must be `Signed` by a creator of a referendum or by anyone to clear a
   *  metadata of a finished referendum.
   *- `index`:  The index of a referendum to set or clear metadata for.
   *- `maybe_hash`: The hash of an on-chain stored preimage. `None` to clear a metadata.
   */
  set_metadata: Anonymize<I8c0vkqjjipnuj>;
}>;
export type I1q9ffekvj417t = {
  proposal_origin: Anonymize<I8rbu1vdc38cnp>;
  proposal: PreimagesBounded;
  enactment_moment: TraitsScheduleDispatchTime;
};
export type TraitsScheduleDispatchTime = Enum<{
  At: number;
  After: number;
}>;
export declare const TraitsScheduleDispatchTime: GetEnum<TraitsScheduleDispatchTime>;
export type Icbio0e1f0034b = {
  track: number;
};
export type I8c0vkqjjipnuj = {
  index: number;
  maybe_hash?: Anonymize<I4s6vifaf8k998>;
};
export type I7uniqr4bcb80r = AnonymousEnum<{
  whitelist_call: Anonymize<I1adbcfi5uc62r>;
  remove_whitelisted_call: Anonymize<I1adbcfi5uc62r>;
  dispatch_whitelisted_call: Anonymize<Ibf6ucefn8fh49>;
  dispatch_whitelisted_call_with_preimage: Anonymize<I6p92qik9qvgb2>;
}>;
export type Ibf6ucefn8fh49 = {
  call_hash: FixedSizeBinary<32>;
  call_encoded_len: number;
  call_weight_witness: Anonymize<I4q39t5hn830vp>;
};
export type I6p92qik9qvgb2 = {
  call: TxCallData;
};
export type I8hpku63o0lr7m = AnonymousEnum<{
  dispatch_as_treasury: Anonymize<I6p92qik9qvgb2>;
  dispatch_as_aave_manager: Anonymize<I6p92qik9qvgb2>;
  /**
   *Sets the Aave manager account to be used as origin for dispatching calls.
   *
   *This doesn't actually changes any ACL in the pool.
   *
   *This is intented to be mainly used in testnet environments, where the manager account
   *can be different.
   */
  note_aave_manager: Anonymize<Icbccs0ug47ilf>;
}>;
export type I8bdjcphmftv62 = AnonymousEnum<{
  /**
   *Register a new asset.
   *
   *New asset is given `NextAssetId` - sequential asset id
   *
   *Asset's id is optional and it can't be used by another asset if it's provided.
   *Provided `asset_id` must be from within reserved range.
   *If `asset_id` is `None`, new asset is given id for sequential ids.
   *
   *Asset's name is optional and it can't be used by another asset if it's provided.
   *Adds mapping between `name` and assigned `asset_id` so asset id can be retrieved by name too (Note: this approach is used in AMM implementation (xyk))
   *
   *Emits 'Registered` event when successful.
   */
  register: Anonymize<Iejcu4gr9du24t>;
  /**
   *Update registered asset.
   *
   *All parameteres are optional and value is not updated if param is `None`.
   *
   *`decimals` - can be update by `UpdateOrigin` only if it wasn't set yet. Only
   *`RegistryOrigin` can update `decimals` if it was previously set.
   *
   *`location` - can be updated only by `RegistryOrigin`.
   *
   *Emits `Updated` event when successful.
   */
  update: Anonymize<I9hlpdu483dt8k>;
  register_external: Anonymize<I4a8hon12idk34>;
  ban_asset: Anonymize<Ia5le7udkgbaq9>;
  unban_asset: Anonymize<Ia5le7udkgbaq9>;
}>;
export type Iejcu4gr9du24t = {
  asset_id?: Anonymize<I4arjljr6dpflb>;
  name?: Anonymize<Iabpgqcjikia83>;
  asset_type: Anonymize<I95262dsbtfh4d>;
  existential_deposit?: Anonymize<I35p85j063s0il>;
  symbol?: Anonymize<Iabpgqcjikia83>;
  decimals?: Anonymize<I4arjljr6dpflb>;
  location?: Anonymize<Ia9cgf4r40b26h>;
  xcm_rate_limit?: Anonymize<I35p85j063s0il>;
  is_sufficient: boolean;
};
export type I9hlpdu483dt8k = {
  asset_id: number;
  name?: Anonymize<Iabpgqcjikia83>;
  asset_type?: Anonymize<I42n58g2n5rm9a>;
  existential_deposit?: Anonymize<I35p85j063s0il>;
  xcm_rate_limit?: Anonymize<I35p85j063s0il>;
  is_sufficient?: Anonymize<I8ie0dco0kcuq5>;
  symbol?: Anonymize<Iabpgqcjikia83>;
  decimals?: Anonymize<I4arjljr6dpflb>;
  location?: Anonymize<Ia9cgf4r40b26h>;
};
export type I42n58g2n5rm9a = Anonymize<I95262dsbtfh4d> | undefined;
export type I8ie0dco0kcuq5 = boolean | undefined;
export type I4a8hon12idk34 = {
  location: Anonymize<I4c0s5cioidn76>;
};
export type I5queflebive1d = AnonymousEnum<{
  /**
   *Claim xHDX by providing signed message with Ethereum address.
   */
  claim: Anonymize<Ib2p3kr78drjc1>;
}>;
export type Ib2p3kr78drjc1 = {
  ethereum_signature: FixedSizeBinary<65>;
};
export type I72obq5poq736n = AnonymousEnum<{
  /**
   *Add new token to omnipool in quantity `amount` at price `initial_price`
   *
   *Initial liquidity must be transferred to pool's account for this new token manually prior to calling `add_token`.
   *
   *Initial liquidity is pool's account balance of the token.
   *
   *Position NFT token is minted for `position_owner`.
   *
   *Parameters:
   *- `asset`: The identifier of the new asset added to the pool. Must be registered in Asset registry
   *- `initial_price`: Initial price
   *- `position_owner`: account id for which share are distributed in form on NFT
   *- `weight_cap`: asset weight cap
   *
   *Emits `TokenAdded` event when successful.
   *
   */
  add_token: Anonymize<Ida2ijjar0n0j3>;
  /**
   *Add liquidity of asset `asset` in quantity `amount` to Omnipool
   *
   *`add_liquidity` adds specified asset amount to Omnipool and in exchange gives the origin
   *corresponding shares amount in form of NFT at current price.
   *
   *Asset's tradable state must contain ADD_LIQUIDITY flag, otherwise `NotAllowed` error is returned.
   *
   *NFT is minted using NTFHandler which implements non-fungibles traits from frame_support.
   *
   *Asset weight cap must be respected, otherwise `AssetWeightExceeded` error is returned.
   *Asset weight is ratio between new HubAsset reserve and total reserve of Hub asset in Omnipool.
   *
   *Add liquidity fails if price difference between spot price and oracle price is higher than allowed by `PriceBarrier`.
   *
   *Parameters:
   *- `asset`: The identifier of the new asset added to the pool. Must be already in the pool
   *- `amount`: Amount of asset added to omnipool
   *
   *Emits `LiquidityAdded` event when successful.
   *
   */
  add_liquidity: Anonymize<Ing3etrevsfg0>;
  /**
   *Add liquidity of asset `asset` in quantity `amount` to Omnipool.
   *
   *Limit protection is applied.
   *
   *`add_liquidity` adds specified asset amount to Omnipool and in exchange gives the origin
   *corresponding shares amount in form of NFT at current price.
   *
   *Asset's tradable state must contain ADD_LIQUIDITY flag, otherwise `NotAllowed` error is returned.
   *
   *NFT is minted using NTFHandler which implements non-fungibles traits from frame_support.
   *
   *Asset weight cap must be respected, otherwise `AssetWeightExceeded` error is returned.
   *Asset weight is ratio between new HubAsset reserve and total reserve of Hub asset in Omnipool.
   *
   *Add liquidity fails if price difference between spot price and oracle price is higher than allowed by `PriceBarrier`.
   *
   *Parameters:
   *- `asset`: The identifier of the new asset added to the pool. Must be already in the pool
   *- `amount`: Amount of asset added to omnipool
   *- `min_shares_limit`: The min amount of delta share asset the user should receive in the position
   *
   *Emits `LiquidityAdded` event when successful.
   *
   */
  add_liquidity_with_limit: Anonymize<Ietsl92b11kilg>;
  /**
   *Remove liquidity of asset `asset` in quantity `amount` from Omnipool
   *
   *`remove_liquidity` removes specified shares amount from given PositionId (NFT instance).
   *
   *Asset's tradable state must contain REMOVE_LIQUIDITY flag, otherwise `NotAllowed` error is returned.
   *
   *if all shares from given position are removed, position is destroyed and NFT is burned.
   *
   *Remove liquidity fails if price difference between spot price and oracle price is higher than allowed by `PriceBarrier`.
   *
   *Dynamic withdrawal fee is applied if withdrawal is not safe. It is calculated using spot price and external price oracle.
   *Withdrawal is considered safe when trading is disabled.
   *
   *Parameters:
   *- `position_id`: The identifier of position which liquidity is removed from.
   *- `amount`: Amount of shares removed from omnipool
   *
   *Emits `LiquidityRemoved` event when successful.
   *
   */
  remove_liquidity: Anonymize<Icqdi7b9m95ug3>;
  /**
   *Remove liquidity of asset `asset` in quantity `amount` from Omnipool
   *
   *Limit protection is applied.
   *
   *`remove_liquidity` removes specified shares amount from given PositionId (NFT instance).
   *
   *Asset's tradable state must contain REMOVE_LIQUIDITY flag, otherwise `NotAllowed` error is returned.
   *
   *if all shares from given position are removed, position is destroyed and NFT is burned.
   *
   *Remove liquidity fails if price difference between spot price and oracle price is higher than allowed by `PriceBarrier`.
   *
   *Dynamic withdrawal fee is applied if withdrawal is not safe. It is calculated using spot price and external price oracle.
   *Withdrawal is considered safe when trading is disabled.
   *
   *Parameters:
   *- `position_id`: The identifier of position which liquidity is removed from.
   *- `amount`: Amount of shares removed from omnipool
   *- `min_limit`: The min amount of asset to be removed for the user
   *
   *Emits `LiquidityRemoved` event when successful.
   *
   */
  remove_liquidity_with_limit: Anonymize<Ieuqv44kptstcs>;
  /**
   *Sacrifice LP position in favor of pool.
   *
   *A position is destroyed and liquidity owned by LP becomes pool owned liquidity.
   *
   *Only owner of position can perform this action.
   *
   *Emits `PositionDestroyed`.
   */
  sacrifice_position: Anonymize<I6vhvcln14dp4d>;
  /**
   *Execute a swap of `asset_in` for `asset_out`.
   *
   *Price is determined by the Omnipool.
   *
   *Hub asset is traded separately.
   *
   *Asset's tradable states must contain SELL flag for asset_in and BUY flag for asset_out, otherwise `NotAllowed` error is returned.
   *
   *Parameters:
   *- `asset_in`: ID of asset sold to the pool
   *- `asset_out`: ID of asset bought from the pool
   *- `amount`: Amount of asset sold
   *- `min_buy_amount`: Minimum amount required to receive
   *
   *Emits `SellExecuted` event when successful. Deprecated.
   *Emits `pallet_broadcast::Swapped` event when successful.
   *
   */
  sell: Anonymize<Ievca65alkkho9>;
  /**
   *Execute a swap of `asset_out` for `asset_in`.
   *
   *Price is determined by the Omnipool.
   *
   *Hub asset is traded separately.
   *
   *Asset's tradable states must contain SELL flag for asset_in and BUY flag for asset_out, otherwise `NotAllowed` error is returned.
   *
   *Parameters:
   *- `asset_in`: ID of asset sold to the pool
   *- `asset_out`: ID of asset bought from the pool
   *- `amount`: Amount of asset sold
   *- `max_sell_amount`: Maximum amount to be sold.
   *
   *Emits `BuyExecuted` event when successful. Deprecated.
   *Emits `pallet_broadcast::Swapped` event when successful.
   *
   */
  buy: Anonymize<I2qkf9i0e8mf1f>;
  /**
   *Update asset's tradable state.
   *
   *Parameters:
   *- `asset_id`: asset id
   *- `state`: new state
   *
   *Emits `TradableStateUpdated` event when successful.
   *
   */
  set_asset_tradable_state: Anonymize<Iefviakco48cs2>;
  /**
   *Refund given amount of asset to a recipient.
   *
   *A refund is needed when a token is refused to be added to Omnipool, and initial liquidity of the asset has been already transferred to pool's account.
   *
   *Transfer can be executed only if asset is not in Omnipool and pool's balance has sufficient amount.
   *
   *Only `AuthorityOrigin` can perform this operation.
   *
   *Emits `AssetRefunded`
   */
  refund_refused_asset: Anonymize<Iakb7idgif10m8>;
  /**
   *Update asset's weight cap
   *
   *Parameters:
   *- `asset_id`: asset id
   *- `cap`: new weight cap
   *
   *Emits `AssetWeightCapUpdated` event when successful.
   *
   */
  set_asset_weight_cap: Anonymize<Id7aqsj1u6b2r2>;
  /**
   *Removes protocol liquidity.
   *
   *Protocol liquidity is liquidity from sacrificed positions. In order to remove protocol liquidity,
   *we need the know the price of the position at the time of sacrifice. Hence this specific call.
   *
   *Only `AuthorityOrigin` can perform this call.
   *
   *Note that sacrifice position will be deprecated in future. There is no longer a need for that.
   *
   *It works the same way as remove liquidity call, but position is temporary reconstructed.
   *
   */
  withdraw_protocol_liquidity: Anonymize<Icah19jgge5j3e>;
  /**
   *Removes token from Omnipool.
   *
   *Asset's tradability must be FROZEN, otherwise `AssetNotFrozen` error is returned.
   *
   *Remaining shares must belong to protocol, otherwise `SharesRemaining` error is returned.
   *
   *Protocol's liquidity is transferred to the beneficiary account and hub asset amount is burned.
   *
   *Only `AuthorityOrigin` can perform this call.
   *
   *Emits `TokenRemoved` event when successful.
   */
  remove_token: Anonymize<I2bi2kbaaunr13>;
}>;
export type Ida2ijjar0n0j3 = {
  asset: number;
  initial_price: bigint;
  weight_cap: number;
  position_owner: SS58String;
};
export type Ietsl92b11kilg = {
  asset: number;
  amount: bigint;
  min_shares_limit: bigint;
};
export type Icqdi7b9m95ug3 = {
  position_id: bigint;
  amount: bigint;
};
export type Ieuqv44kptstcs = {
  position_id: bigint;
  amount: bigint;
  min_limit: bigint;
};
export type I6vhvcln14dp4d = {
  position_id: bigint;
};
export type Ievca65alkkho9 = {
  asset_in: number;
  asset_out: number;
  amount: bigint;
  min_buy_amount: bigint;
};
export type I2qkf9i0e8mf1f = {
  asset_out: number;
  asset_in: number;
  amount: bigint;
  max_sell_amount: bigint;
};
export type Icah19jgge5j3e = {
  asset_id: number;
  amount: bigint;
  price: Anonymize<I200n1ov5tbcvr>;
  dest: SS58String;
};
export type I2bi2kbaaunr13 = {
  asset_id: number;
  beneficiary: SS58String;
};
export type I851i9piqh9qel = AnonymousEnum<{
  pause_transaction: Anonymize<Ian208gj7nqkdo>;
  unpause_transaction: Anonymize<Ian208gj7nqkdo>;
}>;
export type Ian208gj7nqkdo = {
  pallet_name: Binary;
  function_name: Binary;
};
export type I6kr4saq8f2pd8 = AnonymousEnum<{
  /**
   *Dust specified account.
   *IF account balance is < min. existential deposit of given currency, and account is allowed to
   *be dusted, the remaining balance is transferred to selected account (usually treasury).
   *
   *Caller is rewarded with chosen reward in native currency.
   */
  dust_account: Anonymize<I81d44muu393rf>;
  /**
   *Add account to list of non-dustable account. Account whihc are excluded from udsting.
   *If such account should be dusted - `AccountBlacklisted` error is returned.
   *Only root can perform this action.
   */
  add_nondustable_account: Anonymize<Icbccs0ug47ilf>;
  /**
   *Remove account from list of non-dustable accounts. That means account can be dusted again.
   */
  remove_nondustable_account: Anonymize<Icbccs0ug47ilf>;
}>;
export type I81d44muu393rf = {
  account: SS58String;
  currency_id: number;
};
export type Ibsr3gp7asrav3 = AnonymousEnum<{
  /**
   *Create a new liquidity mining program with provided parameters.
   *
   *`owner` account has to have at least `total_rewards` balance. These funds will be
   *transferred from `owner` to farm account.
   *
   *The dispatch origin for this call must be `T::CreateOrigin`.
   *!!!WARN: `T::CreateOrigin` has power over funds of `owner`'s account and it should be
   *configured to trusted origin e.g Sudo or Governance.
   *
   *Parameters:
   *- `origin`: account allowed to create new liquidity mining program(root, governance).
   *- `total_rewards`: total rewards planned to distribute. These rewards will be
   *distributed between all yield farms in the global farm.
   *- `planned_yielding_periods`: planned number of periods to distribute `total_rewards`.
   *WARN: THIS IS NOT HARD DEADLINE. Not all rewards have to be distributed in
   *`planned_yielding_periods`. Rewards are distributed based on the situation in the yield
   *farms and can be distributed in a longer, though never in a shorter, time frame.
   *- `blocks_per_period`:  number of blocks in a single period. Min. number of blocks per
   *period is 1.
   *- `reward_currency`: payoff currency of rewards.
   *- `owner`: liq. mining farm owner. This account will be able to manage created
   *liquidity mining program.
   *- `yield_per_period`: percentage return on `reward_currency` of all farms.
   *- `min_deposit`: minimum amount of LP shares to be deposited into the liquidity mining by each user.
   *- `lrna_price_adjustment`: price adjustment between `[LRNA]` and `reward_currency`.
   *
   *Emits `GlobalFarmCreated` when successful.
   *
   */
  create_global_farm: Anonymize<I3iojc1k1m6nu7>;
  /**
   *Terminate existing liq. mining program.
   *
   *Only farm owner can perform this action.
   *
   *WARN: To successfully terminate a global farm, farm have to be empty
   *(all yield farms in the global farm must be terminated).
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: id of global farm to be terminated.
   *
   *Emits `GlobalFarmTerminated` event when successful.
   *
   */
  terminate_global_farm: Anonymize<I9q8qmop6bko5m>;
  /**
   *Create yield farm for given `asset_id` in the omnipool.
   *
   *Only farm owner can perform this action.
   *
   *Asset with `asset_id` has to be registered in the omnipool.
   *At most one `active` yield farm can exist in one global farm for the same `asset_id`.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: global farm id to which a yield farm will be added.
   *- `asset_id`: id of a asset in the omnipool. Yield farm will be created
   *for this asset and user will be able to lock LP shares into this yield farm immediately.
   *- `multiplier`: yield farm's multiplier.
   *- `loyalty_curve`: curve to calculate loyalty multiplier to distribute rewards to users
   *with time incentive. `None` means no loyalty multiplier.
   *
   *Emits `YieldFarmCreated` event when successful.
   *
   */
  create_yield_farm: Anonymize<Ial2ta95n8ff3b>;
  /**
   *Update yield farm's multiplier.
   *
   *Only farm owner can perform this action.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: global farm id in which yield farm will be updated.
   *- `asset_id`: id of the asset identifying yield farm in the global farm.
   *- `multiplier`: new yield farm's multiplier.
   *
   *Emits `YieldFarmUpdated` event when successful.
   *
   */
  update_yield_farm: Anonymize<Iammrvujtc5lnk>;
  /**
   *Stop liquidity miming for specific yield farm.
   *
   *This function claims rewards from `GlobalFarm` last time and stop yield farm
   *incentivization from a `GlobalFarm`. Users will be able to only withdraw
   *shares(with claiming) after calling this function.
   *`deposit_shares()` is not allowed on stopped yield farm.
   *
   *Only farm owner can perform this action.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: farm id in which yield farm will be canceled.
   *- `asset_id`: id of the asset identifying yield farm in the global farm.
   *
   *Emits `YieldFarmStopped` event when successful.
   *
   */
  stop_yield_farm: Anonymize<I87j02rt3f17j8>;
  /**
   *Resume incentivization of the asset represented by yield farm.
   *
   *This function resume incentivization of the asset from the `GlobalFarm` and
   *restore full functionality or the yield farm. Users will be able to deposit,
   *claim and withdraw again.
   *
   *WARN: Yield farm(and users) is NOT rewarded for time it was stopped.
   *
   *Only farm owner can perform this action.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: global farm id in which yield farm will be resumed.
   *- `yield_farm_id`: id of the yield farm to be resumed.
   *- `asset_id`: id of the asset identifying yield farm in the global farm.
   *- `multiplier`: yield farm multiplier.
   *
   *Emits `YieldFarmResumed` event when successful.
   *
   */
  resume_yield_farm: Anonymize<Iasmn3c065hq91>;
  /**
   *Terminate yield farm.
   *
   *This function marks a yield farm as ready to be removed from storage when it's empty. Users will
   *be able to only withdraw shares(without claiming rewards from yield farm). Unpaid rewards
   *will be transferred back to global farm and it will be used to distribute to other yield farms.
   *
   *Yield farm must be stopped before it can be terminated.
   *
   *Only global farm's owner can perform this action. Yield farm stays in the storage until it's
   *empty(all farm entries are withdrawn). Last withdrawn from yield farm trigger removing from
   *the storage.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: global farm id in which yield farm should be terminated.
   *- `yield_farm_id`: id of yield farm to be terminated.
   *- `asset_id`: id of the asset identifying yield farm.
   *
   *Emits `YieldFarmTerminated` event when successful.
   *
   */
  terminate_yield_farm: Anonymize<Ia5kd7m19ap7ge>;
  /**
   *Deposit omnipool position(LP shares) to a liquidity mining.
   *
   *This function transfers omnipool position from `origin` to pallet's account and mint NFT for
   *`origin` account. Minted NFT represents deposit in the liquidity mining. User can
   *deposit omnipool position as a whole(all the LP shares in the position).
   *
   *Parameters:
   *- `origin`: owner of the omnipool position to deposit into the liquidity mining.
   *- `global_farm_id`: id of global farm to which user wants to deposit LP shares.
   *- `yield_farm_id`: id of yield farm to deposit to.
   *- `position_id`: id of the omnipool position to be deposited into the liquidity mining.
   *
   *Emits `SharesDeposited` event when successful.
   *
   */
  deposit_shares: Anonymize<Ieq7brqoubndin>;
  /**
   *Redeposit LP shares in the already locked omnipool position.
   *
   *This function create yield farm entry for existing deposit. Amount of redeposited LP
   *shares is same as amount shares which are already deposited in the deposit.
   *
   *This function DOESN'T create new deposit(NFT).
   *
   *Parameters:
   *- `origin`: owner of the deposit to redeposit.
   *- `global_farm_id`: id of the global farm to which user wants to redeposit LP shares.
   *- `yield_farm_id`: id of the yield farm to redeposit to.
   *- `deposit_id`: identifier of the deposit to redeposit.
   *
   *Emits `SharesRedeposited` event when successful.
   *
   */
  redeposit_shares: Anonymize<Ie8ft8rd6cil27>;
  /**
   *Claim rewards from liquidity mining program for deposit represented by the `deposit_id`.
   *
   *This function calculate user rewards from liquidity mining and transfer rewards to `origin`
   *account. Claiming multiple time the same period is not allowed.
   *
   *Parameters:
   *- `origin`: owner of deposit.
   *- `deposit_id`: id of the deposit to claim rewards for.
   *- `yield_farm_id`: id of the yield farm to claim rewards from.
   *
   *Emits `RewardClaimed` event when successful.
   *
   */
  claim_rewards: Anonymize<I2k37dcoppgins>;
  /**
   *This function claim rewards and withdraw LP shares from yield farm. Omnipool position
   *is transferred to origin only if this is last withdraw in the deposit and deposit is
   *destroyed. This function claim rewards only if yield farm is not terminated and user
   *didn't already claim rewards in current period.
   *
   *Unclaimable rewards represents rewards which user won't be able to claim because of
   *exiting early and these rewards will be transferred back to global farm for future
   *redistribution.
   *
   *Parameters:
   *- `origin`: owner of deposit.
   *- `deposit_id`: id of the deposit to claim rewards for.
   *- `yield_farm_id`: id of the yield farm to claim rewards from.
   *
   *Emits:
   ** `RewardClaimed` event if claimed rewards is > 0
   ** `SharesWithdrawn` event when successful
   ** `DepositDestroyed` event when this was last withdraw from the deposit and deposit was
   *destroyed.
   *
   */
  withdraw_shares: Anonymize<I2k37dcoppgins>;
  /**
   *This extrinsic updates global farm's main parameters.
   *
   *The dispatch origin for this call must be `T::CreateOrigin`.
   *!!!WARN: `T::CreateOrigin` has power over funds of `owner`'s account and it should be
   *configured to trusted origin e.g Sudo or Governance.
   *
   *Parameters:
   *- `origin`: account allowed to create new liquidity mining program(root, governance).
   *- `global_farm_id`: id of the global farm to update.
   *- `planned_yielding_periods`: planned number of periods to distribute `total_rewards`.
   *- `yield_per_period`: percentage return on `reward_currency` of all farms.
   *- `min_deposit`: minimum amount of LP shares to be deposited into the liquidity mining by each user.
   *
   *Emits `GlobalFarmUpdated` event when successful.
   */
  update_global_farm: Anonymize<Ia05t9pjenemsb>;
  /**
   *This function allows user to join multiple farms with a single omnipool position.
   *
   *Parameters:
   *- `origin`: owner of the omnipool position to deposit into the liquidity mining.
   *- `farm_entries`: list of farms to join.
   *- `position_id`: id of the omnipool position to be deposited into the liquidity mining.
   *
   *Emits `SharesDeposited` event for the first farm entry
   *Emits `SharesRedeposited` event for each farm entry after the first one
   */
  join_farms: Anonymize<I4rm8rabbdt645>;
  /**
   *This function allows user to add liquidity then use that shares to join multiple farms.
   *
   *Parameters:
   *- `origin`: owner of the omnipool position to deposit into the liquidity mining.
   *- `farm_entries`: list of farms to join.
   *- `asset`: id of the asset to be deposited into the liquidity mining.
   *- `amount`: amount of the asset to be deposited into the liquidity mining.
   *- `min_shares_limit`: The min amount of delta share asset the user should receive in the position
   *
   *Emits `SharesDeposited` event for the first farm entry
   *Emits `SharesRedeposited` event for each farm entry after the first one
   */
  add_liquidity_and_join_farms: Anonymize<I9sh4kg79d0vn>;
  /**
   *Exit from all specified yield farms
   *
   *This function will attempt to withdraw shares and claim rewards (if available) from all
   *specified yield farms for a given deposit.
   *
   *Parameters:
   *- `origin`: account owner of deposit(nft).
   *- `deposit_id`: id of the deposit to claim rewards for.
   *- `yield_farm_ids`: id(s) of yield farm(s) to exit from.
   *
   *Emits:
   ** `RewardClaimed` for each successful claim
   ** `SharesWithdrawn` for each successful withdrawal
   ** `DepositDestroyed` if the deposit is fully withdrawn
   *
   */
  exit_farms: Anonymize<I5k5ne4orot4oe>;
  /**
   *This function allows user to add liquidity to stableswap pool,
   *then adding the stable shares as liquidity to omnipool
   *then use that omnipool shares to join multiple farms.
   *
   *If farm entries are not specified (empty vectoo), then the liquidities are still added to the pools
   *
   *Parameters:
   *- `origin`: owner of the omnipool position to deposit into the liquidity mining.
   *- `stable_pool_id`: id of the stableswap pool to add liquidity to.
   *- `stable_asset_amounts`: amount of each asset to be deposited into the stableswap pool.
   *- `farm_entries`: list of farms to join.
   *
   *Emits `LiquidityAdded` events from both pool
   *Emits `SharesDeposited` event for the first farm entry
   *Emits `SharesRedeposited` event for each farm entry after the first one
   *
   */
  add_liquidity_stableswap_omnipool_and_join_farms: Anonymize<Idtg418thlu95>;
}>;
export type I3iojc1k1m6nu7 = {
  total_rewards: bigint;
  planned_yielding_periods: number;
  blocks_per_period: number;
  reward_currency: number;
  owner: SS58String;
  yield_per_period: bigint;
  min_deposit: bigint;
  lrna_price_adjustment: bigint;
};
export type Ial2ta95n8ff3b = {
  global_farm_id: number;
  asset_id: number;
  multiplier: bigint;
  loyalty_curve?: Anonymize<Ieot4d4ofvtguv>;
};
export type Iammrvujtc5lnk = {
  global_farm_id: number;
  asset_id: number;
  multiplier: bigint;
};
export type I87j02rt3f17j8 = {
  global_farm_id: number;
  asset_id: number;
};
export type Iasmn3c065hq91 = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_id: number;
  multiplier: bigint;
};
export type Ia5kd7m19ap7ge = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_id: number;
};
export type Ieq7brqoubndin = {
  global_farm_id: number;
  yield_farm_id: number;
  position_id: bigint;
};
export type Ie8ft8rd6cil27 = {
  global_farm_id: number;
  yield_farm_id: number;
  deposit_id: bigint;
};
export type I2k37dcoppgins = {
  deposit_id: bigint;
  yield_farm_id: number;
};
export type Ia05t9pjenemsb = {
  global_farm_id: number;
  planned_yielding_periods: number;
  yield_per_period: bigint;
  min_deposit: bigint;
};
export type I4rm8rabbdt645 = {
  farm_entries: Anonymize<I95g6i7ilua7lq>;
  position_id: bigint;
};
export type I9sh4kg79d0vn = {
  farm_entries: Anonymize<I95g6i7ilua7lq>;
  asset: number;
  amount: bigint;
  min_shares_limit?: Anonymize<I35p85j063s0il>;
};
export type I5k5ne4orot4oe = {
  deposit_id: bigint;
  yield_farm_ids: Anonymize<Icgljjb6j82uhn>;
};
export type Idtg418thlu95 = {
  stable_pool_id: number;
  stable_asset_amounts: Anonymize<Id7i7r9a29m8o2>;
  farm_entries?: Anonymize<I46im7f8g5ihld>;
};
export type I46im7f8g5ihld = Anonymize<I95g6i7ilua7lq> | undefined;
export type I5ophbk33alrde = AnonymousEnum<{
  /**
   *Create a new OTC order
   *
   *Parameters:
   *- `asset_in`: Asset which is being bought
   *- `asset_out`: Asset which is being sold
   *- `amount_in`: Amount that the order is seeking to buy
   *- `amount_out`: Amount that the order is selling
   *- `partially_fillable`: Flag indicating whether users can fill the order partially
   *
   *Validations:
   *- asset_in must be registered
   *- amount_in must be higher than the existential deposit of asset_in multiplied by
   *  ExistentialDepositMultiplier
   *- amount_out must be higher than the existential deposit of asset_out multiplied by
   *  ExistentialDepositMultiplier
   *
   *Events:
   *- `Placed` event when successful.
   */
  place_order: Anonymize<I8utns9aeu3t6o>;
  /**
   *Fill an OTC order (partially)
   *
   *Parameters:
   *- `order_id`: ID of the order
   *- `amount_in`: Amount with which the order is being filled
   *
   *Validations:
   *- order must be partially_fillable
   *- after the partial_fill, the remaining order.amount_in must be higher than the existential deposit
   *  of asset_in multiplied by ExistentialDepositMultiplier
   *- after the partial_fill, the remaining order.amount_out must be higher than the existential deposit
   *  of asset_out multiplied by ExistentialDepositMultiplier
   *
   *Events:
   *`PartiallyFilled` event when successful. Deprecated.
   *`pallet_broadcast::Swapped` event when successful.
   */
  partial_fill_order: Anonymize<I35cf63e7kg5on>;
  /**
   *Fill an OTC order (completely)
   *
   *Parameters:
   *- `order_id`: ID of the order
   *
   *Events:
   *`Filled` event when successful. Deprecated.
   *`pallet_broadcast::Swapped` event when successful.
   */
  fill_order: Anonymize<Ibq6b0nsk23kj8>;
  /**
   *Cancel an open OTC order
   *
   *Parameters:
   *- `order_id`: ID of the order
   *- `asset`: Asset which is being filled
   *- `amount`: Amount which is being filled
   *
   *Validations:
   *- caller is order owner
   *
   *Emits `Cancelled` event when successful.
   */
  cancel_order: Anonymize<Ibq6b0nsk23kj8>;
}>;
export type I8utns9aeu3t6o = {
  asset_in: number;
  asset_out: number;
  amount_in: bigint;
  amount_out: bigint;
  partially_fillable: boolean;
};
export type I35cf63e7kg5on = {
  order_id: number;
  amount_in: bigint;
};
export type Ihq0rdic3bdqe = AnonymousEnum<{
  /**
   *Set trade volume limit for an asset.
   *
   *Parameters:
   *- `origin`: The dispatch origin for this call. Must be `UpdateLimitsOrigin`
   *- `asset_id`: The identifier of an asset
   *- `trade_volume_limit`: New trade volume limit represented as a percentage
   *
   *Emits `TradeVolumeLimitChanged` event when successful.
   *
   */
  set_trade_volume_limit: Anonymize<I2i1tilmsb1rl1>;
  /**
   *Set add liquidity limit for an asset.
   *
   *Parameters:
   *- `origin`: The dispatch origin for this call. Must be `UpdateLimitsOrigin`
   *- `asset_id`: The identifier of an asset
   *- `liquidity_limit`: Optional add liquidity limit represented as a percentage
   *
   *Emits `AddLiquidityLimitChanged` event when successful.
   *
   */
  set_add_liquidity_limit: Anonymize<I4l0u1h71fhj81>;
  /**
   *Set remove liquidity limit for an asset.
   *
   *Parameters:
   *- `origin`: The dispatch origin for this call. Must be `UpdateLimitsOrigin`
   *- `asset_id`: The identifier of an asset
   *- `liquidity_limit`: Optional remove liquidity limit represented as a percentage
   *
   *Emits `RemoveLiquidityLimitChanged` event when successful.
   *
   */
  set_remove_liquidity_limit: Anonymize<I4l0u1h71fhj81>;
}>;
export type Ifia7upsofqkg9 = AnonymousEnum<{
  /**
   *Executes a sell with a series of trades specified in the route.
   *The price for each trade is determined by the corresponding AMM.
   *
   *- `origin`: The executor of the trade
   *- `asset_in`: The identifier of the asset to sell
   *- `asset_out`: The identifier of the asset to receive
   *- `amount_in`: The amount of `asset_in` to sell
   *- `min_amount_out`: The minimum amount of `asset_out` to receive.
   *- `route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
   *		   If not specified, than the on-chain route is used.
   *		   If no on-chain is present, then omnipool route is used as default
   *
   *Emits `RouteExecuted` when successful.
   */
  sell: Anonymize<Iet9su1uri0qgo>;
  /**
   *Executes a buy with a series of trades specified in the route.
   *The price for each trade is determined by the corresponding AMM.
   *
   *- `origin`: The executor of the trade
   *- `asset_in`: The identifier of the asset to be swapped to buy `asset_out`
   *- `asset_out`: The identifier of the asset to buy
   *- `amount_out`: The amount of `asset_out` to buy
   *- `max_amount_in`: The max amount of `asset_in` to spend on the buy.
   *- `route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
   *		   If not specified, than the on-chain route is used.
   *		   If no on-chain is present, then omnipool route is used as default
   *
   *Emits `RouteExecuted` when successful.
   */
  buy: Anonymize<I242odhgbhik24>;
  /**
   *Sets the on-chain route for a given asset pair.
   *
   *The new route is validated by being executed in a dry-run mode
   *
   *If there is no route explicitly set for an asset pair, then we use the omnipool route as default.
   *
   *When a new route is set, we compare it to the existing (or default) route.
   *The comparison happens by calculating sell amount_outs for the routes, but also for the inversed routes.
   *
   *The route is stored in an ordered manner, based on the oder of the ids in the asset pair.
   *
   *If the route is set successfully, then the fee is payed back.
   *
   *- `origin`: The origin of the route setter
   *- `asset_pair`: The identifier of the asset-pair for which the route is set
   *- `new_route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
   *
   *Emits `RouteUpdated` when successful.
   *
   *Fails with `RouteUpdateIsNotSuccessful` error when failed to set the route
   *
   */
  set_route: Anonymize<I7o081p6vv5gqs>;
  /**
   *Force inserts the on-chain route for a given asset pair, so there is no any validation for the route
   *
   *Can only be called by T::ForceInsertOrigin
   *
   *The route is stored in an ordered manner, based on the oder of the ids in the asset pair.
   *
   *If the route is set successfully, then the fee is payed back.
   *
   *- `origin`: The origin of the route setter
   *- `asset_pair`: The identifier of the asset-pair for which the route is set
   *- `new_route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
   *
   *Emits `RouteUpdated` when successful.
   *
   */
  force_insert_route: Anonymize<I7o081p6vv5gqs>;
  /**
   *Executes a sell with a series of trades specified in the route.
   *It sells all reducible user balance of `asset_in`
   *The price for each trade is determined by the corresponding AMM.
   *
   *- `origin`: The executor of the trade
   *- `asset_in`: The identifier of the asset to sell
   *- `asset_out`: The identifier of the asset to receive
   *- `min_amount_out`: The minimum amount of `asset_out` to receive.
   *- `route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
   *		   If not specified, than the on-chain route is used.
   *		   If no on-chain is present, then omnipool route is used as default
   *
   *Emits `RouteExecuted` when successful.
   *
   */
  sell_all: Anonymize<Ic18k1k8u5726n>;
}>;
export type I7o081p6vv5gqs = {
  asset_pair: Anonymize<I4kv0johj9i346>;
  new_route: Anonymize<Iesal24fi7slt9>;
};
export type Ic18k1k8u5726n = {
  asset_in: number;
  asset_out: number;
  min_amount_out: bigint;
  route: Anonymize<Iesal24fi7slt9>;
};
export type Iaikdgvqtjn8sd = AnonymousEnum<{
  /**
   *Staking pallet initialization. This call will reserved `pot`'s balance to prevent
   *account dusting and start collecting fees from trades as rewards.
   *
   *`pot`’s account has to have a balance which will be reserved to prevent account dusting.
   *
   *Emits `StakingInitialized` event when successful.
   *
   */
  initialize_staking: undefined;
  /**
   *Stake `amount` into a new staking position.
   *
   *`stake` locks specified `amount` into staking and creates new NFT representing staking
   *position.
   *Users can stake `NativeAssetId` balance which is not vested or already staked.
   *
   *Staking pallet must be initialized otherwise extrinsic will fail with error.
   *
   *Parameters:
   *- `amount`: Amount of native asset to be staked. `amount` can't be vested or already
   *staked
   *
   *Emits `PositionCreated` event when successful.
   *
   */
  stake: Anonymize<I3qt1hgg4djhgb>;
  /**
   *Extrinsic to increase staked amount of existing staking position by specified `amount`.
   *
   *`increase_stake` increases staked amount of position specified by `postion_id` by the
   *`amount` specified by the user.
   *Staking position must exist and `origin` has to be the owner of the position.
   *Users can stake tokens which are not vested or already staked.
   *Position's params e.g points are updated to offset stake increase and rewards
   *accumulated until this point are paid and locked to the user.
   *
   *Parameters:
   *- `position_id`: The identifier of the position which stake will be increased.
   *- `amount`: Amount of native asset to be added to staked amount. `amount` can't be vested or
   *already staked
   *
   *Emits `StakeAdded` event when successful.
   *
   */
  increase_stake: Anonymize<Icqdi7b9m95ug3>;
  /**
   *Claim rewards accumulated for specific staking position.
   *
   *Function calculates amount of rewards to pay for specified staking position based on
   *the amount of points position accumulated. Function also unlocks all the rewards locked
   *from `increase_stake` based on the amount of the points.
   *
   *This action is penalized by removing all the points and returning allocated unpaid rewards
   *for redistribution.
   *
   *Parameters:
   *- `position_id`: The identifier of the position to claim rewards for.
   *
   *Emits `RewardsClaimed` event when successful.
   *
   */
  claim: Anonymize<I6vhvcln14dp4d>;
  /**
   *Function pays rewards, unlocks all the staked assets and destroys staking position
   *specified by `position_id`.
   *
   *Function calculates and pays latest rewards, unlocks all the locked rewards and staked
   *tokens for staking position and burns NFT representing staking position.
   *Unpaid allocated rewards are returned to the Staking for redistribution.
   *
   *Parameters:
   *- `position_id`: The identifier of the position to be destroyed.
   *
   *Emits `RewardsClaimed` and `Unstaked` events when successful.
   *
   */
  unstake: Anonymize<I6vhvcln14dp4d>;
}>;
export type I2buckaidasvkd = AnonymousEnum<{
  /**
   *Create a stable pool with given list of assets.
   *
   *All assets must be correctly registered in `T::AssetRegistry`.
   *Note that this does not seed the pool with liquidity. Use `add_liquidity` to provide
   *initial liquidity.
   *
   *Parameters:
   *- `origin`: Must be T::AuthorityOrigin
   *- `share_asset`: Preregistered share asset identifier
   *- `assets`: List of Asset ids
   *- `amplification`: Pool amplification
   *- `fee`: fee to be applied on trade and liquidity operations
   *
   *Emits `PoolCreated` event if successful.
   */
  create_pool: Anonymize<I77a9b6eik0rui>;
  /**
   *Update pool's fee.
   *
   *if pool does not exist, `PoolNotFound` is returned.
   *
   *Parameters:
   *- `origin`: Must be T::AuthorityOrigin
   *- `pool_id`: pool to update
   *- `fee`: new pool fee
   *
   *Emits `FeeUpdated` event if successful.
   */
  update_pool_fee: Anonymize<Ics8sn0t3vlpat>;
  /**
   *Update pool's amplification.
   *
   *Parameters:
   *- `origin`: Must be T::AuthorityOrigin
   *- `pool_id`: pool to update
   *- `future_amplification`: new desired pool amplification
   *- `future_block`: future block number when the amplification is updated
   *
   *Emits `AmplificationUpdated` event if successful.
   */
  update_amplification: Anonymize<I6p5nbogrodkcc>;
  /**
   *Add liquidity to selected pool.
   *
   *First call of `add_liquidity` must provide "initial liquidity" of all assets.
   *
   *If there is liquidity already in the pool, LP can provide liquidity of any number of pool assets.
   *
   *LP must have sufficient amount of each asset.
   *
   *Origin is given corresponding amount of shares.
   *
   *Parameters:
   *- `origin`: liquidity provider
   *- `pool_id`: Pool Id
   *- `assets`: asset id and liquidity amount provided
   *
   *Emits `LiquidityAdded` event when successful.
   *Emits `pallet_broadcast::Swapped` event when successful.
   */
  add_liquidity: Anonymize<I7pgj3rnfo83eg>;
  /**
   *Add liquidity to selected pool given exact amount of shares to receive.
   *
   *Similar to `add_liquidity` but LP specifies exact amount of shares to receive.
   *
   *This functionality is used mainly by on-chain routing when a swap between Omnipool asset and stable asset is performed.
   *
   *Parameters:
   *- `origin`: liquidity provider
   *- `pool_id`: Pool Id
   *- `shares`: amount of shares to receive
   *- `asset_id`: asset id of an asset to provide as liquidity
   *- `max_asset_amount`: slippage limit. Max amount of asset.
   *
   *Emits `LiquidityAdded` event when successful.
   *Emits `pallet_broadcast::Swapped` event when successful.
   */
  add_liquidity_shares: Anonymize<Ic11mlh16sngai>;
  /**
   *Remove liquidity from selected pool.
   *
   *Withdraws liquidity of selected asset from a pool.
   *
   *Share amount is burned and LP receives corresponding amount of chosen asset.
   *
   *Withdraw fee is applied to the asset amount.
   *
   *Parameters:
   *- `origin`: liquidity provider
   *- `pool_id`: Pool Id
   *- `asset_id`: id of asset to receive
   *- 'share_amount': amount of shares to withdraw
   *- 'min_amount_out': minimum amount to receive
   *
   *Emits `LiquidityRemoved` event when successful.
   *Emits `pallet_broadcast::Swapped` event when successful.
   */
  remove_liquidity_one_asset: Anonymize<I4vbsn8c7ui70f>;
  /**
   *Remove liquidity from selected pool by specifying exact amount of asset to receive.
   *
   *Similar to `remove_liquidity_one_asset` but LP specifies exact amount of asset to receive instead of share amount.
   *
   *Parameters:
   *- `origin`: liquidity provider
   *- `pool_id`: Pool Id
   *- `asset_id`: id of asset to receive
   *- 'amount': amount of asset to receive
   *- 'max_share_amount': Slippage limit. Max amount of shares to burn.
   *
   *Emits `LiquidityRemoved` event when successful.
   *Emits `pallet_broadcast::Swapped` event when successful.
   */
  withdraw_asset_amount: Anonymize<I60m5cjc6e18ab>;
  /**
   *Execute a swap of `asset_in` for `asset_out`.
   *
   *Parameters:
   *- `origin`: origin of the caller
   *- `pool_id`: Id of a pool
   *- `asset_in`: ID of asset sold to the pool
   *- `asset_out`: ID of asset bought from the pool
   *- `amount_in`: Amount of asset to be sold to the pool
   *- `min_buy_amount`: Minimum amount required to receive
   *
   *Emits `SellExecuted` event when successful. Deprecated.
   *Emits `pallet_broadcast::Swapped` event when successful.
   *
   */
  sell: Anonymize<Iauknf9up388mv>;
  /**
   *Execute a swap of `asset_in` for `asset_out`.
   *
   *Parameters:
   *- `origin`:
   *- `pool_id`: Id of a pool
   *- `asset_out`: ID of asset bought from the pool
   *- `asset_in`: ID of asset sold to the pool
   *- `amount_out`: Amount of asset to receive from the pool
   *- `max_sell_amount`: Maximum amount allowed to be sold
   *
   *Emits `BuyExecuted` event when successful. Deprecated.
   *Emits `pallet_broadcast::Swapped` event when successful.
   *
   */
  buy: Anonymize<Ieh252ua9757u1>;
  set_asset_tradable_state: Anonymize<Iest0fomljvrb6>;
  remove_liquidity: Anonymize<I2d6orhhgh5et2>;
}>;
export type I77a9b6eik0rui = {
  share_asset: number;
  assets: Anonymize<Icgljjb6j82uhn>;
  amplification: number;
  fee: number;
};
export type I6p5nbogrodkcc = {
  pool_id: number;
  final_amplification: number;
  start_block: number;
  end_block: number;
};
export type I7pgj3rnfo83eg = {
  pool_id: number;
  assets: Anonymize<Id7i7r9a29m8o2>;
};
export type Ic11mlh16sngai = {
  pool_id: number;
  shares: bigint;
  asset_id: number;
  max_asset_amount: bigint;
};
export type I4vbsn8c7ui70f = {
  pool_id: number;
  asset_id: number;
  share_amount: bigint;
  min_amount_out: bigint;
};
export type I60m5cjc6e18ab = {
  pool_id: number;
  asset_id: number;
  amount: bigint;
  max_share_amount: bigint;
};
export type Iauknf9up388mv = {
  pool_id: number;
  asset_in: number;
  asset_out: number;
  amount_in: bigint;
  min_buy_amount: bigint;
};
export type Ieh252ua9757u1 = {
  pool_id: number;
  asset_out: number;
  asset_in: number;
  amount_out: bigint;
  max_sell_amount: bigint;
};
export type I2d6orhhgh5et2 = {
  pool_id: number;
  share_amount: bigint;
  min_amounts_out: Anonymize<Id7i7r9a29m8o2>;
};
export type It0rq8pffd1r = AnonymousEnum<{
  /**
   *Issue new fungible bonds.
   *New asset id is registered and assigned to the bonds.
   *The number of bonds the issuer receives is 1:1 to the `amount` of the underlying asset
   *minus the protocol fee.
   *The bond asset is registered with the empty string for the asset name,
   *and with the same existential deposit as of the underlying asset.
   *Bonds can be redeemed for the underlying asset once mature.
   *Protocol fee is applied to the amount, and transferred to `T::FeeReceiver`.
   *When issuing new bonds with the underlying asset and maturity that matches existing bonds,
   *new amount of these existing bonds is issued, instead of registering new bonds.
   *It's possible to issue new bonds for bonds that are already mature.
   *
   *Parameters:
   *- `origin`: issuer of new bonds, needs to be `T::IssueOrigin`
   *- `asset_id`: underlying asset id
   *- `amount`: the amount of the underlying asset
   *- `maturity`: Unix time in milliseconds, when the bonds will be mature.
   *
   *Emits `BondTokenCreated` event when successful and new bonds were registered.
   *Emits `BondsIssued` event when successful.
   *
   */
  issue: Anonymize<I3i06ijrvdoq97>;
  /**
   *Redeem bonds for the underlying asset.
   *The amount of the underlying asset the `origin` receives is 1:1 to the `amount` of the bonds.
   *Anyone who holds the bonds is able to redeem them.
   *Bonds can be both partially or fully redeemed.
   *
   *Parameters:
   *- `origin`: account id
   *- `asset_id`: bond asset id
   *- `amount`: the amount of the bonds to redeem for the underlying asset
   *
   *Emits `BondsRedeemed` event when successful.
   *
   */
  redeem: Anonymize<Ibc2f5cr6dqguj>;
}>;
export type I3i06ijrvdoq97 = {
  asset_id: number;
  amount: bigint;
  maturity: bigint;
};
export type Ibc2f5cr6dqguj = {
  bond_id: number;
  amount: bigint;
};
export type I75o581gpaivou = AnonymousEnum<{
  /**
   *Close an existing OTC arbitrage opportunity.
   *
   *Executes a trade between an OTC order and some route.
   *If the OTC order is partially fillable, the extrinsic fails if the existing arbitrage
   *opportunity is not closed or reduced after the trade.
   *If the OTC order is not partially fillable, fails if there is no profit after the trade.
   *
   *`Origin` calling this extrinsic is not paying or receiving anything.
   *
   *The profit made by closing the arbitrage is transferred to `FeeReceiver`.
   *
   *Parameters:
   *- `origin`: Signed or unsigned origin. Unsigned origin doesn't pay the TX fee,
   *			but can be submitted only by a collator.
   *- `otc_id`: ID of the OTC order with existing arbitrage opportunity.
   *- `amount`: Amount necessary to close the arb.
   *- `route`: The route we trade against. Required for the fee calculation.
   *
   *Emits `Executed` event when successful.
   *
   */
  settle_otc_order: Anonymize<Ia6sgngioc9e>;
}>;
export type Ia6sgngioc9e = {
  otc_id: number;
  amount: bigint;
  route: Anonymize<Iesal24fi7slt9>;
};
export type I4ogitqakc83nm = AnonymousEnum<{
  /**
   *Create a new liquidity bootstrapping pool for given asset pair.
   *
   *For any asset pair, only one pool can exist at a time.
   *
   *The dispatch origin for this call must be `T::CreatePoolOrigin`.
   *The pool is created with initial liquidity provided by the `pool_owner` who must have
   *sufficient funds free.
   *
   *The pool starts uninitialized and update_pool call should be called once created to set the start block.
   *
   *This function should be dispatched from governing entity `T::CreatePoolOrigin`
   *
   *Parameters:
   *- `pool_owner`: the future owner of the new pool.
   *- `asset_a`: { asset_id, amount } Asset ID and initial liquidity amount.
   *- `asset_b`: { asset_id, amount } Asset ID and initial liquidity amount.
   *- `initial_weight`: Initial weight of the asset_a. 1_000_000 corresponding to 1% and 100_000_000 to 100%
   *this should be higher than final weight
   *- `final_weight`: Final weight of the asset_a. 1_000_000 corresponding to 1% and 100_000_000 to 100%
   *this should be lower than initial weight
   *- `weight_curve`: The weight function used to update the LBP weights. Currently,
   *there is only one weight function implemented, the linear function.
   *- `fee`: The trading fee charged on every trade distributed to `fee_collector`.
   *- `fee_collector`: The account to which trading fees will be transferred.
   *- `repay_target`: The amount of tokens to repay to separate fee_collector account. Until this amount is
   *reached, fee will be increased to 20% and taken from the pool
   *
   *Emits `PoolCreated` event when successful.
   *
   *BEWARE: We are taking the fee from the accumulated asset. If the accumulated asset is sold to the pool,
   *the fee cost is transferred to the pool. If its bought from the pool the buyer bears the cost.
   *This increases the price of the sold asset on every trade. Make sure to only run this with
   *previously illiquid assets.
   */
  create_pool: Anonymize<I3qhjmr9i9etho>;
  /**
   *Update pool data of a pool.
   *
   *The dispatch origin for this call must be signed by the pool owner.
   *
   *The pool can be updated only if the sale has not already started.
   *
   *At least one of the following optional parameters has to be specified.
   *
   *Parameters:
   *- `pool_id`: The identifier of the pool to be updated.
   *- `start`: The new starting time of the sale. This parameter is optional.
   *- `end`: The new ending time of the sale. This parameter is optional.
   *- `initial_weight`: The new initial weight. This parameter is optional.
   *- `final_weight`: The new final weight. This parameter is optional.
   *- `fee`: The new trading fee charged on every trade. This parameter is optional.
   *- `fee_collector`: The new receiver of trading fees. This parameter is optional.
   *
   *Emits `PoolUpdated` event when successful.
   */
  update_pool_data: Anonymize<I13ss7bvftqcnq>;
  /**
   *Add liquidity to a pool.
   *
   *Assets to add has to match the pool assets. At least one amount has to be non-zero.
   *
   *The dispatch origin for this call must be signed by the pool owner.
   *
   *Parameters:
   *- `pool_id`: The identifier of the pool
   *- `amount_a`: The identifier of the asset and the amount to add.
   *- `amount_b`: The identifier of the second asset and the amount to add.
   *
   *Emits `LiquidityAdded` event when successful.
   */
  add_liquidity: Anonymize<Ic3gahhrcopfnt>;
  /**
   *Transfer all the liquidity from a pool back to the pool owner and destroy the pool.
   *The pool data are also removed from the storage.
   *
   *The pool can't be destroyed during the sale.
   *
   *The dispatch origin for this call must be signed by the pool owner.
   *
   *Parameters:
   *- `amount_a`: The identifier of the asset and the amount to add.
   *
   *Emits 'LiquidityRemoved' when successful.
   */
  remove_liquidity: Anonymize<I9n7ns8k72amhv>;
  /**
   *Trade `asset_in` for `asset_out`.
   *
   *Executes a swap of `asset_in` for `asset_out`. Price is determined by the pool and is
   *affected by the amount and proportion of the pool assets and the weights.
   *
   *Trading `fee` is distributed to the `fee_collector`.
   *
   *Parameters:
   *- `asset_in`: The identifier of the asset being transferred from the account to the pool.
   *- `asset_out`: The identifier of the asset being transferred from the pool to the account.
   *- `amount`: The amount of `asset_in`
   *- `max_limit`: minimum amount of `asset_out` / amount of asset_out to be obtained from the pool in exchange for `asset_in`.
   *
   *Emits `SellExecuted` when successful. Deprecated.
   *Emits `pallet_broadcast::Swapped` when successful.
   */
  sell: Anonymize<I2co61imvsepb6>;
  /**
   *Trade `asset_in` for `asset_out`.
   *
   *Executes a swap of `asset_in` for `asset_out`. Price is determined by the pool and is
   *affected by the amount and the proportion of the pool assets and the weights.
   *
   *Trading `fee` is distributed to the `fee_collector`.
   *
   *Parameters:
   *- `asset_in`: The identifier of the asset being transferred from the account to the pool.
   *- `asset_out`: The identifier of the asset being transferred from the pool to the account.
   *- `amount`: The amount of `asset_out`.
   *- `max_limit`: maximum amount of `asset_in` to be sold in exchange for `asset_out`.
   *
   *Emits `BuyExecuted` when successful. Deprecated.
   *Emits `pallet_broadcast::Swapped` when successful.
   */
  buy: Anonymize<I2co61imvsepb6>;
}>;
export type I3qhjmr9i9etho = {
  pool_owner: SS58String;
  asset_a: number;
  asset_a_amount: bigint;
  asset_b: number;
  asset_b_amount: bigint;
  initial_weight: number;
  final_weight: number;
  weight_curve: Anonymize<I9ismjef26dgjt>;
  fee: Anonymize<I9jd27rnpm8ttv>;
  fee_collector: SS58String;
  repay_target: bigint;
};
export type I13ss7bvftqcnq = {
  pool_id: SS58String;
  pool_owner?: Anonymize<Ihfphjolmsqq1>;
  start?: Anonymize<I4arjljr6dpflb>;
  end?: Anonymize<I4arjljr6dpflb>;
  initial_weight?: Anonymize<I4arjljr6dpflb>;
  final_weight?: Anonymize<I4arjljr6dpflb>;
  fee?: Anonymize<Iep7au1720bm0e>;
  fee_collector?: Anonymize<Ihfphjolmsqq1>;
  repay_target?: Anonymize<I35p85j063s0il>;
};
export type Ic3gahhrcopfnt = {
  amount_a: Anonymize<I4ojmnsk1dchql>;
  amount_b: Anonymize<I4ojmnsk1dchql>;
};
export type I9n7ns8k72amhv = {
  pool_id: SS58String;
};
export type I2co61imvsepb6 = {
  asset_in: number;
  asset_out: number;
  amount: bigint;
  max_limit: bigint;
};
export type I1bhk4tkod8r9d = AnonymousEnum<{
  /**
   *Create new pool for given asset pair.
   *
   *Registers new pool for given asset pair (`asset a` and `asset b`) in asset registry.
   *Asset registry creates new id or returns previously created one if such pool existed before.
   *
   *Pool is created with initial liquidity provided by `origin`.
   *Shares are issued with specified initial price and represents proportion of asset in the pool.
   *
   *Emits `PoolCreated` event when successful.
   */
  create_pool: Anonymize<Icjk91npopm3h9>;
  /**
   *Add liquidity to previously created asset pair pool.
   *
   *Shares are issued with current price.
   *
   *Emits `LiquidityAdded` event when successful.
   */
  add_liquidity: Anonymize<Ie03o0h06lol9p>;
  /**
   *Remove liquidity from specific liquidity pool in the form of burning shares.
   *
   *If liquidity in the pool reaches 0, it is destroyed.
   *
   *Emits 'LiquidityRemoved' when successful.
   *Emits 'PoolDestroyed' when pool is destroyed.
   */
  remove_liquidity: Anonymize<Ie6ot1bq9o2jef>;
  /**
   *Trade asset in for asset out.
   *
   *Executes a swap of `asset_in` for `asset_out`. Price is determined by the liquidity pool.
   *
   *`max_limit` - minimum amount of `asset_out` / amount of asset_out to be obtained from the pool in exchange for `asset_in`.
   *
   *Emits `SellExecuted` when successful. Deprecated.
   *Emits `pallet_broadcast::Swapped` when successful.
   */
  sell: Anonymize<I6ap0qjh5n5817>;
  /**
   *Trade asset in for asset out.
   *
   *Executes a swap of `asset_in` for `asset_out`. Price is determined by the liquidity pool.
   *
   *`max_limit` - maximum amount of `asset_in` to be sold in exchange for `asset_out`.
   *Emits `BuyExecuted` when successful. Deprecated.
   *Emits `pallet_broadcast::Swapped` when successful.
   */
  buy: Anonymize<I6ap0qjh5n5817>;
}>;
export type Icjk91npopm3h9 = {
  asset_a: number;
  amount_a: bigint;
  asset_b: number;
  amount_b: bigint;
};
export type Ie03o0h06lol9p = {
  asset_a: number;
  asset_b: number;
  amount_a: bigint;
  amount_b_max_limit: bigint;
};
export type Ie6ot1bq9o2jef = {
  asset_a: number;
  asset_b: number;
  liquidity_amount: bigint;
};
export type I6ap0qjh5n5817 = {
  asset_in: number;
  asset_out: number;
  amount: bigint;
  max_limit: bigint;
  discount: boolean;
};
export type Ibe97e14cmm4e9 = AnonymousEnum<{
  /**
   *Register new referral code.
   *
   *`origin` pays the registration fee.
   *`code` is assigned to the given `account`.
   *
   *Length of the `code` must be at least `T::MinCodeLength`.
   *Maximum length is limited to `T::CodeLength`.
   *`code` must contain only alfa-numeric characters and all characters will be converted to upper case.
   *
   *Parameters:
   *- `code`: Code to register. Must follow the restrictions.
   *
   *Emits `CodeRegistered` event when successful.
   */
  register_code: Anonymize<I6pjjpfvhvcfru>;
  /**
   *Link a code to an account.
   *
   *`Code` must be valid registered code. Otherwise `InvalidCode` is returned.
   *
   *Signer account is linked to the referral account of the code.
   *
   *Parameters:
   *- `code`: Code to use to link the signer account to.
   *
   *Emits `CodeLinked` event when successful.
   */
  link_code: Anonymize<I6pjjpfvhvcfru>;
  /**
   *Convert accrued asset amount to reward currency.
   *
   *Parameters:
   *- `asset_id`: Id of an asset to convert to RewardAsset.
   *
   *Emits `Converted` event when successful.
   */
  convert: Anonymize<Ia5le7udkgbaq9>;
  /**
   *Claim accumulated rewards
   *
   *IF there is any asset in the reward pot, all is converted to RewardCurrency first.
   *
   *Reward amount is calculated based on the shares of the signer account.
   *
   *if the signer account is referrer account, total accumulated rewards is updated as well as referrer level if reached.
   *
   *Emits `Claimed` event when successful.
   */
  claim_rewards: undefined;
  /**
   *Set asset reward percentages
   *
   *Parameters:
   *- `asset_id`: asset id
   *- `level`: level
   *- `rewards`: reward fee percentages
   *
   *Emits `AssetRewardsUpdated` event when successful.
   */
  set_reward_percentage: Anonymize<Ionfhf9va2t31>;
}>;
export type I2apo1k5eu55qq = AnonymousEnum<{
  /**
   *Liquidates an existing money market position.
   *
   *Performs a flash loan to get funds to pay for the debt.
   *Received collateral is swapped and the profit is transferred to `FeeReceiver`.
   *
   *Parameters:
   *- `origin`: Signed origin.
   *- `collateral_asset`: Asset ID used as collateral in the MM position.
   *- `debt_asset`: Asset ID used as debt in the MM position.
   *- `user`: EVM address of the MM position that we want to liquidate.
   *- `debt_to_cover`: Amount of debt we want to liquidate.
   *- `route`: The route we trade against. Required for the fee calculation.
   *
   *Emits `Liquidated` event when successful.
   *
   */
  liquidate: Anonymize<I2j52g067ah8dm>;
  /**
   *Set the borrowing market contract address.
   */
  set_borrowing_contract: Anonymize<Ics51ctc9oasbt>;
}>;
export type I2j52g067ah8dm = {
  collateral_asset: number;
  debt_asset: number;
  user: FixedSizeBinary<20>;
  debt_to_cover: bigint;
  route: Anonymize<Iesal24fi7slt9>;
};
export type Ics51ctc9oasbt = {
  contract: FixedSizeBinary<20>;
};
export type I6a7o6bu2n2amk = AnonymousEnum<{
  /**
   *Transfer some liquid free balance to another account.
   *
   *`transfer` will set the `FreeBalance` of the sender and receiver.
   *It will decrease the total issuance of the system by the
   *`TransferFee`. If the sender's account is below the existential
   *deposit as a result of the transfer, the account will be reaped.
   *
   *The dispatch origin for this call must be `Signed` by the
   *transactor.
   *
   *- `dest`: The recipient of the transfer.
   *- `currency_id`: currency type.
   *- `amount`: free balance amount to tranfer.
   */
  transfer: Anonymize<Ibbvcet1pv1l61>;
  /**
   *Transfer all remaining balance to the given account.
   *
   *NOTE: This function only attempts to transfer _transferable_
   *balances. This means that any locked, reserved, or existential
   *deposits (when `keep_alive` is `true`), will not be transferred by
   *this function. To ensure that this function results in a killed
   *account, you might need to prepare the account by removing any
   *reference counters, storage deposits, etc...
   *
   *The dispatch origin for this call must be `Signed` by the
   *transactor.
   *
   *- `dest`: The recipient of the transfer.
   *- `currency_id`: currency type.
   *- `keep_alive`: A boolean to determine if the `transfer_all`
   *  operation should send all of the funds the account has, causing
   *  the sender account to be killed (false), or transfer everything
   *  except at least the existential deposit, which will guarantee to
   *  keep the sender account alive (true).
   */
  transfer_all: Anonymize<I67bpqa7o2ocua>;
  /**
   *Same as the [`transfer`] call, but with a check that the transfer
   *will not kill the origin account.
   *
   *99% of the time you want [`transfer`] instead.
   *
   *The dispatch origin for this call must be `Signed` by the
   *transactor.
   *
   *- `dest`: The recipient of the transfer.
   *- `currency_id`: currency type.
   *- `amount`: free balance amount to tranfer.
   */
  transfer_keep_alive: Anonymize<Ibbvcet1pv1l61>;
  /**
   *Exactly as `transfer`, except the origin must be root and the source
   *account may be specified.
   *
   *The dispatch origin for this call must be _Root_.
   *
   *- `source`: The sender of the transfer.
   *- `dest`: The recipient of the transfer.
   *- `currency_id`: currency type.
   *- `amount`: free balance amount to tranfer.
   */
  force_transfer: Anonymize<I2holodggoluon>;
  /**
   *Set the balances of a given account.
   *
   *This will alter `FreeBalance` and `ReservedBalance` in storage. it
   *will also decrease the total issuance of the system
   *(`TotalIssuance`). If the new free or reserved balance is below the
   *existential deposit, it will reap the `AccountInfo`.
   *
   *The dispatch origin for this call is `root`.
   */
  set_balance: Anonymize<Ib5umq5uf644jr>;
}>;
export type Ibbvcet1pv1l61 = {
  dest: SS58String;
  currency_id: number;
  amount: bigint;
};
export type I67bpqa7o2ocua = {
  dest: SS58String;
  currency_id: number;
  keep_alive: boolean;
};
export type I2holodggoluon = {
  source: SS58String;
  dest: SS58String;
  currency_id: number;
  amount: bigint;
};
export type Ib5umq5uf644jr = {
  who: SS58String;
  currency_id: number;
  new_free: bigint;
  new_reserved: bigint;
};
export type Id0m4jim3jch3f = AnonymousEnum<{
  /**
   *Transfer some balance to another account under `currency_id`.
   *
   *The dispatch origin for this call must be `Signed` by the
   *transactor.
   */
  transfer: Anonymize<Ibbvcet1pv1l61>;
  /**
   *Transfer some native currency to another account.
   *
   *The dispatch origin for this call must be `Signed` by the
   *transactor.
   */
  transfer_native_currency: Anonymize<I9r83fr4b3rmmj>;
  /**
   *update amount of account `who` under `currency_id`.
   *
   *The dispatch origin of this call must be _Root_.
   */
  update_balance: Anonymize<I24s4g6gkj5oec>;
}>;
export type I9r83fr4b3rmmj = {
  dest: SS58String;
  amount: bigint;
};
export type Ieps3dhtu498hk = AnonymousEnum<{
  claim: undefined;
  vested_transfer: Anonymize<Iapqe6jot9df6>;
  update_vesting_schedules: Anonymize<If64i3fucaastf>;
  claim_for: Anonymize<Ietluscr05n0a8>;
}>;
export type Iapqe6jot9df6 = {
  dest: SS58String;
  schedule: Anonymize<I6k9mlgqa572np>;
};
export type If64i3fucaastf = {
  who: SS58String;
  vesting_schedules: Anonymize<I199nnq793ql30>;
};
export type I199nnq793ql30 = Array<Anonymize<I6k9mlgqa572np>>;
export type Ietluscr05n0a8 = {
  dest: SS58String;
};
export type I8s4v176jtv80g = AnonymousEnum<{
  /**
   *Withdraw balance from EVM into currency/balances pallet.
   */
  withdraw: Anonymize<Idcabvplu05lea>;
  /**
   *Issue an EVM call operation. This is similar to a message call transaction in Ethereum.
   */
  call: Anonymize<I2ncccle6pmhd9>;
  /**
   *Issue an EVM create operation. This is similar to a contract creation transaction in
   *Ethereum.
   */
  create: Anonymize<I92bnd3pe0civj>;
  /**
   *Issue an EVM create2 operation.
   */
  create2: Anonymize<Ic84i538n8bl8j>;
}>;
export type Idcabvplu05lea = {
  address: FixedSizeBinary<20>;
  value: bigint;
};
export type I2ncccle6pmhd9 = {
  source: FixedSizeBinary<20>;
  target: FixedSizeBinary<20>;
  input: Binary;
  value: Anonymize<I4totqt881mlti>;
  gas_limit: bigint;
  max_fee_per_gas: Anonymize<I4totqt881mlti>;
  max_priority_fee_per_gas?: Anonymize<Ic4rgfgksgmm3e>;
  nonce?: Anonymize<Ic4rgfgksgmm3e>;
  access_list: Anonymize<I1bsfec060j604>;
};
export type Ic4rgfgksgmm3e = Anonymize<I4totqt881mlti> | undefined;
export type I1bsfec060j604 = Array<Anonymize<I1698r597ks8k6>>;
export type I1698r597ks8k6 = [FixedSizeBinary<20>, Anonymize<Ic5m5lp1oioo8r>];
export type I92bnd3pe0civj = {
  source: FixedSizeBinary<20>;
  init: Binary;
  value: Anonymize<I4totqt881mlti>;
  gas_limit: bigint;
  max_fee_per_gas: Anonymize<I4totqt881mlti>;
  max_priority_fee_per_gas?: Anonymize<Ic4rgfgksgmm3e>;
  nonce?: Anonymize<Ic4rgfgksgmm3e>;
  access_list: Anonymize<I1bsfec060j604>;
};
export type Ic84i538n8bl8j = {
  source: FixedSizeBinary<20>;
  init: Binary;
  salt: FixedSizeBinary<32>;
  value: Anonymize<I4totqt881mlti>;
  gas_limit: bigint;
  max_fee_per_gas: Anonymize<I4totqt881mlti>;
  max_priority_fee_per_gas?: Anonymize<Ic4rgfgksgmm3e>;
  nonce?: Anonymize<Ic4rgfgksgmm3e>;
  access_list: Anonymize<I1bsfec060j604>;
};
export type Icu3fce0sripq4 = AnonymousEnum<{
  /**
   *Transact an Ethereum transaction.
   */
  transact: Anonymize<Ia8ogbeici6lip>;
}>;
export type Ia8ogbeici6lip = {
  transaction: Anonymize<I6fr2mqud652ga>;
};
export type I6fr2mqud652ga = AnonymousEnum<{
  Legacy: Anonymize<I22u79j4u5as1p>;
  EIP2930: Anonymize<I6kt2nnlnd08hf>;
  EIP1559: Anonymize<I2ns43em37mqdo>;
}>;
export type I22u79j4u5as1p = {
  nonce: Anonymize<I4totqt881mlti>;
  gas_price: Anonymize<I4totqt881mlti>;
  gas_limit: Anonymize<I4totqt881mlti>;
  action: Anonymize<I2do93a3gr3ege>;
  value: Anonymize<I4totqt881mlti>;
  input: Binary;
  signature: Anonymize<Ifka9ntqlmrnof>;
};
export type I2do93a3gr3ege = AnonymousEnum<{
  Call: FixedSizeBinary<20>;
  Create: undefined;
}>;
export type Ifka9ntqlmrnof = {
  v: bigint;
  r: FixedSizeBinary<32>;
  s: FixedSizeBinary<32>;
};
export type I6kt2nnlnd08hf = {
  chain_id: bigint;
  nonce: Anonymize<I4totqt881mlti>;
  gas_price: Anonymize<I4totqt881mlti>;
  gas_limit: Anonymize<I4totqt881mlti>;
  action: Anonymize<I2do93a3gr3ege>;
  value: Anonymize<I4totqt881mlti>;
  input: Binary;
  access_list: Anonymize<Ieap15h2pjii9u>;
  odd_y_parity: boolean;
  r: FixedSizeBinary<32>;
  s: FixedSizeBinary<32>;
};
export type Ieap15h2pjii9u = Array<Anonymize<Ia1jste73q15go>>;
export type Ia1jste73q15go = {
  address: FixedSizeBinary<20>;
  storage_keys: Anonymize<Ic5m5lp1oioo8r>;
};
export type I2ns43em37mqdo = {
  chain_id: bigint;
  nonce: Anonymize<I4totqt881mlti>;
  max_priority_fee_per_gas: Anonymize<I4totqt881mlti>;
  max_fee_per_gas: Anonymize<I4totqt881mlti>;
  gas_limit: Anonymize<I4totqt881mlti>;
  action: Anonymize<I2do93a3gr3ege>;
  value: Anonymize<I4totqt881mlti>;
  input: Binary;
  access_list: Anonymize<Ieap15h2pjii9u>;
  odd_y_parity: boolean;
  r: FixedSizeBinary<32>;
  s: FixedSizeBinary<32>;
};
export type Icg33f60pm7v85 = AnonymousEnum<{
  /**
   *Binds a Substrate address to EVM address.
   *After binding, the EVM is able to convert an EVM address to the original Substrate address.
   *Without binding, the EVM converts an EVM address to a truncated Substrate address, which doesn't correspond
   *to the origin address.
   *
   *Binding an address is not necessary for interacting with the EVM.
   *
   *Parameters:
   *- `origin`: Substrate account binding an address
   *
   *Emits `EvmAccountBound` event when successful.
   */
  bind_evm_address: undefined;
  /**
   *Adds an EVM address to the list of addresses that are allowed to deploy smart contracts.
   *
   *Parameters:
   *- `origin`: Substrate account whitelisting an address. Must be `ControllerOrigin`.
   *- `address`: EVM address that is whitelisted
   *
   *Emits `DeployerAdded` event when successful.
   */
  add_contract_deployer: Anonymize<Itmchvgqfl28g>;
  /**
   *Removes an EVM address from the list of addresses that are allowed to deploy smart contracts.
   *
   *Parameters:
   *- `origin`: Substrate account removing the EVM address from the whitelist. Must be `ControllerOrigin`.
   *- `address`: EVM address that is removed from the whitelist
   *
   *Emits `DeployerRemoved` event when successful.
   */
  remove_contract_deployer: Anonymize<Itmchvgqfl28g>;
  /**
   *Removes the account's EVM address from the list of addresses that are allowed to deploy smart contracts.
   *Based on the best practices, this extrinsic can be called by any whitelisted account to renounce their own permission.
   *
   *Parameters:
   *- `origin`: Substrate account removing their EVM address from the whitelist.
   *
   *Emits `DeployerRemoved` event when successful.
   */
  renounce_contract_deployer: undefined;
  /**
   *Adds address of the contract to the list of approved contracts to manage balances.
   *
   *Effectively giving it allowance to for any balances and tokens.
   *
   *Parameters:
   *- `origin`:  Must be `ControllerOrigin`.
   *- `address`: Contract address that will be approved
   *
   *Emits `ContractApproved` event when successful.
   */
  approve_contract: Anonymize<Itmchvgqfl28g>;
  /**
   *Removes address of the contract from the list of approved contracts to manage balances.
   *
   *Parameters:
   *- `origin`:  Must be `ControllerOrigin`.
   *- `address`: Contract address that will be disapproved
   *
   *Emits `ContractDisapproved` event when successful.
   */
  disapprove_contract: Anonymize<Itmchvgqfl28g>;
}>;
export type I7ecgc6etbbr5p = AnonymousEnum<{
  /**
   *Create new liquidity mining program with provided parameters.
   *
   *`owner` account has to have at least `total_rewards` balance. This fund will be
   *transferred from `owner` to farm account.
   *In case of `reward_currency` is insufficient asset, farm's `owner` has to pay existential
   *deposit for global farm account and for liquidity mining `pot` account.
   *
   *The dispatch origin for this call must be `T::CreateOrigin`.
   *!!!WARN: `T::CreateOrigin` has power over funds of `owner`'s account and it should be
   *configured to trusted origin e.g Sudo or Governance.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `total_rewards`: total rewards planned to distribute. This rewards will be
   *distributed between all yield farms in the global farm.
   *- `planned_yielding_periods`: planned number of periods to distribute `total_rewards`.
   *WARN: THIS IS NOT HARD DEADLINE. Not all rewards have to be distributed in
   *`planned_yielding_periods`. Rewards are distributed based on the situation in the yield
   *farms and can be distributed in a longer time frame but never in the shorter time frame.
   *- `blocks_per_period`:  number of blocks in a single period. Min. number of blocks per
   *period is 1.
   *- `incentivized_asset`: asset to be incentivized in XYK pools. All yield farms added into
   *liq. mining program have to have `incentivized_asset` in their pair.
   *- `reward_currency`: payoff currency of rewards.
   *- `owner`: liq. mining program owner.
   *- `yield_per_period`: percentage return on `reward_currency` of all farms p.a.
   *- `min_deposit`: minimum amount which can be deposited to the farm
   *- `price_adjustment`:
   *Emits `GlobalFarmCreated` event when successful.
   */
  create_global_farm: Anonymize<I10hmgseei3j6r>;
  /**
   *Update global farm's prices adjustment.
   *
   *Only farm's owner can perform this action.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: id of the global farm to update
   *- `price_adjustment`: new value for price adjustment
   *
   *Emits `GlobalFarmUpdated` event when successful.
   */
  update_global_farm: Anonymize<I8p4numg1r4ojm>;
  /**
   *Terminate existing liq. mining program.
   *
   *Only farm owner can perform this action.
   *
   *WARN: To successfully terminate a farm, farm have to be empty(all yield farms in he global farm must be terminated).
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: id of global farm to be terminated.
   *
   *Emits `GlobalFarmTerminated` event when successful.
   */
  terminate_global_farm: Anonymize<I9q8qmop6bko5m>;
  /**
   *Add yield farm for given `asset_pair` XYK pool.
   *
   *Only farm owner can perform this action.
   *
   *Only XYKs with `asset_pair` with `incentivized_asset` can be added into the farm. XYK
   *pool for `asset_pair` has to exist to successfully create yield farm.
   *Yield farm for same `asset_pair` can exist only once in the global farm.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `farm_id`: global farm id to which a yield farm will be added.
   *- `asset_pair`: asset pair identifying yield farm. Liq. mining will be allowed for this
   *`asset_pair` and one of the assets in the pair must be `incentivized_asset`.
   *- `multiplier`: yield farm multiplier.
   *- `loyalty_curve`: curve to calculate loyalty multiplier to distribute rewards to users
   *with time incentive. `None` means no loyalty multiplier.
   *
   *Emits `YieldFarmCreated` event when successful.
   */
  create_yield_farm: Anonymize<Idtucog650c7f8>;
  /**
   *Update yield farm multiplier.
   *
   *Only farm owner can perform this action.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: global farm id in which yield farm will be updated.
   *- `asset_pair`: asset pair identifying yield farm in global farm.
   *- `multiplier`: new yield farm multiplier.
   *
   *Emits `YieldFarmUpdated` event when successful.
   */
  update_yield_farm: Anonymize<I4kvfua9fqrpi2>;
  /**
   *Stop liq. miming for specific yield farm.
   *
   *This function claims rewards from `GlobalFarm` last time and stops yield farm
   *incentivization from a `GlobalFarm`. Users will be able to only withdraw
   *shares(with claiming) after calling this function.
   *`deposit_shares()` and `claim_rewards()` are not allowed on canceled yield farm.
   *
   *Only farm owner can perform this action.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: farm id in which yield farm will be canceled.
   *- `asset_pair`: asset pair identifying yield farm in the farm.
   *
   *Emits `YieldFarmStopped` event when successful.
   */
  stop_yield_farm: Anonymize<I7t5blhj97u8r7>;
  /**
   *Resume yield farm for stopped yield farm.
   *
   *This function resume incentivization from `GlobalFarm` and restore full functionality
   *for yield farm. Users will be able to deposit, claim and withdraw again.
   *
   *WARN: Yield farm is NOT rewarded for time it was stopped.
   *
   *Only farm owner can perform this action.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: global farm id in which yield farm will be resumed.
   *- `yield_farm_id`: id of yield farm to be resumed.
   *- `asset_pair`: asset pair identifying yield farm in global farm.
   *- `multiplier`: yield farm multiplier in the farm.
   *
   *Emits `YieldFarmResumed` event when successful.
   */
  resume_yield_farm: Anonymize<I21qpgggberqt3>;
  /**
   *Remove yield farm
   *
   *This function marks a yield farm as ready to be removed from storage when it's empty. Users will
   *be able to only withdraw shares(without claiming rewards from yield farm). Unpaid rewards
   *will be transferred back to global farm and will be used to distribute to other yield farms.
   *
   *Yield farm must be stopped before calling this function.
   *
   *Only global farm's owner can perform this action. Yield farm stays in the storage until it's
   *empty(all farm entries are withdrawn). Last withdrawn from yield farm trigger removing from
   *the storage.
   *
   *Parameters:
   *- `origin`: global farm's owner.
   *- `global_farm_id`: farm id from which yield farm should be terminated.
   *- `yield_farm_id`: id of yield farm to be terminated.
   *- `asset_pair`: asset pair identifying yield farm in the global farm.
   *
   *Emits `YieldFarmTerminated` event when successful.
   */
  terminate_yield_farm: Anonymize<Id7r4m9aulb7sn>;
  /**
   *Deposit LP shares to a liq. mining.
   *
   *This function transfers LP shares from `origin` to pallet's account and mint nft for
   *`origin` account. Minted nft represents deposit in the liq. mining.
   *
   *Parameters:
   *- `origin`: account depositing LP shares. This account has to have at least
   *`shares_amount` of LP shares.
   *- `global_farm_id`: id of global farm to which user wants to deposit LP shares.
   *- `yield_farm_id`: id of yield farm to deposit to.
   *- `asset_pair`: asset pair identifying LP shares user wants to deposit.
   *- `shares_amount`: amount of LP shares user wants to deposit.
   *
   *Emits `SharesDeposited` event when successful.
   */
  deposit_shares: Anonymize<Ielqbuofrsq2ri>;
  /**
   *Join multiple farms with a given share amount
   *
   *The share is deposited to the first farm of the specified fams,
   *and then redeposit the shares to the remaining farms
   *
   *Parameters:
   *- `origin`: account depositing LP shares. This account has to have at least
   *- `farm_entries`: list of global farm id and yield farm id pairs to join
   *- `asset_pair`: asset pair identifying LP shares user wants to deposit.
   *- `shares_amount`: amount of LP shares user wants to deposit.
   *
   *Emits `SharesDeposited` event for the first farm entry
   *Emits `SharesRedeposited` event for each farm entry after the first one
   */
  join_farms: Anonymize<I3hno1r9147mro>;
  /**
   *Add liquidity to XYK pool and join multiple farms with a given share amount
   *
   *The share is deposited to the first farm of the specified entries,
   *and then redeposit the shares to the remaining farms
   *
   *Parameters:
   *- `origin`: account depositing LP shares. This account has to have at least
   *- `asset_a`: asset id of the first asset in the pair
   *- `asset_b`: asset id of the second asset in the pair
   *- `amount_a`: amount of the first asset to deposit
   *- `amount_b_max_limit`: maximum amount of the second asset to deposit
   *- `farm_entries`: list of global farm id and yield farm id pairs to join
   *
   *Emits `SharesDeposited` event for the first farm entry
   *Emits `SharesRedeposited` event for each farm entry after the first one
   */
  add_liquidity_and_join_farms: Anonymize<Iaihikf7d0fpt7>;
  /**
   *Redeposit already locked LP shares to another yield farm.
   *
   *This function create yield farm entry for existing deposit. LP shares are not transferred
   *and amount of LP shares is based on existing deposit.
   *
   *This function DOESN'T create new deposit.
   *
   *Parameters:
   *- `origin`: account depositing LP shares. This account have to have at least
   *- `global_farm_id`: global farm identifier.
   *- `yield_farm_id`: yield farm identifier redepositing to.
   *- `asset_pair`: asset pair identifying LP shares user want to deposit.
   *- `deposit_id`: identifier of the deposit.
   *
   *Emits `SharesRedeposited` event when successful.
   */
  redeposit_shares: Anonymize<Iaehj4ajaudum7>;
  /**
   *Claim rewards from liq. mining for deposit represented by `nft_id`.
   *
   *This function calculate user rewards from liq. mining and transfer rewards to `origin`
   *account. Claiming in the same period is allowed only once.
   *
   *Parameters:
   *- `origin`: account owner of deposit(nft).
   *- `deposit_id`: nft id representing deposit in the yield farm.
   *- `yield_farm_id`: yield farm identifier to claim rewards from.
   *
   *Emits `RewardClaimed` event when successful.
   */
  claim_rewards: Anonymize<I2k37dcoppgins>;
  /**
   *Withdraw LP shares from liq. mining with reward claiming if possible.
   *
   *List of possible cases of transfers of LP shares and claimed rewards:
   *
   ** yield farm is active(yield farm is not stopped) - claim and transfer rewards(if it
   *wasn't claimed in this period) and transfer LP shares.
   ** liq. mining is stopped - claim and transfer rewards(if it
   *wasn't claimed in this period) and transfer LP shares.
   ** yield farm was terminated - only LP shares will be transferred.
   ** farm was terminated - only LP shares will be transferred.
   *
   *User's unclaimable rewards will be transferred back to global farm's account.
   *
   *Parameters:
   *- `origin`: account owner of deposit(nft).
   *- `deposit_id`: nft id representing deposit in the yield farm.
   *- `yield_farm_id`: yield farm identifier to dithdraw shares from.
   *- `asset_pair`: asset pair identifying yield farm in global farm.
   *
   *Emits:
   ** `RewardClaimed` if claim happen
   ** `SharesWithdrawn` event when successful
   */
  withdraw_shares: Anonymize<Id83ilm95if0sl>;
  /**
   *Exit from all specified yield farms
   *
   *This function will attempt to withdraw shares and claim rewards (if available) from all
   *specified yield farms for a given deposit.
   *
   *Parameters:
   *- `origin`: account owner of deposit(nft).
   *- `deposit_id`: nft id representing deposit in the yield farm.
   *- `asset_pair`: asset pair identifying yield farm(s) in global farm(s).
   *- `farm_entries`: id(s) of yield farm(s) to exit from.
   *
   *Emits:
   ** `RewardClaimed` for each successful claim
   ** `SharesWithdrawn` for each successful withdrawal
   ** `DepositDestroyed` if the deposit is fully withdrawn
   *
   */
  exit_farms: Anonymize<I82r4tvnf2s05i>;
}>;
export type I10hmgseei3j6r = {
  total_rewards: bigint;
  planned_yielding_periods: number;
  blocks_per_period: number;
  incentivized_asset: number;
  reward_currency: number;
  owner: SS58String;
  yield_per_period: bigint;
  min_deposit: bigint;
  price_adjustment: bigint;
};
export type I8p4numg1r4ojm = {
  global_farm_id: number;
  price_adjustment: bigint;
};
export type Idtucog650c7f8 = {
  global_farm_id: number;
  asset_pair: Anonymize<I4kv0johj9i346>;
  multiplier: bigint;
  loyalty_curve?: Anonymize<Ieot4d4ofvtguv>;
};
export type I4kvfua9fqrpi2 = {
  global_farm_id: number;
  asset_pair: Anonymize<I4kv0johj9i346>;
  multiplier: bigint;
};
export type I7t5blhj97u8r7 = {
  global_farm_id: number;
  asset_pair: Anonymize<I4kv0johj9i346>;
};
export type I21qpgggberqt3 = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_pair: Anonymize<I4kv0johj9i346>;
  multiplier: bigint;
};
export type Id7r4m9aulb7sn = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_pair: Anonymize<I4kv0johj9i346>;
};
export type Ielqbuofrsq2ri = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_pair: Anonymize<I4kv0johj9i346>;
  shares_amount: bigint;
};
export type I3hno1r9147mro = {
  farm_entries: Anonymize<I95g6i7ilua7lq>;
  asset_pair: Anonymize<I4kv0johj9i346>;
  shares_amount: bigint;
};
export type Iaihikf7d0fpt7 = {
  asset_a: number;
  asset_b: number;
  amount_a: bigint;
  amount_b_max_limit: bigint;
  farm_entries: Anonymize<I95g6i7ilua7lq>;
};
export type Iaehj4ajaudum7 = {
  global_farm_id: number;
  yield_farm_id: number;
  asset_pair: Anonymize<I4kv0johj9i346>;
  deposit_id: bigint;
};
export type Id83ilm95if0sl = {
  deposit_id: bigint;
  yield_farm_id: number;
  asset_pair: Anonymize<I4kv0johj9i346>;
};
export type I82r4tvnf2s05i = {
  deposit_id: bigint;
  asset_pair: Anonymize<I4kv0johj9i346>;
  farm_entries: Anonymize<Icgljjb6j82uhn>;
};
export type Io4g1ahr3evjh = AnonymousEnum<{
  /**
   *Creates a new DCA (Dollar-Cost Averaging) schedule and plans the next execution
   *for the specified block.
   *
   *If the block is not specified, the execution is planned for the next block.
   *If the given block is full, the execution will be planned in the subsequent block.
   *
   *Once the schedule is created, the specified `total_amount` will be reserved for DCA.
   *The reservation currency will be the `amount_in` currency of the order.
   *
   *Trades are executed as long as there is budget remaining
   *from the initial `total_amount` allocation, unless `total_amount` is 0, then trades
   *are executed until schedule is terminated.
   *
   *If a trade fails due to slippage limit or price stability errors, it will be retried.
   *If the number of retries reaches the maximum allowed,
   *the schedule will be terminated permanently.
   *In the case of a successful trade, the retry counter is reset.
   *
   *Parameters:
   *- `origin`: schedule owner
   *- `schedule`: schedule details
   *- `start_execution_block`: first possible execution block for the schedule
   *
   *Emits `Scheduled` and `ExecutionPlanned` event when successful.
   *
   */
  schedule: Anonymize<Ico8a80unk7v19>;
  /**
   *Terminates a DCA schedule and remove it completely from the chain.
   *
   *This can be called by both schedule owner or the configured `T::TerminateOrigin`
   *
   *Parameters:
   *- `origin`: schedule owner
   *- `schedule_id`: schedule id
   *- `next_execution_block`: block number where the schedule is planned.
   *
   *Emits `Terminated` event when successful.
   *
   */
  terminate: Anonymize<Ib9aiguc778ujf>;
}>;
export type Ico8a80unk7v19 = {
  schedule: Anonymize<I2u0nucph7peo9>;
  start_execution_block?: Anonymize<I4arjljr6dpflb>;
};
export type I2u0nucph7peo9 = {
  owner: SS58String;
  period: number;
  total_amount: bigint;
  max_retries?: Anonymize<I4arjljr6dpflb>;
  stability_threshold?: Anonymize<I4arjljr6dpflb>;
  slippage?: Anonymize<I4arjljr6dpflb>;
  order: Anonymize<I773hpv1qdisu8>;
};
export type Ib9aiguc778ujf = {
  schedule_id: number;
  next_execution_block?: Anonymize<I4arjljr6dpflb>;
};
export type Id1q91j6hrn3l8 = AnonymousEnum<{
  /**
   *Anonymously schedule a task.
   */
  schedule: Anonymize<Ib7m93b836tdpq>;
  /**
   *Cancel an anonymously scheduled task.
   */
  cancel: Anonymize<I5n4sebgkfr760>;
  /**
   *Schedule a named task.
   */
  schedule_named: Anonymize<Iavvprr56ai2oq>;
  /**
   *Cancel a named scheduled task.
   */
  cancel_named: Anonymize<Ifs1i5fk9cqvr6>;
  /**
   *Anonymously schedule a task after a delay.
   */
  schedule_after: Anonymize<I7t5t1pb9tm22k>;
  /**
   *Schedule a named task after a delay.
   */
  schedule_named_after: Anonymize<I8ecgqolcgg12u>;
  /**
   *Set a retry configuration for a task so that, in case its scheduled run fails, it will
   *be retried after `period` blocks, for a total amount of `retries` retries or until it
   *succeeds.
   *
   *Tasks which need to be scheduled for a retry are still subject to weight metering and
   *agenda space, same as a regular task. If a periodic task fails, it will be scheduled
   *normally while the task is retrying.
   *
   *Tasks scheduled as a result of a retry for a periodic task are unnamed, non-periodic
   *clones of the original task. Their retry configuration will be derived from the
   *original task's configuration, but will have a lower value for `remaining` than the
   *original `total_retries`.
   */
  set_retry: Anonymize<Ieg3fd8p4pkt10>;
  /**
   *Set a retry configuration for a named task so that, in case its scheduled run fails, it
   *will be retried after `period` blocks, for a total amount of `retries` retries or until
   *it succeeds.
   *
   *Tasks which need to be scheduled for a retry are still subject to weight metering and
   *agenda space, same as a regular task. If a periodic task fails, it will be scheduled
   *normally while the task is retrying.
   *
   *Tasks scheduled as a result of a retry for a periodic task are unnamed, non-periodic
   *clones of the original task. Their retry configuration will be derived from the
   *original task's configuration, but will have a lower value for `remaining` than the
   *original `total_retries`.
   */
  set_retry_named: Anonymize<I8kg5ll427kfqq>;
  /**
   *Removes the retry configuration of a task.
   */
  cancel_retry: Anonymize<I467333262q1l9>;
  /**
   *Cancel the retry configuration of a named task.
   */
  cancel_retry_named: Anonymize<Ifs1i5fk9cqvr6>;
}>;
export type Ib7m93b836tdpq = {
  when: number;
  maybe_periodic?: Anonymize<Iep7au1720bm0e>;
  priority: number;
  call: TxCallData;
};
export type Iavvprr56ai2oq = {
  id: FixedSizeBinary<32>;
  when: number;
  maybe_periodic?: Anonymize<Iep7au1720bm0e>;
  priority: number;
  call: TxCallData;
};
export type Ifs1i5fk9cqvr6 = {
  id: FixedSizeBinary<32>;
};
export type I7t5t1pb9tm22k = {
  after: number;
  maybe_periodic?: Anonymize<Iep7au1720bm0e>;
  priority: number;
  call: TxCallData;
};
export type I8ecgqolcgg12u = {
  id: FixedSizeBinary<32>;
  after: number;
  maybe_periodic?: Anonymize<Iep7au1720bm0e>;
  priority: number;
  call: TxCallData;
};
export type Ieg3fd8p4pkt10 = {
  task: Anonymize<I9jd27rnpm8ttv>;
  retries: number;
  period: number;
};
export type I8kg5ll427kfqq = {
  id: FixedSizeBinary<32>;
  retries: number;
  period: number;
};
export type I467333262q1l9 = {
  task: Anonymize<I9jd27rnpm8ttv>;
};
export type I9r7qbm7jckmoe = AnonymousEnum<{
  /**
   *Send an XCM message as parachain sovereign.
   */
  send_as_sovereign: Anonymize<I9paqujeb1fpv6>;
}>;
export type I5088lfff92ve7 = AnonymousEnum<{
  /**
   *Transfer native currencies.
   *
   *`dest_weight_limit` is the weight for XCM execution on the dest
   *chain, and it would be charged from the transferred assets. If set
   *below requirements, the execution may fail and assets wouldn't be
   *received.
   *
   *It's a no-op if any error on local XCM execution or message sending.
   *Note sending assets out per se doesn't guarantee they would be
   *received. Receiving depends on if the XCM message could be delivered
   *by the network, and if the receiving chain would handle
   *messages correctly.
   */
  transfer: Anonymize<I6t8mv3ij8f6jn>;
  /**
   *Transfer `Asset`.
   *
   *`dest_weight_limit` is the weight for XCM execution on the dest
   *chain, and it would be charged from the transferred assets. If set
   *below requirements, the execution may fail and assets wouldn't be
   *received.
   *
   *It's a no-op if any error on local XCM execution or message sending.
   *Note sending assets out per se doesn't guarantee they would be
   *received. Receiving depends on if the XCM message could be delivered
   *by the network, and if the receiving chain would handle
   *messages correctly.
   */
  transfer_multiasset: Anonymize<Idu1ujel33jksu>;
  /**
   *Transfer native currencies specifying the fee and amount as
   *separate.
   *
   *`dest_weight_limit` is the weight for XCM execution on the dest
   *chain, and it would be charged from the transferred assets. If set
   *below requirements, the execution may fail and assets wouldn't be
   *received.
   *
   *`fee` is the amount to be spent to pay for execution in destination
   *chain. Both fee and amount will be subtracted form the callers
   *balance.
   *
   *If `fee` is not high enough to cover for the execution costs in the
   *destination chain, then the assets will be trapped in the
   *destination chain
   *
   *It's a no-op if any error on local XCM execution or message sending.
   *Note sending assets out per se doesn't guarantee they would be
   *received. Receiving depends on if the XCM message could be delivered
   *by the network, and if the receiving chain would handle
   *messages correctly.
   */
  transfer_with_fee: Anonymize<I1ii8c8cvda9o5>;
  /**
   *Transfer `Asset` specifying the fee and amount as separate.
   *
   *`dest_weight_limit` is the weight for XCM execution on the dest
   *chain, and it would be charged from the transferred assets. If set
   *below requirements, the execution may fail and assets wouldn't be
   *received.
   *
   *`fee` is the Asset to be spent to pay for execution in
   *destination chain. Both fee and amount will be subtracted form the
   *callers balance For now we only accept fee and asset having the same
   *`Location` id.
   *
   *If `fee` is not high enough to cover for the execution costs in the
   *destination chain, then the assets will be trapped in the
   *destination chain
   *
   *It's a no-op if any error on local XCM execution or message sending.
   *Note sending assets out per se doesn't guarantee they would be
   *received. Receiving depends on if the XCM message could be delivered
   *by the network, and if the receiving chain would handle
   *messages correctly.
   */
  transfer_multiasset_with_fee: Anonymize<I40fog3d0qlub1>;
  /**
   *Transfer several currencies specifying the item to be used as fee
   *
   *`dest_weight_limit` is the weight for XCM execution on the dest
   *chain, and it would be charged from the transferred assets. If set
   *below requirements, the execution may fail and assets wouldn't be
   *received.
   *
   *`fee_item` is index of the currencies tuple that we want to use for
   *payment
   *
   *It's a no-op if any error on local XCM execution or message sending.
   *Note sending assets out per se doesn't guarantee they would be
   *received. Receiving depends on if the XCM message could be delivered
   *by the network, and if the receiving chain would handle
   *messages correctly.
   */
  transfer_multicurrencies: Anonymize<Ibahh2k28pd3rl>;
  /**
   *Transfer several `Asset` specifying the item to be used as fee
   *
   *`dest_weight_limit` is the weight for XCM execution on the dest
   *chain, and it would be charged from the transferred assets. If set
   *below requirements, the execution may fail and assets wouldn't be
   *received.
   *
   *`fee_item` is index of the Assets that we want to use for
   *payment
   *
   *It's a no-op if any error on local XCM execution or message sending.
   *Note sending assets out per se doesn't guarantee they would be
   *received. Receiving depends on if the XCM message could be delivered
   *by the network, and if the receiving chain would handle
   *messages correctly.
   */
  transfer_multiassets: Anonymize<Iaif2nhfhk9qc0>;
}>;
export type I6t8mv3ij8f6jn = {
  currency_id: number;
  amount: bigint;
  dest: XcmVersionedLocation;
  dest_weight_limit: XcmV3WeightLimit;
};
export type Idu1ujel33jksu = {
  asset: Anonymize<Ikdf7s28ij7ts>;
  dest: XcmVersionedLocation;
  dest_weight_limit: XcmV3WeightLimit;
};
export type Ikdf7s28ij7ts = AnonymousEnum<{
  V2: Anonymize<Id8h647t880l31>;
  V3: Anonymize<Idcm24504c8bkk>;
  V4: Anonymize<Ia5l7mu5a6v49o>;
}>;
export type I1ii8c8cvda9o5 = {
  currency_id: number;
  amount: bigint;
  fee: bigint;
  dest: XcmVersionedLocation;
  dest_weight_limit: XcmV3WeightLimit;
};
export type I40fog3d0qlub1 = {
  asset: Anonymize<Ikdf7s28ij7ts>;
  fee: Anonymize<Ikdf7s28ij7ts>;
  dest: XcmVersionedLocation;
  dest_weight_limit: XcmV3WeightLimit;
};
export type Ibahh2k28pd3rl = {
  currencies: Anonymize<If9jidduiuq7vv>;
  fee_item: number;
  dest: XcmVersionedLocation;
  dest_weight_limit: XcmV3WeightLimit;
};
export type If9jidduiuq7vv = Array<Anonymize<I4ojmnsk1dchql>>;
export type Iaif2nhfhk9qc0 = {
  assets: XcmVersionedAssets;
  fee_item: number;
  dest: XcmVersionedLocation;
  dest_weight_limit: XcmV3WeightLimit;
};
export type I46ka778gu5a9a = AnonymousEnum<{
  add_oracle: Anonymize<Iabgdocrka40v9>;
  remove_oracle: Anonymize<Iabgdocrka40v9>;
}>;
export type I99bb69usss9gs = {
  index: number;
  threshold: number;
  ayes: Anonymize<Ia2lhg7l2hilo3>;
  nays: Anonymize<Ia2lhg7l2hilo3>;
  end: number;
};
export type I8fkfedbgu1sn3 = {
  reason: FixedSizeBinary<32>;
  who: SS58String;
  finder: SS58String;
  deposit: bigint;
  closes?: Anonymize<I4arjljr6dpflb>;
  tips: Anonymize<Iba9inugg1atvo>;
  finders_fee: boolean;
};
export type Iegjdtqhbb6qh9 = [Anonymize<I25j21n2fkc116>, bigint];
export type I25j21n2fkc116 = Array<Anonymize<I2e1ekg17a2uj2>>;
export type Ic3orq32is6lrl = [SS58String, bigint, bigint];
export type I974uplh4fafs4 = [bigint, Anonymize<I35p85j063s0il>, Binary];
export type ConvictionVotingVoteVoting = Enum<{
  Casting: Anonymize<If52hjr5c5nrc5>;
  Delegating: Anonymize<I251o9sbu5566f>;
}>;
export declare const ConvictionVotingVoteVoting: GetEnum<ConvictionVotingVoteVoting>;
export type If52hjr5c5nrc5 = {
  votes: Anonymize<I42jj1su7asrm9>;
  delegations: Anonymize<I538qha8r4j3ii>;
  prior: Anonymize<I4ojmnsk1dchql>;
};
export type I42jj1su7asrm9 = Array<Anonymize<I7mk5ivue8lr2m>>;
export type I7mk5ivue8lr2m = [number, ConvictionVotingVoteAccountVote];
export type I7l9ov6gsk96cm = AnonymousEnum<{
  Ongoing: Anonymize<Iefql2lfjua83g>;
  Approved: Anonymize<Ini94eljn5lj8>;
  Rejected: Anonymize<Ini94eljn5lj8>;
  Cancelled: Anonymize<Ini94eljn5lj8>;
  TimedOut: Anonymize<Ini94eljn5lj8>;
  Killed: number;
}>;
export type Iefql2lfjua83g = {
  track: number;
  origin: Anonymize<I8rbu1vdc38cnp>;
  proposal: PreimagesBounded;
  enactment: TraitsScheduleDispatchTime;
  submitted: number;
  submission_deposit: Anonymize<Id5fm4p8lj5qgi>;
  decision_deposit?: Anonymize<Ibd24caul84kv2>;
  deciding?: Anonymize<Ibcbcndfmk0jd9>;
  tally: Anonymize<Ifsk7cbmtit1jd>;
  in_queue: boolean;
  alarm?: Anonymize<I3aj03qk2o5mdm>;
};
export type Ibd24caul84kv2 = Anonymize<Id5fm4p8lj5qgi> | undefined;
export type Ibcbcndfmk0jd9 = Anonymize<I4a0pk3ivg0trh> | undefined;
export type I4a0pk3ivg0trh = {
  since: number;
  confirming?: Anonymize<I4arjljr6dpflb>;
};
export type I3aj03qk2o5mdm = Anonymize<I3pjs7v78ujbii> | undefined;
export type I3pjs7v78ujbii = [number, Anonymize<I9jd27rnpm8ttv>];
export type Ini94eljn5lj8 = [
  number,
  Anonymize<Ibd24caul84kv2>,
  Anonymize<Ibd24caul84kv2>,
];
export type Ifj0li5nn5unet = {
  name?: Anonymize<Iabpgqcjikia83>;
  asset_type: Anonymize<I95262dsbtfh4d>;
  existential_deposit: bigint;
  symbol?: Anonymize<Iabpgqcjikia83>;
  decimals?: Anonymize<I4arjljr6dpflb>;
  xcm_rate_limit?: Anonymize<I35p85j063s0il>;
  is_sufficient: boolean;
};
export type Isibf8mrredhc = {
  genesis_hash: FixedSizeBinary<32>;
  last_block_hash: FixedSizeBinary<32>;
};
export type I8ikpj86u2na1q = {
  hub_reserve: bigint;
  shares: bigint;
  protocol_shares: bigint;
  cap: bigint;
  tradable: number;
};
export type I23jd67h2erm49 = {
  value: bigint;
  negative: boolean;
};
export type Icbsch55a85u5u = {
  asset_id: number;
  amount: bigint;
  shares: bigint;
  price: Anonymize<I200n1ov5tbcvr>;
};
export type I5ugnv0dol8v8t = {
  id: number;
  owner: SS58String;
  updated_at: number;
  total_shares_z: bigint;
  accumulated_rpz: bigint;
  reward_currency: number;
  pending_rewards: bigint;
  accumulated_paid_rewards: bigint;
  yield_per_period: bigint;
  planned_yielding_periods: number;
  blocks_per_period: number;
  incentivized_asset: number;
  max_reward_per_period: bigint;
  min_deposit: bigint;
  live_yield_farms_count: number;
  total_yield_farms_count: number;
  price_adjustment: bigint;
  state: Anonymize<Ichuq5bidsq9a6>;
};
export type Ichuq5bidsq9a6 = AnonymousEnum<{
  Active: undefined;
  Stopped: undefined;
  Terminated: undefined;
}>;
export type I1ksaufim9dq1c = {
  id: number;
  updated_at: number;
  total_shares: bigint;
  total_valued_shares: bigint;
  accumulated_rpvs: bigint;
  accumulated_rpz: bigint;
  loyalty_curve?: Anonymize<Ieot4d4ofvtguv>;
  multiplier: bigint;
  state: Anonymize<Ichuq5bidsq9a6>;
  entries_count: bigint;
  left_to_distribute: bigint;
  total_stopped: number;
};
export type Ielgh4t8o7rcvt = FixedSizeArray<3, number>;
export type I3rvqhkck00laj = {
  shares: bigint;
  amm_pool_id: number;
  yield_farm_entries: Anonymize<Ic7o3lvdma5qc6>;
};
export type Ic7o3lvdma5qc6 = Array<Anonymize<I9ae7v8fknho35>>;
export type I9ae7v8fknho35 = {
  global_farm_id: number;
  yield_farm_id: number;
  valued_shares: bigint;
  accumulated_rpvs: bigint;
  accumulated_claimed_rewards: bigint;
  entered_at: number;
  updated_at: number;
  stopped_at_creation: number;
};
export type I7bcpl5g2rcql5 = {
  owner: SS58String;
  asset_in: number;
  asset_out: number;
  amount_in: bigint;
  amount_out: bigint;
  partially_fillable: boolean;
};
export type I4vdvk2616mp4t = {
  volume_in: bigint;
  volume_out: bigint;
  limit: bigint;
};
export type I48olja7kd2ijk = {
  liquidity: bigint;
  limit: bigint;
};
export type I4q0p5rehstne = AnonymousEnum<{
  Lock: undefined;
  LockAndUnlock: undefined;
  Unlock: undefined;
}>;
export type Ibn3i0ad6beo5l = {
  asset_fee: number;
  protocol_fee: number;
  timestamp: number;
};
export type I10uqvdcdcld3o = {
  total_stake: bigint;
  accumulated_reward_per_stake: bigint;
  pot_reserved_balance: bigint;
};
export type I3fgr93o42d9hi = {
  stake: bigint;
  action_points: bigint;
  reward_per_stake: bigint;
  created_at: number;
  accumulated_slash_points: bigint;
  accumulated_unpaid_rewards: bigint;
  accumulated_locked_rewards: bigint;
};
export type Ihjc2vmjfhsmq = Array<Anonymize<Ievs2pa0k25ii7>>;
export type Ievs2pa0k25ii7 = [number, Anonymize<I663kh18bno0fo>];
export type I663kh18bno0fo = {
  amount: bigint;
  conviction: VotingConviction;
};
export type I1p5pqg6bllgtl = {
  assets: Anonymize<Icgljjb6j82uhn>;
  initial_amplification: number;
  final_amplification: number;
  initial_block: number;
  final_block: number;
  fee: number;
};
export type I9qpa0evftgoo5 = [Anonymize<I4k5pg22d1rdhq>, bigint];
export type I1stghsu756nk9 = [number, Anonymize<I4k5pg22d1rdhq>];
export type Ic02kut0350gb0 = {
  free: bigint;
  reserved: bigint;
  frozen: bigint;
};
export type I7jidl7qnnq87c = {
  size: bigint;
  hash: FixedSizeBinary<32>;
};
export type I82cps8ng2jtug = [FixedSizeBinary<20>, FixedSizeBinary<32>];
export type Ic17drnrq0rtgi = Array<Anonymize<Ifitc0q6ckjb3j>>;
export type Ifitc0q6ckjb3j = [
  Anonymize<I6fr2mqud652ga>,
  Anonymize<Ifoernv5r40rfc>,
  Anonymize<I87cgves5f5lsa>,
];
export type Ifoernv5r40rfc = {
  transaction_hash: FixedSizeBinary<32>;
  transaction_index: number;
  from: FixedSizeBinary<20>;
  to?: Anonymize<If7b8240vgt2q5>;
  contract_address?: Anonymize<If7b8240vgt2q5>;
  logs: Anonymize<Ids7ng2qsv7snu>;
  logs_bloom: FixedSizeBinary<256>;
};
export type Ids7ng2qsv7snu = Array<Anonymize<I10qb03fpuk6em>>;
export type I87cgves5f5lsa = AnonymousEnum<{
  Legacy: Anonymize<I16nm875k0bak5>;
  EIP2930: Anonymize<I16nm875k0bak5>;
  EIP1559: Anonymize<I16nm875k0bak5>;
}>;
export type I16nm875k0bak5 = {
  status_code: number;
  used_gas: Anonymize<I4totqt881mlti>;
  logs_bloom: FixedSizeBinary<256>;
  logs: Anonymize<Ids7ng2qsv7snu>;
};
export type Idi27giun0mb9q = {
  header: Anonymize<I4v962mnhj6j6r>;
  transactions: Anonymize<I1fl9qh2r1hf29>;
  ommers: Anonymize<I78ffku0ve5fgm>;
};
export type I4v962mnhj6j6r = {
  parent_hash: FixedSizeBinary<32>;
  ommers_hash: FixedSizeBinary<32>;
  beneficiary: FixedSizeBinary<20>;
  state_root: FixedSizeBinary<32>;
  transactions_root: FixedSizeBinary<32>;
  receipts_root: FixedSizeBinary<32>;
  logs_bloom: FixedSizeBinary<256>;
  difficulty: Anonymize<I4totqt881mlti>;
  number: Anonymize<I4totqt881mlti>;
  gas_limit: Anonymize<I4totqt881mlti>;
  gas_used: Anonymize<I4totqt881mlti>;
  timestamp: bigint;
  extra_data: Binary;
  mix_hash: FixedSizeBinary<32>;
  nonce: FixedSizeBinary<8>;
};
export type I1fl9qh2r1hf29 = Array<Anonymize<I6fr2mqud652ga>>;
export type I78ffku0ve5fgm = Array<Anonymize<I4v962mnhj6j6r>>;
export type Idud3fdh64aqp9 = Array<Anonymize<I87cgves5f5lsa>>;
export type Ie7atdsih6q14b = Array<Anonymize<Ifoernv5r40rfc>>;
export type I66gvo4ilpv28i = {
  shares: bigint;
  amm_pool_id: SS58String;
  yield_farm_entries: Anonymize<Ic7o3lvdma5qc6>;
};
export type Id2tibj9h7evc8 = Array<Anonymize<Idk4b6rljo7trc>>;
export type Idk4b6rljo7trc = Anonymize<I9djlpt1nr1h6p> | undefined;
export type I9djlpt1nr1h6p = {
  maybe_id?: Anonymize<I4s6vifaf8k998>;
  priority: number;
  call: PreimagesBounded;
  maybe_periodic?: Anonymize<Iep7au1720bm0e>;
  origin: Anonymize<I8rbu1vdc38cnp>;
};
export type I56u24ncejr5kt = {
  total_retries: number;
  remaining: number;
  period: number;
};
export type Ifmurjhsco5svb = [Anonymize<I4c0s5cioidn76>, Binary];
export type I7dp637m60bg7s = Array<Anonymize<Ibrjleca7ff0ct>>;
export type Ibrjleca7ff0ct = [
  Anonymize<Ieiqgknk2nvh21>,
  Anonymize<Ivkraim88i8dl>,
];
export type Ieiqgknk2nvh21 = [FixedSizeBinary<8>, Anonymize<I9jd27rnpm8ttv>];
export type Ivkraim88i8dl = {
  price: Anonymize<Idvjpcmf9rj0vv>;
  volume: Anonymize<Iffidh7c70r6f6>;
  liquidity: Anonymize<I4ldd8bihcoq20>;
  updated_at: number;
};
export type Idvjpcmf9rj0vv = {
  n: bigint;
  d: bigint;
};
export type Iffidh7c70r6f6 = {
  a_in: bigint;
  b_out: bigint;
  a_out: bigint;
  b_in: bigint;
};
export type I4ldd8bihcoq20 = {
  a: bigint;
  b: bigint;
};
export type Ifmar1ir5rft6l = [Anonymize<Ivkraim88i8dl>, number];
export type I1os9h4ivict7u = [
  FixedSizeBinary<8>,
  Anonymize<I9jd27rnpm8ttv>,
  Anonymize<I9m0752cdvui5o>,
];
export type I9m0752cdvui5o = AnonymousEnum<{
  LastBlock: undefined;
  Short: undefined;
  TenMinutes: undefined;
  Hour: undefined;
  Day: undefined;
  Week: undefined;
}>;
export type Isa48262v9oqu = Array<Anonymize<Ieiqgknk2nvh21>>;
export type Ibafpkl9hhno69 = Array<Anonymize<Ida9vhl30l98p4>>;
export type Ida9vhl30l98p4 = [number, Anonymize<I6s1tg2sl5nvmp>];
export type I6s1tg2sl5nvmp = {
  name: string;
  max_deciding: number;
  decision_deposit: bigint;
  prepare_period: number;
  decision_period: number;
  confirm_period: number;
  min_enactment_period: number;
  min_approval: ReferendaTypesCurve;
  min_support: ReferendaTypesCurve;
};
export type ReferendaTypesCurve = Enum<{
  LinearDecreasing: Anonymize<Idcpso832hml3u>;
  SteppedDecreasing: Anonymize<I5qiv0grkufa8l>;
  Reciprocal: Anonymize<I58l93su2gte4i>;
}>;
export declare const ReferendaTypesCurve: GetEnum<ReferendaTypesCurve>;
export type Idcpso832hml3u = {
  length: number;
  floor: number;
  ceil: number;
};
export type I5qiv0grkufa8l = {
  begin: number;
  end: number;
  step: number;
  period: number;
};
export type I58l93su2gte4i = {
  factor: bigint;
  x_offset: bigint;
  y_offset: bigint;
};
export type Ie5fbn0f5capo3 = {
  min_fee: number;
  max_fee: number;
  decay: bigint;
  amplification: bigint;
};
export type Ia9ai1mp1viqjd = {
  start: number;
  end: number;
};
export type Ie4gu6f3b6uctq = [number, bigint, SS58String];
export type I1202o7g6hne7p = ResultPayload<
  Anonymize<I5kcp0gmhl71c>,
  TransactionValidityError
>;
export type I4g15ko4u63fja = Array<Anonymize<Iio4je18oig73>>;
export type Iio4je18oig73 = [number, Anonymize<Ic02kut0350gb0>];
export type If08sfhqn8ujfr = {
  balance: Anonymize<I4totqt881mlti>;
  nonce: Anonymize<I4totqt881mlti>;
};
export type I3dj14b7k3rkm5 = Anonymize<I1bsfec060j604> | undefined;
export type I5ahnvkd6fugsq = ResultPayload<
  Anonymize<I7ag5k7bmmgq3j>,
  Anonymize<I9sdjnqgsnrang>
>;
export type I7ag5k7bmmgq3j = {
  exit_reason: Anonymize<Iag9iovb9j5ijo>;
  value: Binary;
  used_gas: Anonymize<I8mgv59to1hjie>;
  weight_info?: Anonymize<Ib72ii9bshc8f5>;
  logs: Anonymize<Ids7ng2qsv7snu>;
};
export type I8mgv59to1hjie = {
  standard: Anonymize<I4totqt881mlti>;
  effective: Anonymize<I4totqt881mlti>;
};
export type Ib72ii9bshc8f5 = Anonymize<Ibvme2l29puvr1> | undefined;
export type Ibvme2l29puvr1 = {
  ref_time_limit?: Anonymize<I35p85j063s0il>;
  proof_size_limit?: Anonymize<I35p85j063s0il>;
  ref_time_usage?: Anonymize<I35p85j063s0il>;
  proof_size_usage?: Anonymize<I35p85j063s0il>;
};
export type I370s3chedlj9o = ResultPayload<
  Anonymize<Ie3rl25flint9v>,
  Anonymize<I9sdjnqgsnrang>
>;
export type Ie3rl25flint9v = {
  exit_reason: Anonymize<Iag9iovb9j5ijo>;
  value: FixedSizeBinary<20>;
  used_gas: Anonymize<I8mgv59to1hjie>;
  weight_info?: Anonymize<Ib72ii9bshc8f5>;
  logs: Anonymize<Ids7ng2qsv7snu>;
};
export type Ifogockjiq4b3 = Anonymize<Idi27giun0mb9q> | undefined;
export type I2r0n4gcrs974b = Anonymize<Idud3fdh64aqp9> | undefined;
export type Ie6kgk6f04rsvk = Anonymize<Ie7atdsih6q14b> | undefined;
export type Ibkook56hopvp8 = [
  Anonymize<Ifogockjiq4b3>,
  Anonymize<I2r0n4gcrs974b>,
  Anonymize<Ie6kgk6f04rsvk>,
];
export type I45rl58hfs7m0h = [
  Anonymize<Ifogockjiq4b3>,
  Anonymize<Ie6kgk6f04rsvk>,
];
export {};
