import { shouldBehaveLikeCurveDepositPoolAdapter } from "./CurveDepositPoolAdapter.behaviour";
import { shouldBehaveLikeCurveFactoryMetapoolAdapter } from "./CurveFactoryMetapoolAdapter.behaviour";
import { shouldBehaveLikeCurveGaugeAdapter } from "./CurveGaugeAdapter.behaviour";
import { shouldBehaveLikeCurveCryptoAdapter } from "./CurveCryptoAdapter.behaviour";

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
