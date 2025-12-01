import { Binary } from 'polkadot-api';
import {
  XcmV3Junctions,
  XcmV3Junction,
  XcmV3JunctionNetworkId,
} from '@galacticcouncil/descriptors';

/**
 * LocationEncoder converts untyped xcmLocation configs to PAPI descriptor constructors
 *
 * Example:
 * ```typescript
 * const locationConfig = {
 *   parents: 1,
 *   interior: {
 *     type: 'X1',
 *     value: { type: 'Parachain', value: 1000 }
 *   }
 * };
 *
 * const encoded = LocationEncoder.encode(locationConfig);
 * // Returns:
 * // {
 * //   parents: 1,
 * //   interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(1000))
 * // }
 * ```
 */
export class LocationEncoder {
  /**
   * Encode location from {type, value} config to PAPI descriptors
   *
   * @param location - Plain object from chain.getAssetXcmLocation(asset)
   * @returns Location with PAPI descriptor constructors
   */
  static encode(location: any) {
    const { parents, interior } = location;

    if (!interior || interior === 'Here' || interior.type === 'Here') {
      return {
        parents,
        interior: XcmV3Junctions.Here(),
      };
    }

    const junctionType = interior.type; // 'X1', 'X2', 'X3', or 'X4'
    const junctionValue = interior.value;

    // Handle X1 (single junction - not array)
    if (junctionType === 'X1') {
      const junction = this.encodeJunction(junctionValue);
      return {
        parents,
        interior: XcmV3Junctions.X1(junction),
      };
    }

    // Handle X2, X3, X4 (array of junctions)
    const junctions = junctionValue.map((j: any) => this.encodeJunction(j));

    return {
      parents,
      interior: this.encodeInterior(junctionType, junctions),
    };
  }

  private static encodeInterior(type: string, junctions: any[]) {
    switch (type) {
      case 'X2':
        return XcmV3Junctions.X2(junctions as [any, any]);
      case 'X3':
        return XcmV3Junctions.X3(junctions as [any, any, any]);
      case 'X4':
        return XcmV3Junctions.X4(junctions as [any, any, any, any]);
      case 'X5':
        return XcmV3Junctions.X5(junctions as [any, any, any, any, any]);
      case 'X6':
        return XcmV3Junctions.X6(
          junctions as [any, any, any, any, any, any]
        );
      case 'X7':
        return XcmV3Junctions.X7(
          junctions as [any, any, any, any, any, any, any]
        );
      case 'X8':
        return XcmV3Junctions.X8(
          junctions as [any, any, any, any, any, any, any, any]
        );
      default:
        throw new Error(`Unknown junction type: ${type}`);
    }
  }

  private static encodeJunction(junction: any) {
    const { type, value } = junction;

    switch (type) {
      case 'Parachain':
        return XcmV3Junction.Parachain(value);

      case 'AccountId32':
        return XcmV3Junction.AccountId32({
          id:
            typeof value.id === 'string' ? Binary.fromHex(value.id) : value.id,
          network: value.network
            ? this.encodeNetworkId(value.network)
            : undefined,
        });

      case 'AccountKey20':
        return XcmV3Junction.AccountKey20({
          key:
            typeof value.key === 'string'
              ? Binary.fromHex(value.key)
              : value.key,
          network: value.network
            ? this.encodeNetworkId(value.network)
            : undefined,
        });

      case 'GlobalConsensus':
        return XcmV3Junction.GlobalConsensus(this.encodeNetworkId(value));

      case 'GeneralKey':
        return XcmV3Junction.GeneralKey({
          length: value.length,
          data:
            typeof value.data === 'string'
              ? Binary.fromHex(value.data)
              : value.data,
        });

      case 'GeneralIndex':
        return XcmV3Junction.GeneralIndex(BigInt(value));

      case 'PalletInstance':
        return XcmV3Junction.PalletInstance(value);

      default:
        throw new Error(`Unknown junction type: ${type}`);
    }
  }

  private static encodeNetworkId(network: any) {
    // Handle simple network names (string format)
    if (typeof network === 'string') {
      switch (network) {
        case 'Polkadot':
          return XcmV3JunctionNetworkId.Polkadot();
        case 'Kusama':
          return XcmV3JunctionNetworkId.Kusama();
        case 'Westend':
          return XcmV3JunctionNetworkId.Westend();
        case 'Rococo':
          return XcmV3JunctionNetworkId.Rococo();
        default:
          throw new Error(`Unknown network: ${network}`);
      }
    }

    // Handle {type, value} format
    if (network.type) {
      switch (network.type) {
        case 'Polkadot':
          return XcmV3JunctionNetworkId.Polkadot();
        case 'Kusama':
          return XcmV3JunctionNetworkId.Kusama();
        case 'Westend':
          return XcmV3JunctionNetworkId.Westend();
        case 'Rococo':
          return XcmV3JunctionNetworkId.Rococo();

        case 'Ethereum':
          return XcmV3JunctionNetworkId.Ethereum({
            chain_id: BigInt(network.value.chain_id),
          });

        case 'ByGenesis':
          return XcmV3JunctionNetworkId.ByGenesis(
            typeof network.value === 'string'
              ? Binary.fromHex(network.value)
              : network.value
          );

        default:
          throw new Error(`Unknown network type: ${network.type}`);
      }
    }

    throw new Error(`Cannot encode network: ${JSON.stringify(network)}`);
  }
}
