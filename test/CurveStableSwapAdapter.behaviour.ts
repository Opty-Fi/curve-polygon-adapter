import { expect } from "chai";
import { BigNumber } from "ethers";
import hre from "hardhat";
import { ICurve2StableSwap, ICurve3StableSwap } from "../typechain";
import { PoolItem } from "./types";
import { setTokenBalanceInStorage } from "./utils";

const nTokens: {
  [key: string]: string;
} = {
  "0x445FE580eF8d70FF569aB36e80c647af338db351": "3",
  "0xC2d95EEF97Ec6C17551d45e77B590dc1F9117C67": "2",
};

export function shouldBehaveLikeCurveStableSwapAdapter(token: string, pool: PoolItem): void {
  it.only(`${token}, pool address : ${pool.pool}, lpToken address : ${pool.lpToken}`, async function () {
    // underlying token instance
    const underlyingTokenInstance = await hre.ethers.getContractAt("ERC20", pool.tokens[0]);
    // underlying token decimals
    const underlyingTokenDecimals = await underlyingTokenInstance.decimals();
    // stable swap's pool instance
    const stableSwap3Instance = <ICurve3StableSwap>await hre.ethers.getContractAt("ICurve3StableSwap", pool.pool);
    const stableSwap2Instance = <ICurve2StableSwap>await hre.ethers.getContractAt("ICurve2StableSwap", pool.pool);

    // const stableSwapInstance = hre.ethers.getContractAt("ICurve2StableSwap",pool.pool)
    // lpToken instance
    const lpTokenInstance = await hre.ethers.getContractAt("ERC20", pool.lpToken);
    // lpToken decimals
    const lpTokenDecimals = await lpTokenInstance.decimals();

    // fund the testDefiAdapter with underlying tokens
    await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForStableSwap.address, "1");
    const balanceOfUnderlyingTokenInTestDefiAdapter = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForStableSwap.address,
    );
    // 1. Deposit All underlying tokens
    let calculatedlpTokenAmount: BigNumber = BigNumber.from(0);
    if (nTokens[pool.pool] == "3" && pool.tokenIndexes && pool.tokenIndexes[0] == "0") {
      calculatedlpTokenAmount = await stableSwap3Instance.calc_token_amount(
        [balanceOfUnderlyingTokenInTestDefiAdapter, 0, 0],
        true,
      );
    } else if (nTokens[pool.pool] == "3" && pool.tokenIndexes && pool.tokenIndexes[0] == "1") {
      calculatedlpTokenAmount = await stableSwap3Instance.calc_token_amount(
        [0, balanceOfUnderlyingTokenInTestDefiAdapter, 0],
        true,
      );
    } else if (nTokens[pool.pool] == "3" && pool.tokenIndexes && pool.tokenIndexes[0] == "2") {
      calculatedlpTokenAmount = await stableSwap3Instance.calc_token_amount(
        [0, 0, balanceOfUnderlyingTokenInTestDefiAdapter],
        true,
      );
    } else if (nTokens[pool.pool] == "2" && pool.tokenIndexes && pool.tokenIndexes[0] == "0") {
      calculatedlpTokenAmount = await stableSwap2Instance.calc_token_amount(
        [balanceOfUnderlyingTokenInTestDefiAdapter, 0],
        true,
      );
    } else if (nTokens[pool.pool] == "2" && pool.tokenIndexes && pool.tokenIndexes[0] == "1") {
      calculatedlpTokenAmount = await stableSwap2Instance.calc_token_amount(
        [0, balanceOfUnderlyingTokenInTestDefiAdapter],
        true,
      );
    }
    await this.testDeFiAdapterForStableSwap.testGetDepositSomeCodes(
      underlyingTokenInstance.address,
      pool.pool,
      this.curveStableSwapAdapter.address,
      balanceOfUnderlyingTokenInTestDefiAdapter,
    );
    // 1.1 assert whether lptoken balance is as expected or not after deposit
    const actuallpTokenBalance = await lpTokenInstance.balanceOf(this.testDeFiAdapterForStableSwap.address);
    expect(actuallpTokenBalance).to.gte(calculatedlpTokenAmount.mul(95).div(100));
    const expectedlpTokenBalance = await this.curveStableSwapAdapter.getLiquidityPoolTokenBalance(
      this.testDeFiAdapterForStableSwap.address,
      hre.ethers.constants.AddressZero,
      pool.pool,
    );
    expect(expectedlpTokenBalance).to.eq(actuallpTokenBalance);
    // 6. Withdraw all lpToken balance
    await this.testDeFiAdapterForStableSwap.testGetWithdrawSomeCodes(
      pool.tokens[0],
      pool.pool,
      this.curveStableSwapAdapter.address,
      actuallpTokenBalance,
    );
    const actuallpTokenBalanceAfterWithdraw = await this.curveStableSwapAdapter.getLiquidityPoolTokenBalance(
      this.testDeFiAdapterForStableSwap.address,
      hre.ethers.constants.AddressZero,
      pool.pool,
    );
    expect(actuallpTokenBalanceAfterWithdraw).to.eq(0);
  });
}
