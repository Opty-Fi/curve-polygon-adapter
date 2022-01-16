import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { legos } from "@optyfi/defi-legos/polygon";
import { getAddress } from "ethers/lib/utils";
import { ICurve2StableSwap, ICurve3StableSwap } from "../typechain";
import { PoolItem } from "./types";
import { setTokenBalanceInStorage } from "./utils";

const nTokens: {
  [key: string]: string;
} = {
  [`${legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool}`]: "3",
  [`${legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool}`]: "2",
};

export const stableSwappedWrappedTokens = [
  legos.tokens.AMDAI,
  legos.tokens.AMUSDC,
  legos.tokens.AMUSDT,
  legos.tokens.AMWBTC,
];

export function shouldBehaveLikeCurveStableSwapAdapter(token: string, pool: PoolItem): void {
  it(`${token}, pool address : ${pool.pool}, lpToken address : ${pool.lpToken}`, async function () {
    // underlying token instance
    const underlyingTokenInstance = await hre.ethers.getContractAt("ERC20", pool.tokens[0]);
    // underlying token decimals
    const underlyingTokenDecimals = await underlyingTokenInstance.decimals();

    // stable swap's pool instance
    const stableSwap3Instance = <ICurve3StableSwap>await hre.ethers.getContractAt("ICurve3StableSwap", pool.pool);
    const stableSwap2Instance = <ICurve2StableSwap>await hre.ethers.getContractAt("ICurve2StableSwap", pool.pool);

    // lpToken instance
    const lpTokenInstance = await hre.ethers.getContractAt("ERC20", pool.lpToken);

    // fund the testDefiAdapter with underlying tokens
    if (pool.pool == legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool) {
      // btc pool
      await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForStableSwap.address, "0.001");
    } else {
      await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForStableSwap.address, "2000");
    }
    const balanceOfUnderlyingTokenInTestDefiAdapter = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForStableSwap.address,
    );

    // 1. lpToken
    expect(await this.curveStableSwapAdapter.getLiquidityPoolToken(ethers.constants.AddressZero, pool.pool)).to.eq(
      pool.lpToken,
    );
    // 2. Pool value
    const actualPoolValue = await this.curveStableSwapAdapter.getPoolValue(pool.pool, ethers.constants.AddressZero);
    const _virtualPrice = await stableSwap2Instance.get_virtual_price();
    const _totalSupply = await lpTokenInstance.totalSupply();
    const expectedPoolValue = _virtualPrice.mul(_totalSupply).div(BigNumber.from("10").pow("18"));
    expect(actualPoolValue).to.eq(expectedPoolValue);
    // ============================================
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
    // ===========================================================
    // 3. calculate amount in lp token
    expect(
      await this.curveStableSwapAdapter.calculateAmountInLPToken(
        underlyingTokenInstance.address,
        pool.pool,
        balanceOfUnderlyingTokenInTestDefiAdapter,
      ),
    ).to.eq(calculatedlpTokenAmount);
    // 4. Deposit All underlying tokens
    await this.testDeFiAdapterForStableSwap.testGetDepositSomeCodes(
      underlyingTokenInstance.address,
      pool.pool,
      this.curveStableSwapAdapter.address,
      balanceOfUnderlyingTokenInTestDefiAdapter,
    );
    // 5. assert whether lptoken balance is as expected or not after deposit
    const actuallpTokenBalance = await lpTokenInstance.balanceOf(this.testDeFiAdapterForStableSwap.address);
    expect(actuallpTokenBalance).to.gte(calculatedlpTokenAmount.mul(95).div(100));
    const expectedlpTokenBalance = await this.curveStableSwapAdapter.getLiquidityPoolTokenBalance(
      this.testDeFiAdapterForStableSwap.address,
      hre.ethers.constants.AddressZero,
      pool.pool,
    );
    expect(expectedlpTokenBalance).to.eq(actuallpTokenBalance);

    // 6. all amount in token
    const expectedAllAmountInToken = await stableSwap2Instance.calc_withdraw_one_coin(
      actuallpTokenBalance,
      pool.tokenIndexes[0],
    );
    const actualAllAmountInToken = await this.curveStableSwapAdapter.getAllAmountInToken(
      this.testDeFiAdapterForStableSwap.address,
      underlyingTokenInstance.address,
      pool.pool,
    );
    expect(actualAllAmountInToken).to.eq(expectedAllAmountInToken);
    // 7. some amount in token
    const expectedSomeAmountInToken = await stableSwap2Instance.calc_withdraw_one_coin(
      actuallpTokenBalance.mul(25).div(100),
      pool.tokenIndexes[0],
    );
    const actualSomeAmountInToken = await this.curveStableSwapAdapter.getSomeAmountInToken(
      underlyingTokenInstance.address,
      pool.pool,
      actuallpTokenBalance.mul(25).div(100),
    );
    expect(actualSomeAmountInToken).to.eq(expectedSomeAmountInToken);

    // 8. calculateRedeemableLPTokenAmount
    expect(
      await this.curveStableSwapAdapter.calculateRedeemableLPTokenAmount(
        this.testDeFiAdapterForStableSwap.address,
        underlyingTokenInstance.address,
        pool.pool,
        actualAllAmountInToken,
      ),
    ).to.eq(BigNumber.from(actuallpTokenBalance.mul(actualAllAmountInToken).div(actualAllAmountInToken)).add("1"));

    // 9. isRedeemableAmountSufficient
    expect(
      await this.curveStableSwapAdapter.isRedeemableAmountSufficient(
        this.testDeFiAdapterForStableSwap.address,
        underlyingTokenInstance.address,
        pool.pool,
        actualAllAmountInToken,
      ),
    ).to.be.true;
    expect(
      await this.curveStableSwapAdapter.isRedeemableAmountSufficient(
        this.testDeFiAdapterForStableSwap.address,
        underlyingTokenInstance.address,
        pool.pool,
        actualSomeAmountInToken,
      ),
    ).to.be.true;
    expect(
      await this.curveStableSwapAdapter.isRedeemableAmountSufficient(
        this.testDeFiAdapterForStableSwap.address,
        underlyingTokenInstance.address,
        pool.pool,
        actualAllAmountInToken.add(BigNumber.from("3").pow(underlyingTokenDecimals)),
      ),
    ).to.be.false;
    // 10. getRewardToken
    expect(await this.curveStableSwapAdapter.getRewardToken(ethers.constants.AddressZero)).to.eq(
      ethers.constants.AddressZero,
    );

    // 11. canStake
    expect(await this.curveStableSwapAdapter.canStake(ethers.constants.AddressZero)).to.false;
    // 12. Withdraw all lpToken balance
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
  it(`underlyingtokens test, pool address : ${pool.pool}, lpToken address : ${pool.lpToken}`, async function () {
    expect(
      await this.curveStableSwapAdapter.getUnderlyingTokens(pool.pool, ethers.constants.AddressZero),
    ).to.have.members(pool.tokens);
  });
}

export function shouldInitializeVariablesLikeCurveStableSwapAdapter(): void {
  it("assert constructor initialized logic", async function () {
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        legos.tokens.DAI,
      ),
    ).to.eq(0);
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        legos.tokens.USDC,
      ),
    ).to.eq(1);
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        legos.tokens.USDT,
      ),
    ).to.eq(2);
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
        legos.tokens.WBTC,
      ),
    ).to.eq(0);
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
        legos.tokens.RENBTC,
      ),
    ).to.eq(1);
    expect(
      await this.curveStableSwapAdapter.nTokens(legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool),
    ).to.eq(3);
    expect(
      await this.curveStableSwapAdapter.nTokens(legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool),
    ).to.eq(2);

    expect(
      await this.curveStableSwapAdapter.underlyingCoins(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        0,
      ),
    ).to.eq(legos.tokens.DAI);
    expect(
      await this.curveStableSwapAdapter.underlyingCoins(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        1,
      ),
    ).to.eq(getAddress(legos.tokens.USDC));
    expect(
      await this.curveStableSwapAdapter.underlyingCoins(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        2,
      ),
    ).to.eq(getAddress(legos.tokens.USDT));
    expect(
      await this.curveStableSwapAdapter.underlyingCoins(
        legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
        0,
      ),
    ).to.eq(legos.tokens.WBTC);
    expect(
      await this.curveStableSwapAdapter.underlyingCoins(
        legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
        1,
      ),
    ).to.eq(legos.tokens.RENBTC);
  });
}

export function shouldSetTokenIndexesLikeCurveStableSwapAdapter(): void {
  it("non-operator cannot setTokenIndexes", async function () {
    await expect(
      this.curveStableSwapAdapter
        .connect(this.signers.alice)
        .setTokenIndexes(
          [
            legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
            legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
            legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
            legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
            legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
          ],
          [legos.tokens.DAI, legos.tokens.USDC, legos.tokens.USDT, legos.tokens.WBTC, legos.tokens.RENBTC],
          [0, 1, 2, 0, 1],
        ),
    ).to.revertedWith("caller is not the operator");
  });
  it("operator can setTokenIndexes", async function () {
    await this.curveStableSwapAdapter
      .connect(this.signers.operator)
      .setTokenIndexes(
        [
          legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
          legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
          legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
          legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
          legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
        ],
        [legos.tokens.DAI, legos.tokens.USDC, legos.tokens.USDT, legos.tokens.WBTC, legos.tokens.RENBTC],
        [0, 1, 2, 0, 1],
      );
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        legos.tokens.DAI,
      ),
    ).to.eq(0);
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        legos.tokens.USDC,
      ),
    ).to.eq(1);
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["dai+usdc+usdt_am3Crv"].pool,
        legos.tokens.USDT,
      ),
    ).to.eq(2);
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
        legos.tokens.WBTC,
      ),
    ).to.eq(0);
    expect(
      await this.curveStableSwapAdapter.tokenIndexes(
        legos.curve.CurveStableSwap.pools["wbtc+renbtc_btcCrv"].pool,
        legos.tokens.RENBTC,
      ),
    ).to.eq(1);
  });
}

export function shouldSetNoZeroAllowanceAllowedLikeCurveStableSwapAdapter(): void {
  it("non-operator cannot setNoZeroAllowanceAllowed", async function () {
    await expect(
      this.curveStableSwapAdapter
        .connect(this.signers.alice)
        .setNoZeroAllowanceAllowed([getAddress("0xc4a25b0113ffb29f706f75a188dc6d9a41f10849")], [true]),
    ).to.revertedWith("caller is not the operator");
  });
  it("operator can setNoZeroAllowanceAllowed", async function () {
    await this.curveStableSwapAdapter
      .connect(this.signers.operator)
      .setNoZeroAllowanceAllowed([getAddress("0xc4a25b0113ffb29f706f75a188dc6d9a41f10849")], [true]);
    expect(
      await this.curveStableSwapAdapter.noZeroAllowanceAllowed(
        getAddress("0xc4a25b0113ffb29f706f75a188dc6d9a41f10849"),
      ),
    ).to.be.true;
  });
}

export function shouldSetCalcWithdrawOneCoinNotSameLikeCurveStableSwapAdapter(): void {
  it("non-operator cannot setCalcWithdrawOneCoinNotSame", async function () {
    await expect(
      this.curveStableSwapAdapter
        .connect(this.signers.alice)
        .setCalcWithdrawOneCoinNotSame([getAddress("0xc4a25b0113ffb29f706f75a188dc6d9a41f10849")], [true]),
    ).to.revertedWith("caller is not the operator");
  });
  it("operator can setCalcWithdrawOneCoinNotSame", async function () {
    await this.curveStableSwapAdapter
      .connect(this.signers.operator)
      .setCalcWithdrawOneCoinNotSame([getAddress("0xc4a25b0113ffb29f706f75a188dc6d9a41f10849")], [true]);
    expect(
      await this.curveStableSwapAdapter.calcWithdrawOneCoinNotSame(
        getAddress("0xc4a25b0113ffb29f706f75a188dc6d9a41f10849"),
      ),
    ).to.be.true;
  });
}
