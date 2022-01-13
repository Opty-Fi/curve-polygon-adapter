import { GaugeItem } from "./types";

export function shouldBehaveLikeCurveGaugeAdapter(token: string, pool: GaugeItem): void {
  it(`${token}, gauge address : ${pool.pool}, lpToken address : ${pool.lpToken}`, function () {
    console.log(`${token}`);
  });
}
