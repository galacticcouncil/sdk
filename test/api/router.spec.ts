import { TradeRouter } from "../../src/api/router";
import { PoolBase, PoolService, PoolType, Router } from "../../src/types";
import { xykPools } from "../data/xykPools";

describe("Router", () => {
  let poolService: PoolService;
  let router: Router;

  class MockedPoolService implements PoolService {
    getPools(): Promise<PoolBase[]> {
      return Promise.resolve(xykPools);
    }
  }

  beforeEach(() => {
    poolService = new MockedPoolService();
    router = new TradeRouter(poolService);
  });

  it("Should return suggested hops from token 1 to 2 for given XYK pool", async () => {
    expect(poolService).toBeDefined();
    expect(router).toBeDefined();
    const result = await router.getAllPaths("1", "2");
    expect(result).toStrictEqual([
      [
        {
          poolId: "bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3",
          poolType: PoolType.XYK,
          tokenIn: "1",
          tokenOut: "2",
          fee: "0.3",
        },
      ],
      [
        {
          poolId: "bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ",
          poolType: PoolType.XYK,
          tokenIn: "1",
          tokenOut: "0",
          fee: "0.3",
        },
        {
          poolId: "bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq",
          poolType: PoolType.XYK,
          tokenIn: "0",
          tokenOut: "2",
          fee: "0.3",
        },
      ],
    ]);
  });
});
