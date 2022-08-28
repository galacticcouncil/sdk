import { RouteSuggester } from "../../src/router/suggester";
import { PoolBase, PoolType } from "../../src/types";
import { xykPools } from "../data/xykPools";

describe("Router suggester for XYK pool", () => {
  let pools: PoolBase[];
  let suggester: RouteSuggester;

  beforeEach(() => {
    pools = xykPools;
    suggester = new RouteSuggester();
  });

  it("Should return suggested hops from token 1 to 2", () => {
    expect(pools).toBeDefined();
    const result = suggester.getProposals("1", "2", pools);
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
