import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Fixture, MockContract } from "ethereum-waffle";
import { Artifact } from "hardhat/types";
import { CurveGaugeAdapter, CurveStableSwapAdapter, TestDeFiAdapter } from "../typechain";
import { CurveATriCryptoSwapAdapter } from "../typechain/CurveATriCryptoSwapAdapter";
import { CurveATriCryptoZapAdapter } from "../typechain/CurveATriCryptoZapAdapter";
import { CurveMetapoolFactoryAdapter } from "../typechain/CurveMetapoolFactoryAdapter";
import { ICurveL2Factory } from "../typechain/ICurveL2Factory";

export interface Signers {
  admin: SignerWithAddress;
  owner: SignerWithAddress;
  deployer: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  charlie: SignerWithAddress;
  dave: SignerWithAddress;
  eve: SignerWithAddress;
  operator: SignerWithAddress;
  riskOperator: SignerWithAddress;
}

export interface PoolItem {
  pool: string;
  lpToken: string;
  stakingVault?: string;
  rewardTokens?: string[];
  tokens: string[];
  swap?: string;
  deprecated?: boolean;
  tokenIndexes: string[];
}

export interface GaugeItem {
  pool: string;
  lpToken: string;
  rewardTokens?: string[];
  tokens: string[];
}

export interface LiquidityPool {
  [name: string]: PoolItem;
}

export interface GaugePool {
  [name: string]: GaugeItem;
}

declare module "mocha" {
  export interface Context {
    curveCryptoATriSwapAdapter: CurveATriCryptoSwapAdapter;
    curveCryptoATriZapAdapter: CurveATriCryptoZapAdapter;
    curveGaugeAdapter: CurveGaugeAdapter;
    curveFactoryMetapoolAdapter: CurveMetapoolFactoryAdapter;
    curveStableSwapAdapter: CurveStableSwapAdapter;
    testDeFiAdapterArtifact: Artifact;
    testDeFiAdapterForATriCryptoSwap: TestDeFiAdapter;
    testDeFiAdapterForATriCryptoZap: TestDeFiAdapter;
    testDeFiAdapterForGauge: TestDeFiAdapter;
    testDeFiAdapterForMetapoolFactory: TestDeFiAdapter;
    testDeFiAdapterForStableSwap: TestDeFiAdapter;
    curveL2MetapoolFactory: ICurveL2Factory;
    mockRegistry: MockContract;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}
