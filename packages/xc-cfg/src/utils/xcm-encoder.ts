import { Binary } from 'polkadot-api';
import {
  XcmVersionedXcm,
  XcmVersionedAssetId,
  XcmVersionedLocation,
  XcmV4Instruction,
  XcmV3MultiassetFungibility,
  XcmV3Junctions,
  XcmV3Junction,
  XcmV3JunctionNetworkId,
  XcmV3WeightLimit,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
} from '@galacticcouncil/descriptors';

import type { EncodingMode } from '../builders/extrinsics/xcm/types';

/**
 * Helper to create enum { type, value } objects for unsafe API
 */
const Enum = (type: string, value?: any) => ({ type, value });

/**
 * XCM Encoder utility for converting plain JavaScript objects
 * to PAPI-compatible encoded structures.
 *
 * @remarks
 * This class provides two sets of encoding methods:
 *
 * **For Typed API (chains with descriptors like Hydration):**
 * - Use methods without suffix: `encodeXcm()`, `encodeAssetId()`, etc.
 * - These use chain-specific type descriptors from @galacticcouncil/descriptors
 * - Use when calling typed API methods on chains with custom descriptors
 *
 * **For Unsafe API (chains like Asset Hub):**
 * - Use methods with "ForUnsafeApi" suffix: `encodeXcmForUnsafeApi()`, etc.
 * - These return generic { type, value } enum structures
 * - Use when calling `getUnsafeApi()` or working with chains without descriptors
 *
 * @example
 * // Typed API (Hydration)
 * const versionedXcm = XcmEncoder.encodeXcm(xcm);
 * await api.apis.XcmPaymentApi.query_xcm_weight(versionedXcm);
 *
 * @example
 * // Unsafe API (Asset Hub)
 * const versionedXcm = XcmEncoder.encodeXcmForUnsafeApi(xcm);
 * await unsafeApi.apis.XcmPaymentApi.query_xcm_weight(versionedXcm);
 */
export class XcmEncoder {
  // ============================================================================
  // PUBLIC API - TYPED (for chains with descriptors)
  // ============================================================================

  static encodeXcm(plainXcm: any) {
    const instructions = plainXcm.V4 || plainXcm.v4;
    if (!instructions) {
      throw new Error('XCM must have V4 or v4 key with instructions array');
    }
    return XcmVersionedXcm.V4(
      this.encodeInstructionsCore(instructions, 'typed')
    );
  }

  static encodeAssetId(location: any) {
    return XcmVersionedAssetId.V4(this.encodeLocationCore(location, 'typed'));
  }

  static encodeVersionedLocation(location: any) {
    const rawLocation = location.V4 || location;
    return XcmVersionedLocation.V4(
      this.encodeLocationCore(rawLocation, 'typed')
    );
  }

  static encodeLocation(location: any) {
    return this.encodeLocationCore(location, 'typed');
  }

  // ============================================================================
  // PUBLIC API - UNSAFE (for chains using unsafe API)
  // ============================================================================

  /**
   * Encodes XCM for unsafe API calls.
   * Returns generic { type, value } enum structures instead of typed descriptors.
   */
  static encodeXcmForUnsafeApi(plainXcm: any) {
    const instructions = plainXcm.V4 || plainXcm.v4;
    if (!instructions) {
      throw new Error('XCM must have V4 or v4 key with instructions array');
    }
    return Enum('V4', this.encodeInstructionsCore(instructions, 'unsafe'));
  }

  /**
   * Encodes asset ID for unsafe API calls.
   */
  static encodeAssetIdForUnsafeApi(location: any) {
    return Enum('V4', this.encodeLocationCore(location, 'unsafe'));
  }

  /**
   * Encodes versioned location for unsafe API calls.
   */
  static encodeVersionedLocationForUnsafeApi(location: any) {
    const rawLocation = location.V4 || location;
    return Enum('V4', this.encodeLocationCore(rawLocation, 'unsafe'));
  }

  static encodeLocationForUnsafeApi(location: any) {
    return this.encodeLocationCore(location, 'unsafe');
  }

  // ============================================================================
  // CORE UNIFIED ENCODING METHODS
  // ============================================================================

  private static encodeInstructionsCore(
    instructions: any[],
    mode: EncodingMode
  ): any[] {
    return instructions.map((instr) => this.encodeInstructionCore(instr, mode));
  }

  private static encodeLocationCore(location: any, mode: EncodingMode): any {
    const parents = location.parents || 0;
    const interior = location.interior;

    // Handle 'Here' location
    if (!interior || interior === 'Here' || interior.Here !== undefined) {
      return {
        parents,
        interior: mode === 'typed' ? XcmV3Junctions.Here() : Enum('Here'),
      };
    }

    const [type, data] = Object.entries(interior)[0] as [string, any];
    if (type === 'Here') {
      return {
        parents,
        interior: mode === 'typed' ? XcmV3Junctions.Here() : Enum('Here'),
      };
    }

    // Encode junctions
    const junctions = (Array.isArray(data) ? data : [data]).map((j) =>
      this.encodeJunctionCore(j, mode)
    );

    // Build interior based on mode
    let encodedInterior: any;
    if (mode === 'typed') {
      const junctionsMap = {
        X1: () => XcmV3Junctions.X1(junctions[0]),
        X2: () => XcmV3Junctions.X2(junctions as any),
        X3: () => XcmV3Junctions.X3(junctions as any),
        X4: () => XcmV3Junctions.X4(junctions as any),
      };
      if (!junctionsMap[type as keyof typeof junctionsMap]) {
        throw new Error(`Unknown junction type: ${type}`);
      }
      encodedInterior = junctionsMap[type as keyof typeof junctionsMap]();
    } else {
      // unsafe mode
      if (type === 'X1') {
        encodedInterior = Enum('X1', junctions[0]);
      } else if (['X2', 'X3', 'X4'].includes(type)) {
        encodedInterior = Enum(type, junctions);
      } else {
        throw new Error(`Unknown junction type: ${type}`);
      }
    }

    return { parents, interior: encodedInterior };
  }

  private static encodeJunctionCore(junction: any, mode: EncodingMode): any {
    const [type, data] = Object.entries(junction)[0] as [string, any];

    switch (type) {
      case 'Parachain':
        return mode === 'typed'
          ? XcmV3Junction.Parachain(data)
          : Enum('Parachain', data);

      case 'PalletInstance':
        return mode === 'typed'
          ? XcmV3Junction.PalletInstance(data)
          : Enum('PalletInstance', data);

      case 'GeneralIndex':
        return mode === 'typed'
          ? XcmV3Junction.GeneralIndex(BigInt(data))
          : Enum('GeneralIndex', BigInt(data));

      case 'GlobalConsensus':
        return mode === 'typed'
          ? XcmV3Junction.GlobalConsensus(this.encodeNetworkIdCore(data, mode))
          : Enum('GlobalConsensus', this.encodeNetworkIdCore(data, mode));

      case 'AccountId32':
        return mode === 'typed'
          ? XcmV3Junction.AccountId32({
              network: data.network
                ? this.encodeNetworkIdCore(data.network, mode)
                : undefined,
              id:
                typeof data.id === 'string' ? Binary.fromHex(data.id) : data.id,
            })
          : Enum('AccountId32', {
              network: data.network
                ? this.encodeNetworkIdCore(data.network, mode)
                : undefined,
              id:
                typeof data.id === 'string' ? Binary.fromHex(data.id) : data.id,
            });

      case 'AccountKey20':
        return mode === 'typed'
          ? XcmV3Junction.AccountKey20({
              network: data.network
                ? this.encodeNetworkIdCore(data.network, mode)
                : undefined,
              key:
                typeof data.key === 'string'
                  ? Binary.fromHex(data.key)
                  : data.key,
            })
          : Enum('AccountKey20', {
              network: data.network
                ? this.encodeNetworkIdCore(data.network, mode)
                : undefined,
              key:
                typeof data.key === 'string'
                  ? Binary.fromHex(data.key)
                  : data.key,
            });

      case 'GeneralKey':
        return mode === 'typed'
          ? XcmV3Junction.GeneralKey({
              length: data.length,
              data:
                typeof data.data === 'string'
                  ? Binary.fromHex(data.data)
                  : data.data,
            })
          : Enum('GeneralKey', {
              length: data.length,
              data:
                typeof data.data === 'string'
                  ? Binary.fromHex(data.data)
                  : data.data,
            });

      default:
        throw new Error(`Unknown junction type: ${type}`);
    }
  }

  private static encodeNetworkIdCore(networkId: any, mode: EncodingMode): any {
    if (typeof networkId === 'string') {
      const simpleNetworks = ['Polkadot', 'Kusama', 'Westend', 'Rococo'];
      if (simpleNetworks.includes(networkId)) {
        if (mode === 'typed') {
          const networkMap = {
            Polkadot: XcmV3JunctionNetworkId.Polkadot,
            Kusama: XcmV3JunctionNetworkId.Kusama,
            Westend: XcmV3JunctionNetworkId.Westend,
            Rococo: XcmV3JunctionNetworkId.Rococo,
          };
          return networkMap[networkId as keyof typeof networkMap]();
        }
        return Enum(networkId);
      }
      return networkId;
    }

    if (networkId.Ethereum) {
      return mode === 'typed'
        ? XcmV3JunctionNetworkId.Ethereum({
            chain_id: BigInt(networkId.Ethereum.chain_id),
          })
        : Enum('Ethereum', { chain_id: BigInt(networkId.Ethereum.chain_id) });
    }

    if (networkId.Polkadot !== undefined)
      return mode === 'typed'
        ? XcmV3JunctionNetworkId.Polkadot()
        : Enum('Polkadot');
    if (networkId.Kusama !== undefined)
      return mode === 'typed'
        ? XcmV3JunctionNetworkId.Kusama()
        : Enum('Kusama');
    if (networkId.Westend !== undefined)
      return mode === 'typed'
        ? XcmV3JunctionNetworkId.Westend()
        : Enum('Westend');
    if (networkId.Rococo !== undefined)
      return mode === 'typed'
        ? XcmV3JunctionNetworkId.Rococo()
        : Enum('Rococo');

    if (networkId.ByGenesis) {
      const genesis =
        typeof networkId.ByGenesis === 'string'
          ? Binary.fromHex(networkId.ByGenesis)
          : networkId.ByGenesis;
      return mode === 'typed'
        ? XcmV3JunctionNetworkId.ByGenesis(genesis)
        : Enum('ByGenesis', genesis);
    }

    return networkId;
  }

  private static encodeAssetCore(asset: any, mode: EncodingMode) {
    return {
      id: this.encodeLocationCore(asset.id, mode),
      fun:
        mode === 'typed'
          ? XcmV3MultiassetFungibility.Fungible(BigInt(asset.fun.Fungible))
          : Enum('Fungible', BigInt(asset.fun.Fungible)),
    };
  }

  private static encodeAssetFilterCore(filter: any, mode: EncodingMode): any {
    if (filter.Wild) {
      if (filter.Wild.AllCounted !== undefined) {
        return mode === 'typed'
          ? XcmV4AssetAssetFilter.Wild(
              XcmV4AssetWildAsset.AllCounted(filter.Wild.AllCounted)
            )
          : Enum('Wild', Enum('AllCounted', filter.Wild.AllCounted));
      }
      if (filter.Wild.All !== undefined || filter.Wild === 'All') {
        return mode === 'typed'
          ? XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.All())
          : Enum('Wild', Enum('All'));
      }
      if (filter.Wild.AllOf) {
        return mode === 'typed'
          ? XcmV4AssetAssetFilter.Wild(
              XcmV4AssetWildAsset.AllOf({
                id: this.encodeLocationCore(filter.Wild.AllOf.id, mode),
                fun: filter.Wild.AllOf.fun,
              })
            )
          : Enum(
              'Wild',
              Enum('AllOf', {
                id: this.encodeLocationCore(filter.Wild.AllOf.id, mode),
                fun: filter.Wild.AllOf.fun,
              })
            );
      }
      if (filter.Wild.AllOfCounted) {
        return mode === 'typed'
          ? XcmV4AssetAssetFilter.Wild(
              XcmV4AssetWildAsset.AllOfCounted({
                id: this.encodeLocationCore(filter.Wild.AllOfCounted.id, mode),
                fun: filter.Wild.AllOfCounted.fun,
                count: filter.Wild.AllOfCounted.count,
              })
            )
          : Enum(
              'Wild',
              Enum('AllOfCounted', {
                id: this.encodeLocationCore(filter.Wild.AllOfCounted.id, mode),
                fun: filter.Wild.AllOfCounted.fun,
                count: filter.Wild.AllOfCounted.count,
              })
            );
      }
    }

    if (filter.Definite) {
      return mode === 'typed'
        ? XcmV4AssetAssetFilter.Definite(
            filter.Definite.map((asset: any) =>
              this.encodeAssetCore(asset, mode)
            )
          )
        : Enum(
            'Definite',
            filter.Definite.map((asset: any) =>
              this.encodeAssetCore(asset, mode)
            )
          );
    }

    return filter;
  }

  private static encodeWeightLimitCore(
    weightLimit: any,
    mode: EncodingMode
  ): any {
    if (weightLimit === 'Unlimited') {
      return mode === 'typed'
        ? XcmV3WeightLimit.Unlimited()
        : Enum('Unlimited');
    }
    if (typeof weightLimit === 'object' && weightLimit.Limited) {
      const weight = {
        ref_time: BigInt(weightLimit.Limited.ref_time),
        proof_size: BigInt(weightLimit.Limited.proof_size),
      };
      return mode === 'typed'
        ? XcmV3WeightLimit.Limited(weight)
        : Enum('Limited', weight);
    }
    return weightLimit;
  }

  private static encodeInstructionCore(instr: any, mode: EncodingMode): any {
    const [type, data] = Object.entries(instr)[0] as [string, any];

    // Helper to build instruction based on mode
    const buildInstruction = (name: string, value?: any) => {
      if (mode === 'typed') {
        const builder = (XcmV4Instruction as any)[name];
        return value === undefined ? builder() : builder(value);
      }
      return value === undefined ? Enum(name) : Enum(name, value);
    };

    switch (type) {
      case 'ReserveAssetDeposited':
      case 'ReceiveTeleportedAsset':
      case 'WithdrawAsset':
        return buildInstruction(
          type,
          data.map((a: any) => this.encodeAssetCore(a, mode))
        );

      case 'ClearOrigin':
      case 'ClearTopic':
      case 'RefundSurplus':
      case 'ClearError':
        return buildInstruction(type);

      case 'BuyExecution':
        return buildInstruction('BuyExecution', {
          fees: this.encodeAssetCore(data.fees, mode),
          weight_limit: this.encodeWeightLimitCore(data.weightLimit, mode),
        });

      case 'DepositAsset':
        return buildInstruction('DepositAsset', {
          assets: this.encodeAssetFilterCore(data.assets, mode),
          beneficiary: this.encodeLocationCore(data.beneficiary, mode),
        });

      case 'DepositReserveAsset':
        return buildInstruction('DepositReserveAsset', {
          assets: this.encodeAssetFilterCore(data.assets, mode),
          dest: this.encodeLocationCore(data.dest, mode),
          xcm: this.encodeInstructionsCore(data.xcm, mode),
        });

      case 'InitiateReserveWithdraw':
        return buildInstruction('InitiateReserveWithdraw', {
          assets: this.encodeAssetFilterCore(data.assets, mode),
          reserve: this.encodeLocationCore(data.reserve, mode),
          xcm: this.encodeInstructionsCore(data.xcm, mode),
        });

      case 'TransferAsset':
        return buildInstruction('TransferAsset', {
          assets: data.assets.map((a: any) => this.encodeAssetCore(a, mode)),
          beneficiary: this.encodeLocationCore(data.beneficiary, mode),
        });

      case 'TransferReserveAsset':
        return buildInstruction('TransferReserveAsset', {
          assets: data.assets.map((a: any) => this.encodeAssetCore(a, mode)),
          dest: this.encodeLocationCore(data.dest, mode),
          xcm: this.encodeInstructionsCore(data.xcm, mode),
        });

      case 'SetTopic':
        return buildInstruction('SetTopic', Binary.fromHex(data));

      case 'SetErrorHandler':
      case 'SetAppendix':
        return buildInstruction(type, this.encodeInstructionsCore(data, mode));

      case 'UnpaidExecution':
        return buildInstruction('UnpaidExecution', {
          weight_limit: this.encodeWeightLimitCore(data.weightLimit, mode),
          check_origin: data.checkOrigin
            ? this.encodeLocationCore(data.checkOrigin, mode)
            : undefined,
        });

      case 'Transact':
        return buildInstruction('Transact', {
          origin_kind: data.originKind,
          require_weight_at_most: {
            ref_time: BigInt(data.requireWeightAtMost.refTime),
            proof_size: BigInt(data.requireWeightAtMost.proofSize),
          },
          call: data.call,
        });

      case 'InitiateTeleport':
        return buildInstruction('InitiateTeleport', {
          assets: this.encodeAssetFilterCore(data.assets, mode),
          dest: this.encodeLocationCore(data.dest, mode),
          xcm: this.encodeInstructionsCore(data.xcm, mode),
        });

      default:
        throw new Error(`Unknown XCM instruction type: '${type}'`);
    }
  }
}
