import { PoolBase, PoolService } from '../../src/types';
import { xykPools } from '../data/xykPools';

export class MockXykPoolService implements PoolService {
  getPools(): Promise<PoolBase[]> {
    return Promise.resolve(xykPools);
  }
}
