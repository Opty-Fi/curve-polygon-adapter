import CurveAdapterParticulars from "@optyfi/defi-legos/polygon/curve";
import { shouldBehaveLikeCurveStableSwapAdapter } from "./CurveStableSwapAdapter.behaviour";
import { shouldBehaveLikeCurveFactoryMetapoolAdapter } from "./CurveFactoryMetapoolAdapter.behaviour";
import { shouldBehaveLikeCurveGaugeAdapter } from "./CurveGaugeAdapter.behaviour";
import { shouldBehaveLikeCurveCryptoSwapAdapter } from "./CurveCryptoSwapAdapter.behaviour";
import { shouldBehaveLikeCurveCryptoZapAdapter } from "./CurveCryptoZapAdapter.behaviour";

const {
  CurveStableSwap: { pools: CurveStableSwapPools },
  CurveATriCryptoSwap: { pools: CurveATriCryptoSwapPools },
  CurveATriCryptoZap: { pools: CurveATriCryptoZapPools },
  CurveGauge: { pools: CurveGauges },
  CurveFactoryMetaPools: { pools: CurveFactoryMetaPools },
} = CurveAdapterParticulars;

describe("Unit tests", function () {
  this.beforeAll(function () {
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
  describe("CurveCryptoSwapAdapter", function () {
    shouldBehaveLikeCurveCryptoSwapAdapter();
  });
  describe("CurveCryptoZapAdapter", function () {
    shouldBehaveLikeCurveCryptoZapAdapter();
  });
});
