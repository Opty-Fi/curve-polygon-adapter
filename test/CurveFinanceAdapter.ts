import CurveAdapterParticulars from "@optyfi/defi-legos/polygon/curve";
import { shouldBehaveLikeCurveStableSwapAdapter } from "./CurveStableSwapAdapter.behaviour";
import { shouldBehaveLikeCurveFactoryMetapoolAdapter } from "./CurveFactoryMetapoolAdapter.behaviour";
import { shouldBehaveLikeCurveGaugeAdapter } from "./CurveGaugeAdapter.behaviour";
import { shouldBehaveLikeCurveATriCryptoSwapAdapter } from "./CurveATriCryptoSwapAdapter.behaviour";

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
  describe("CurveATriCryptoSwapAdapter", function () {
    shouldBehaveLikeCurveATriCryptoSwapAdapter();
  });
});
