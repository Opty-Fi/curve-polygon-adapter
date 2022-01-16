import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { ICurveGauge } from "../typechain";
import { GaugeItem } from "./types";
import { setTokenBalanceInStorage } from "./utils";

export function shouldBehaveLikeCurveGaugeAdapter(token: string, pool: GaugeItem): void {
  it(`${token}, gauge address : ${pool.pool}, lpToken address : ${pool.lpToken}`, async function () {
    // underlying token instance
    const underlyingTokenInstance = await hre.ethers.getContractAt("ERC20", pool.tokens[0]);
    const underlyingTokenDecimals = await underlyingTokenInstance.decimals();

    // gauge instance
    const gaugeInstance = <ICurveGauge>await hre.ethers.getContractAt("ICurveGauge", pool.pool);

    // fund the testDefiAdapter with underlying tokens
    await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForGauge.address, "200");

    const balanceOfUnderlyingTokenInTestDefiAdapter = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForGauge.address,
    );

    // 1. lpToken
    expect(await this.curveGaugeAdapter.getLiquidityPoolToken(ethers.constants.AddressZero, pool.pool)).to.eq(
      pool.lpToken,
    );
    // 2. Pool value
    const actualPoolValue = await this.curveGaugeAdapter.getPoolValue(pool.pool, ethers.constants.AddressZero);
    const expectedPoolValue = await gaugeInstance.totalSupply();
    expect(actualPoolValue).to.eq(expectedPoolValue);
    // ============================================
    const calculatedlpTokenAmount: BigNumber = balanceOfUnderlyingTokenInTestDefiAdapter;
    // ===========================================================
    // 3. calculate amount in lp token
    expect(
      await this.curveGaugeAdapter.calculateAmountInLPToken(
        underlyingTokenInstance.address,
        pool.pool,
        balanceOfUnderlyingTokenInTestDefiAdapter,
      ),
    ).to.eq(calculatedlpTokenAmount);
    // 4. Deposit All underlying tokens
    await this.testDeFiAdapterForGauge.testGetDepositSomeCodes(
      underlyingTokenInstance.address,
      pool.pool,
      this.curveGaugeAdapter.address,
      balanceOfUnderlyingTokenInTestDefiAdapter,
    );
    // 5. assert whether lptoken balance is as expected or not after deposit
    const actuallpTokenBalance = await gaugeInstance.balanceOf(this.testDeFiAdapterForGauge.address);
    expect(actuallpTokenBalance).to.eq(calculatedlpTokenAmount);
    const expectedlpTokenBalance = await this.curveGaugeAdapter.getLiquidityPoolTokenBalance(
      this.testDeFiAdapterForGauge.address,
      hre.ethers.constants.AddressZero,
      pool.pool,
    );
    expect(expectedlpTokenBalance).to.eq(actuallpTokenBalance);
    // 6. all amount in token
    const expectedAllAmountInToken = actuallpTokenBalance;
    const actualAllAmountInToken = await this.curveGaugeAdapter.getAllAmountInToken(
      this.testDeFiAdapterForGauge.address,
      underlyingTokenInstance.address,
      pool.pool,
    );
    expect(actualAllAmountInToken).to.eq(expectedAllAmountInToken);

    // 7. some amount in token
    const expectedSomeAmountInToken = actuallpTokenBalance.mul(25).div(100);
    const actualSomeAmountInToken = await this.curveGaugeAdapter.getSomeAmountInToken(
      underlyingTokenInstance.address,
      pool.pool,
      actuallpTokenBalance.mul(25).div(100),
    );
    expect(actualSomeAmountInToken).to.eq(expectedSomeAmountInToken);

    // 8. calculateRedeemableLPTokenAmount
    expect(
      await this.curveGaugeAdapter.calculateRedeemableLPTokenAmount(
        this.testDeFiAdapterForGauge.address,
        underlyingTokenInstance.address,
        pool.pool,
        actualAllAmountInToken,
      ),
    ).to.eq(actualAllAmountInToken);

    // 9. isRedeemableAmountSufficient
    expect(
      await this.curveGaugeAdapter.isRedeemableAmountSufficient(
        this.testDeFiAdapterForGauge.address,
        underlyingTokenInstance.address,
        pool.pool,
        actualAllAmountInToken,
      ),
    ).to.be.true;
    expect(
      await this.curveGaugeAdapter.isRedeemableAmountSufficient(
        this.testDeFiAdapterForGauge.address,
        underlyingTokenInstance.address,
        pool.pool,
        actualSomeAmountInToken,
      ),
    ).to.be.true;
    expect(
      await this.curveGaugeAdapter.isRedeemableAmountSufficient(
        this.testDeFiAdapterForGauge.address,
        underlyingTokenInstance.address,
        pool.pool,
        actualAllAmountInToken.add(BigNumber.from("3").pow(underlyingTokenDecimals)),
      ),
    ).to.be.false;
    // 10. getRewardToken
    // expect(await this.curveStableSwapAdapter.getRewardToken(ethers.constants.AddressZero)).to.eq(
    //   ethers.constants.AddressZero,
    // );
    // 11. canStake
    expect(await this.curveGaugeAdapter.canStake(ethers.constants.AddressZero)).to.false;
    // 12. Withdraw all lpToken balance
    const calculatedUnderlyingTokenBalanceAfterWithdraw = await gaugeInstance.balanceOf(
      this.testDeFiAdapterForGauge.address,
    );
    await this.testDeFiAdapterForGauge.testGetWithdrawSomeCodes(
      pool.tokens[0],
      pool.pool,
      this.curveGaugeAdapter.address,
      actuallpTokenBalance,
    );
    const actuallpTokenBalanceAfterWithdraw = await this.curveGaugeAdapter.getLiquidityPoolTokenBalance(
      this.testDeFiAdapterForGauge.address,
      hre.ethers.constants.AddressZero,
      pool.pool,
    );
    expect(actuallpTokenBalanceAfterWithdraw).to.eq(0);
    const actualUnderlyingTokenBalanceAfterWithdraw = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForGauge.address,
    );
    expect(actualUnderlyingTokenBalanceAfterWithdraw).eq(calculatedUnderlyingTokenBalanceAfterWithdraw);
  });
}
