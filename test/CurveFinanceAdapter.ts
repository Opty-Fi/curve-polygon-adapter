import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// pool data
import CurveAdapterParticulars from "@optyfi/defi-legos/polygon/curve";
// behaviour test files
import { shouldBehaveLikeCurveStableSwapAdapter } from "./CurveStableSwapAdapter.behaviour";
import { shouldBehaveLikeCurveFactoryMetapoolAdapter } from "./CurveFactoryMetapoolAdapter.behaviour";
import { shouldBehaveLikeCurveGaugeAdapter } from "./CurveGaugeAdapter.behaviour";
import { shouldBehaveLikeCurveATriCryptoSwapAdapter } from "./CurveATriCryptoSwapAdapter.behaviour";
import { shouldBehaveLikeCurveATriCryptoZapAdapter } from "./CurveATriCryptoZapAdapter.behaviour";
// types
import { LiquidityPool, PoolItem, Signers } from "./types";
import { CurveGaugeAdapter, CurveStableSwapAdapter, TestDeFiAdapter } from "../typechain";
import { CurveMetapoolFactoryAdapter } from "../typechain/CurveMetapoolFactoryAdapter";
import { CurveATriCryptoSwapAdapter } from "../typechain/CurveATriCryptoSwapAdapter";
import { CurveATriCryptoZapAdapter } from "../typechain/CurveATriCryptoZapAdapter";

const {
  CurveATriCryptoSwap: { pools: CurveATriCryptoSwapPools },
  CurveATriCryptoZap: { pools: CurveATriCryptoZapPools },
  CurveStableSwap: { pools: CurveStableSwapPools },
  CurveGauge: { pools: CurveGauges },
  CurveFactoryMetaPools: { pools: CurveFactoryMetaPools },
} = CurveAdapterParticulars;

describe("Curve on Polygon", function () {
  before(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.deployer = signers[2];
    this.signers.operator = signers[8];
    this.signers.riskOperator = signers[9];
    const registryArtifact: Artifact = await hre.artifacts.readArtifact("IAdapterRegistryBase");
    this.mockRegistry = await hre.waffle.deployMockContract(this.signers.deployer, registryArtifact.abi);
    await this.mockRegistry.mock.getOperator.returns(this.signers.operator.address);
    await this.mockRegistry.mock.getRiskOperator.returns(this.signers.riskOperator.address);
    this.testDeFiAdapterArtifact = await hre.artifacts.readArtifact("TestDeFiAdapter");
  });
  describe("CurveStableSwapAdapter", function () {
    before(async function () {
      const curveStableAdapterArtifact: Artifact = await hre.artifacts.readArtifact("CurveStableSwapAdapter");
      this.curveStableSwapAdapter = <CurveStableSwapAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, curveStableAdapterArtifact, [this.mockRegistry.address])
      );
      this.testDeFiAdapterForStableSwap = <TestDeFiAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, this.testDeFiAdapterArtifact)
      );
    });
    Object.keys(CurveStableSwapPools).map((token: string) => {
      const poolItem: PoolItem = (CurveStableSwapPools as LiquidityPool)[token];
      if (poolItem.tokens.length == 1) {
        shouldBehaveLikeCurveStableSwapAdapter(token, poolItem);
      }
    });
  });
  describe("CurveFactoryMetaPoolAdapter", function () {
    before(async function () {
      const curveFactoryMetapoolArtifact: Artifact = await hre.artifacts.readArtifact("CurveMetapoolFactoryAdapter");
      this.curveFactoryMetapoolAdapter = <CurveMetapoolFactoryAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, curveFactoryMetapoolArtifact, [
          this.mockRegistry.address,
        ])
      );
      this.testDeFiAdapterForStableSwap = <TestDeFiAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, this.testDeFiAdapterArtifact)
      );
    });
    Object.keys(CurveFactoryMetaPools).map((token: string) => {
      const poolItem: PoolItem = (CurveFactoryMetaPools as LiquidityPool)[token];
      if (poolItem.tokens.length == 1) {
        shouldBehaveLikeCurveFactoryMetapoolAdapter(token, poolItem);
      }
    });
  });
  describe("CurveGaugeAdapter", function () {
    before(async function () {
      const curveGaugeArtifact: Artifact = await hre.artifacts.readArtifact("CurveGaugeAdapter");
      this.curveGaugeAdapter = <CurveGaugeAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, curveGaugeArtifact, [this.mockRegistry.address])
      );
      this.testDeFiAdapterForStableSwap = <TestDeFiAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, this.testDeFiAdapterArtifact)
      );
    });
    Object.keys(CurveGauges).map((token: string) => {
      const poolItem: PoolItem = (CurveGauges as LiquidityPool)[token];
      if (poolItem.tokens.length == 1) {
        shouldBehaveLikeCurveGaugeAdapter(token, poolItem);
      }
    });
  });
  describe("CurveATriCryptoSwapAdapter", function () {
    before(async function () {
      const curveATriCryptoSwapArtifact: Artifact = await hre.artifacts.readArtifact("CurveATriCryptoSwapAdapter");
      this.curveATriCryptoSwapAdapter = <CurveATriCryptoSwapAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, curveATriCryptoSwapArtifact, [this.mockRegistry.address])
      );
      this.testDeFiAdapterForStableSwap = <TestDeFiAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, this.testDeFiAdapterArtifact)
      );
    });
    Object.keys(CurveATriCryptoSwapPools).map((token: string) => {
      const poolItem: PoolItem = (CurveATriCryptoSwapPools as LiquidityPool)[token];
      if (poolItem.tokens.length == 1) {
        shouldBehaveLikeCurveATriCryptoSwapAdapter(token, poolItem);
      }
    });
  });
  describe("CurveATriCryptoZapAdapter", function () {
    before(async function () {
      const curveATriCryptoZapArtifact: Artifact = await hre.artifacts.readArtifact("CurveATriCryptoZapAdapter");
      this.curveATriCryptoZapAdapter = <CurveATriCryptoZapAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, curveATriCryptoZapArtifact, [this.mockRegistry.address])
      );
      this.testDeFiAdapterForStableSwap = <TestDeFiAdapter>(
        await hre.waffle.deployContract(this.signers.deployer, this.testDeFiAdapterArtifact)
      );
    });
    Object.keys(CurveATriCryptoZapPools).map((token: string) => {
      const poolItem: PoolItem = (CurveATriCryptoZapPools as LiquidityPool)[token];
      if (poolItem.tokens.length == 1) {
        shouldBehaveLikeCurveATriCryptoZapAdapter(token, poolItem);
      }
    });
  });
});
