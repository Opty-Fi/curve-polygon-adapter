import { PoolItem } from "./types";

export function shouldBehaveLikeCurveGaugeAdapter(token: string, pool: PoolItem): void {
  it(`${token}, gauge address : ${pool.pool}, lpToken address : ${pool.lpToken}`, function () {
    console.log(`${token}`);
  });
}
