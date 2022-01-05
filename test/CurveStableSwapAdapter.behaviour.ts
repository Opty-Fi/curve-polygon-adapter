import { PoolItem } from "./types";

export function shouldBehaveLikeCurveStableSwapAdapter(token: string, pool: PoolItem): void {
  it(`${token}, pool address : ${pool.pool}, lpToken address : ${pool.lpToken}`, function () {
    console.log(`${token}`);
  });
}
