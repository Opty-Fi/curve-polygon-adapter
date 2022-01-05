import { PoolItem } from "./types";

export function shouldBehaveLikeCurveFactoryMetapoolAdapter(token: string, pool: PoolItem): void {
  it(`${token}, metapool address : ${pool.pool}, lpToken address : ${pool.lpToken}`, function () {
    console.log(`${token}`);
  });
}
