import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Fixture, MockContract } from "ethereum-waffle";
import { Artifact } from "hardhat/types";
import { CurveGaugeAdapter, CurveStableSwapAdapter, IAdapterRegistryBase, TestDeFiAdapter } from "../typechain";
import { CurveATriCryptoSwapAdapter } from "../typechain/CurveATriCryptoSwapAdapter";
import { CurveATriCryptoZapAdapter } from "../typechain/CurveATriCryptoZapAdapter";
import { CurveMetapoolFactoryAdapter } from "../typechain/CurveMetapoolFactoryAdapter";

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
}

export interface LiquidityPool {
  [name: string]: PoolItem;
}

declare module "mocha" {
  export interface Context {
    curveCryptoATriSwapAdapter: CurveATriCryptoSwapAdapter;
    curveCryptoATriZapAdapter: CurveATriCryptoZapAdapter;
    curveGaugeAdapter: CurveGaugeAdapter;
    curveMetapoolFactoryAdapter: CurveMetapoolFactoryAdapter;
    curveStableSwapAdapter: CurveStableSwapAdapter;
    testDeFiAdapterArtifact: Artifact;
    testDeFiAdapterForATriCryptoSwap: TestDeFiAdapter;
    testDeFiAdapterForATriCryptoZap: TestDeFiAdapter;
    testDeFiAdapterForGauge: TestDeFiAdapter;
    testDeFiAdapterForMetapoolFactory: TestDeFiAdapter;
    testDeFiAdapterForStableSwap: TestDeFiAdapter;
    mockRegistry: MockContract;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}
