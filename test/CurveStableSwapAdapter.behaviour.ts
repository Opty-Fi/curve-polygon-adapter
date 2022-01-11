import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { ICurve2StableSwap, ICurve3StableSwap } from "../typechain";
import { PoolItem } from "./types";
import { setTokenBalanceInStorage } from "./utils";

const nTokens: {
  [key: string]: string;
} = {
  "0x445FE580eF8d70FF569aB36e80c647af338db351": "3",
  "0xC2d95EEF97Ec6C17551d45e77B590dc1F9117C67": "2",
};

export const stableSwappedWrappedTokens = [
  "0x27F8D03b3a2196956ED754baDc28D73be8830A6e",
  "0x1a13F4Ca1d028320A707D99520AbFefca3998b7F",
  "0x60D55F02A771d515e077c9C2403a1ef324885CeC",
  "0x5c2ed810328349100A66B82b78a1791B101C9D61",
  "0xDBf31dF14B66535aF65AaC99C32e9eA844e14501",
];

export function shouldBehaveLikeCurveStableSwapAdapter(token: string, pool: PoolItem): void {
  it.only(`${token}, pool address : ${pool.pool}, lpToken address : ${pool.lpToken}`, async function () {
    // underlying token instance
    const underlyingTokenInstance = await hre.ethers.getContractAt("ERC20", pool.tokens[0]);
    // underlying token decimals
    // const underlyingTokenDecimals = await underlyingTokenInstance.decimals();
    // stable swap's pool instance
    const stableSwap3Instance = <ICurve3StableSwap>await hre.ethers.getContractAt("ICurve3StableSwap", pool.pool);
    const stableSwap2Instance = <ICurve2StableSwap>await hre.ethers.getContractAt("ICurve2StableSwap", pool.pool);

    // const stableSwapInstance = hre.ethers.getContractAt("ICurve2StableSwap",pool.pool)
    // lpToken instance
    const lpTokenInstance = await hre.ethers.getContractAt("ERC20", pool.lpToken);
    // lpToken decimals
    // const lpTokenDecimals = await lpTokenInstance.decimals();

    // fund the testDefiAdapter with underlying tokens
    if (pool.pool == "0xC2d95EEF97Ec6C17551d45e77B590dc1F9117C67") {
      // btc pool
      await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForStableSwap.address, "0.001");
    } else {
      await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForStableSwap.address, "2000");
    }
    const balanceOfUnderlyingTokenInTestDefiAdapter = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForStableSwap.address,
    );
    // 0.1 setWrappedTokens

    // 0.2 setTokenIndexes

    // 0.3 setNoZeroAllowanceAllowed

    // 0.4 setCalcWithdrawOneCoinNotSame

    // 1. lpToken
    expect(await this.curveStableSwapAdapter.getLiquidityPoolToken(ethers.constants.AddressZero, pool.pool)).to.eq(
      pool.lpToken,
    );
    // 2. Pool value
    const actualPoolValue = await this.curveStableSwapAdapter.getPoolValue(pool.pool, ethers.constants.AddressZero);
    const _virtualPrice = await stableSwap2Instance.get_virtual_price();
    const _totalSupply = await lpTokenInstance.totalSupply();
    const expectedPoolValue = await _virtualPrice.mul(_totalSupply).div(BigNumber.from("10").pow("18"));
    expect(actualPoolValue).to.eq(expectedPoolValue);
    // 3. Deposit All underlying tokens
    let calculatedlpTokenAmount: BigNumber = BigNumber.from(0);
    if (nTokens[pool.pool] == "3" && pool.tokenIndexes[0] == "0") {
      calculatedlpTokenAmount = await stableSwap3Instance.calc_token_amount(
        [balanceOfUnderlyingTokenInTestDefiAdapter, 0, 0],
        true,
      );
    } else if (nTokens[pool.pool] == "3" && pool.tokenIndexes[0] == "1") {
      calculatedlpTokenAmount = await stableSwap3Instance.calc_token_amount(
        [0, balanceOfUnderlyingTokenInTestDefiAdapter, 0],
        true,
      );
    } else if (nTokens[pool.pool] == "3" && pool.tokenIndexes[0] == "2") {
      calculatedlpTokenAmount = await stableSwap3Instance.calc_token_amount(
        [0, 0, balanceOfUnderlyingTokenInTestDefiAdapter],
        true,
      );
    } else if (nTokens[pool.pool] == "2" && pool.tokenIndexes[0] == "0") {
      calculatedlpTokenAmount = await stableSwap2Instance.calc_token_amount(
        [balanceOfUnderlyingTokenInTestDefiAdapter, 0],
        true,
      );
    } else if (nTokens[pool.pool] == "2" && pool.tokenIndexes[0] == "1") {
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
    // 4. assert whether lptoken balance is as expected or not after deposit
    const actuallpTokenBalance = await lpTokenInstance.balanceOf(this.testDeFiAdapterForStableSwap.address);
    expect(actuallpTokenBalance).to.gte(calculatedlpTokenAmount.mul(95).div(100));
    const expectedlpTokenBalance = await this.curveStableSwapAdapter.getLiquidityPoolTokenBalance(
      this.testDeFiAdapterForStableSwap.address,
      hre.ethers.constants.AddressZero,
      pool.pool,
    );
    expect(expectedlpTokenBalance).to.eq(actuallpTokenBalance);

    // 5. all amount in token

    // 6. some amount in token

    // 7. calculate amount in lp token

    // 8. calculateRedeemableLPTokenAmount

    // 9. isRedeemableAmountSufficient

    // 10. getRewardToken
    expect(await this.curveStableSwapAdapter.getRewardToken(ethers.constants.AddressZero)).to.eq(
      ethers.constants.AddressZero,
    );

    // 11. canStake
    expect(await this.curveStableSwapAdapter.canStake(ethers.constants.AddressZero)).to.false;
    // 12.

    // 13. Withdraw all lpToken balance
    const calculatedUnderlyingTokenBalanceAfterWithdraw = await stableSwap3Instance.calc_withdraw_one_coin(
      actuallpTokenBalance,
      pool.tokenIndexes[0],
    );
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
    const actualUnderlyingTokenBalanceAfterWithdraw = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForStableSwap.address,
    );
    expect(actualUnderlyingTokenBalanceAfterWithdraw).gte(
      calculatedUnderlyingTokenBalanceAfterWithdraw.mul(95).div(100),
    );
  });
}

export function shouldHaveUnderlyingTokensLikeCurveStableSwapAdapter(pool: PoolItem): void {
  it.only(`underlyingtokens test, pool address : ${pool.pool}, lpToken address : ${pool.lpToken}`, async function () {
    expect(
      await this.curveStableSwapAdapter.getUnderlyingTokens(pool.pool, ethers.constants.AddressZero),
    ).to.have.members(pool.tokens);
  });
}
