import { shouldBehaveLikeCurveDepositPoolAdapter } from "./CurveDepositPoolAdapter.behaviour";
import { shouldBehaveLikeCurveFactoryMetapoolAdapter } from "./CurveFactoryMetapoolAdapter.behaviour";
import { shouldBehaveLikeCurveGaugeAdapter } from "./CurveGaugeAdapter.behaviour";
import { shouldBehaveLikeCurveCryptoAdapter } from "./CurveCryptoAdapter.behaviour";
import CurveAdapterParticulars from "@optyfi/defi-legos/polygon/curve";

const {
  pools: {
    CurveCrypto: CurveCryptoPools,
    CurveDeposit: CurveDepositPools,
    CurveFactoryMetaPools,
    CurveGauge: CurveGauges,
  },
} = CurveAdapterParticulars;

console.log(CurveCryptoPools, CurveDepositPools, CurveFactoryMetaPools, CurveGauges);

describe("Unit tests", function () {
  describe("CurveDepositPoolAdapter", function () {
    shouldBehaveLikeCurveDepositPoolAdapter();
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
