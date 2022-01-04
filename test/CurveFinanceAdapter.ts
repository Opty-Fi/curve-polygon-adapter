import { shouldBehaveLikeCurveStableSwapAdapter } from "./CurveStableSwapAdapter.behaviour";
import { shouldBehaveLikeCurveFactoryMetapoolAdapter } from "./CurveFactoryMetapoolAdapter.behaviour";
import { shouldBehaveLikeCurveGaugeAdapter } from "./CurveGaugeAdapter.behaviour";
import { shouldBehaveLikeCurveCryptoAdapter } from "./CurveATriCryptoSwapAdapter.behaviour";
import CurveAdapterParticulars from "@optyfi/defi-legos/polygon/curve";

const {
  CurveStableSwap: { pools: CurveStableSwapPools },
  CurveATriCryptoSwap: { pools: CurveATriCryptoSwapPools },
  CurveATriCryptoZap: { pools: CurveATriCryptoZapPools },
  CurveGauge: { pools: CurveGauges },
  CurveFactoryMetaPools: { pools: CurveFactoryMetaPools },
} = CurveAdapterParticulars;

describe("Unit tests", function () {
  this.beforeAll(async function () {
    console.log(
      CurveATriCryptoSwapPools,
      CurveStableSwapPools,
      CurveATriCryptoZapPools,
      CurveFactoryMetaPools,
      CurveGauges,
    );
  });
  describe("CurveStableSwapAdapter", function () {
    shouldBehaveLikeCurveStableSwapAdapter();
  });
  describe("CurveFactoryMetaPoolAdapter", function () {
    shouldBehaveLikeCurveFactoryMetapoolAdapter();
  });
  describe("CurveGaugeAdapter", function () {
    shouldBehaveLikeCurveGaugeAdapter();
  });
  describe("CurveCryptoAdapter", function () {
    shouldBehaveLikeCurveCryptoAdapter();
  });
});
