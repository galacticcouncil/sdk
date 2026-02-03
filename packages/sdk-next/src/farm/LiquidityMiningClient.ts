import { Papi } from '../api';
import { Binary, Enum } from 'polkadot-api';

export class LiquidityMiningClient extends Papi {
  protected omnipoolAssetIds: string[] = [];

  async getOraclePrice(orderedAssets: [number, number]) {
    const query = this.api.query.EmaOracle.Oracles;
    const value = await query.getValue(
      Binary.fromText('omnipool'),
      orderedAssets,
      Enum('TenMinutes')
    );
    return value;
  }

  async getRelayBlockNumber() {
    const query = this.api.query.ParachainSystem.ValidationData;
    const value = await query.getValue();
    return value?.relay_parent_number;
  }

  async getAllOmnipooFarms() {
    const query = this.api.query.OmnipoolWarehouseLM.ActiveYieldFarm;
    const entries = query.getEntries();
    return entries;
  }

  async getOmnipooFarms(id: number) {
    const query = this.api.query.OmnipoolWarehouseLM.ActiveYieldFarm;
    const entries = query.getEntries(id);
    return entries;
  }

  async getOmnipoolGlobalFarm(id: number) {
    const query = this.api.query.OmnipoolWarehouseLM.GlobalFarm;
    const value = query.getValue(id, { at: 'best' });
    return value;
  }

  async getOmnipoolYieldFarm(
    id: number,
    globalFarmId: number,
    yieldFarmId: number
  ) {
    const query = this.api.query.OmnipoolWarehouseLM.YieldFarm;
    const value = query.getValue(id, globalFarmId, yieldFarmId, { at: 'best' });
    return value;
  }

  async getAllIsolatedFarms() {
    const query = this.api.query.XYKWarehouseLM.ActiveYieldFarm;
    const entries = query.getEntries();
    return entries;
  }

  async getIsolatedFarms(id: string) {
    const query = this.api.query.XYKWarehouseLM.ActiveYieldFarm;
    const entries = query.getEntries(id);
    return entries;
  }

  async getIsolatedGlobalFarm(id: number) {
    const query = this.api.query.XYKWarehouseLM.GlobalFarm;
    const value = query.getValue(id, { at: 'best' });
    return value;
  }

  async getIsolatedYieldFarm(
    id: string,
    globalFarmId: number,
    yieldFarmId: number
  ) {
    const query = this.api.query.XYKWarehouseLM.YieldFarm;
    const value = query.getValue(id, globalFarmId, yieldFarmId, { at: 'best' });
    return value;
  }

  async getAsset(id: number) {
    const query = this.api.query.AssetRegistry.Assets;
    const value = query.getValue(id);
    return value;
  }
}
