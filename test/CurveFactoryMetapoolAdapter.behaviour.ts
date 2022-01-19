import { legos } from "@optyfi/defi-legos/polygon";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { getAddress } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import BN from "bignumber.js";
import { ICurve2StableSwapMetapoolFactory } from "../typechain";
import { ICurve3StableSwapMetapoolFactory } from "../typechain/ICurve3StableSwapMetapoolFactory";
import { ICurve4StableSwapMetapoolFactory } from "../typechain/ICurve4StableSwapMetapoolFactory";
import { PoolItem } from "./types";
import { setTokenBalanceInStorage } from "./utils";

export function shouldBehaveLikeCurveFactoryMetapoolAdapter(token: string, pool: PoolItem): void {
  it(`${token}, metapool address : ${pool.pool}, lpToken address : ${pool.lpToken}`, async function () {
    // stable swap's pool instance
    const curve2StableSwapMetapoolFactoryInstance = <ICurve2StableSwapMetapoolFactory>(
      await hre.ethers.getContractAt("ICurve2StableSwapMetapoolFactory", pool.pool)
    );
    const _totalSupply = await curve2StableSwapMetapoolFactoryInstance.totalSupply();
    if (!_totalSupply.gt(BigNumber.from("0"))) {
      console.log(`Skipping ${token} as total Supply is zero`);
      this.skip();
    }
    // underlying token instance
    const underlyingTokenInstance = await hre.ethers.getContractAt("ERC20", pool.tokens[0]);
    // underlying token decimals
    const underlyingTokenDecimals = await underlyingTokenInstance.decimals();
    const _nTokens = await this.curveL2MetapoolFactory.get_n_coins(pool.pool);
    // stable swap's pool instance
    const curve3StableSwapMetapoolFactoryInstance = <ICurve3StableSwapMetapoolFactory>(
      await hre.ethers.getContractAt("ICurve3StableSwapMetapoolFactory", pool.pool)
    );
    const curve4StableSwapMetapoolFactoryInstance = <ICurve4StableSwapMetapoolFactory>(
      await hre.ethers.getContractAt("ICurve4StableSwapMetapoolFactory", pool.pool)
    );
    // lpToken instance
    const lpTokenInstance = await hre.ethers.getContractAt("ERC20", pool.lpToken);

    // fund the testDefiAdapter with underlying tokens
    if (getAddress(pool.tokens[0]) == getAddress(legos.tokens.MOUSD)) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x6e88b0b85f26fb5b207f68a2a4491a1cdf7b9279"],
      });
      await this.signers.alice.sendTransaction({
        to: "0x6e88b0b85f26fb5b207f68a2a4491a1cdf7b9279",
        value: BigNumber.from("10").mul(BigNumber.from("10").pow("18")),
      });
      const signer = await hre.ethers.getSigner("0x6e88b0b85f26fb5b207f68a2a4491a1cdf7b9279");
      await underlyingTokenInstance
        .connect(signer)
        .transfer(this.testDeFiAdapterForMetapoolFactory.address, "2000000000000000000000");
    } else {
      if (pool.tokens[0] == legos.tokens.LAMBO) {
        await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForMetapoolFactory.address, "2");
      } else if (
        pool.tokens[0] == legos.tokens.CRV ||
        pool.tokens[0] == legos.tokens.AMDAI ||
        pool.tokens[0] == legos.tokens.RENUSDC
      ) {
        await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForMetapoolFactory.address, "20");
      } else {
        await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForMetapoolFactory.address, "2000");
      }
    }

    const balanceOfUnderlyingTokenInTestDefiAdapter = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForMetapoolFactory.address,
    );

    // 1. lpToken
    expect(await this.curveFactoryMetapoolAdapter.getLiquidityPoolToken(ethers.constants.AddressZero, pool.pool)).to.eq(
      pool.lpToken,
    );
    // 2. Pool value
    let actualPoolValue = BigNumber.from("0");
    try {
      actualPoolValue = await this.curveFactoryMetapoolAdapter.getPoolValue(pool.pool, ethers.constants.AddressZero);
      const _virtualPrice = await curve2StableSwapMetapoolFactoryInstance.get_virtual_price();
      const expectedPoolValue = _virtualPrice.mul(_totalSupply).div(BigNumber.from("10").pow("18"));
      expect(actualPoolValue).to.eq(expectedPoolValue);
    } catch (error) {
      console.log(`Skipping ${token} as getPoolValue is throwing error`);
      this.skip();
    }

    // ============================================
    let calculatedlpTokenAmount: BigNumber = BigNumber.from(0);
    const _actualAmount: BigNumber = balanceOfUnderlyingTokenInTestDefiAdapter.mul(
      BigNumber.from("10").pow(BigNumber.from(18).sub(underlyingTokenDecimals)),
    );
    const _limit = new BN(actualPoolValue.mul(BigNumber.from("10000")).toString()).div(new BN("10000"));
    const _actualDepositAmount = _actualAmount.gt(BigNumber.from(_limit.toString()))
      ? _limit.div(new BN("10").pow(new BN("18").minus(new BN(underlyingTokenDecimals))))
      : balanceOfUnderlyingTokenInTestDefiAdapter;
    if (_nTokens.eq(BigNumber.from("3")) && pool.tokenIndexes[0] == "0") {
      calculatedlpTokenAmount = await curve3StableSwapMetapoolFactoryInstance.calc_token_amount(
        [_actualDepositAmount.toString(), 0, 0],
        true,
      );
    } else if (_nTokens.eq(BigNumber.from("3")) && pool.tokenIndexes[0] == "1") {
      calculatedlpTokenAmount = await curve3StableSwapMetapoolFactoryInstance.calc_token_amount(
        [0, _actualDepositAmount.toString(), 0],
        true,
      );
    } else if (_nTokens.eq(BigNumber.from("3")) && pool.tokenIndexes[0] == "2") {
      calculatedlpTokenAmount = await curve3StableSwapMetapoolFactoryInstance.calc_token_amount(
        [0, 0, _actualDepositAmount.toString()],
        true,
      );
    } else if (_nTokens.eq(BigNumber.from("2")) && pool.tokenIndexes[0] == "0") {
      calculatedlpTokenAmount = await curve2StableSwapMetapoolFactoryInstance.calc_token_amount(
        [_actualDepositAmount.toString(), 0],
        true,
      );
    } else if (_nTokens.eq(BigNumber.from("2")) && pool.tokenIndexes[0] == "1") {
      calculatedlpTokenAmount = await curve2StableSwapMetapoolFactoryInstance.calc_token_amount(
        [0, _actualDepositAmount.toString()],
        true,
      );
    } else if (_nTokens.eq(BigNumber.from("4")) && pool.tokenIndexes[0] == "0") {
      calculatedlpTokenAmount = await curve4StableSwapMetapoolFactoryInstance.calc_token_amount(
        [_actualDepositAmount.toString(), 0, 0, 0],
        true,
      );
    } else if (_nTokens.eq(BigNumber.from("4")) && pool.tokenIndexes[0] == "1") {
      calculatedlpTokenAmount = await curve4StableSwapMetapoolFactoryInstance.calc_token_amount(
        [0, _actualDepositAmount.toString(), 0, 0],
        true,
      );
    } else if (_nTokens.eq(BigNumber.from("4")) && pool.tokenIndexes[0] == "2") {
      calculatedlpTokenAmount = await curve4StableSwapMetapoolFactoryInstance.calc_token_amount(
        [0, 0, _actualDepositAmount.toString(), 0],
        true,
      );
    } else if (_nTokens.eq(BigNumber.from("4")) && pool.tokenIndexes[0] == "3") {
      calculatedlpTokenAmount = await curve4StableSwapMetapoolFactoryInstance.calc_token_amount(
        [0, 0, 0, _actualDepositAmount.toString()],
        true,
      );
    }
    // ===========================================================
    // 3. calculate amount in lp token
    expect(
      await this.curveFactoryMetapoolAdapter.calculateAmountInLPToken(
        underlyingTokenInstance.address,
        pool.pool,
        _actualDepositAmount.toString(),
      ),
    ).to.eq(calculatedlpTokenAmount);
    // 4. Deposit All underlying tokens
    await this.testDeFiAdapterForMetapoolFactory.testGetDepositSomeCodes(
      underlyingTokenInstance.address,
      pool.pool,
      this.curveFactoryMetapoolAdapter.address,
      balanceOfUnderlyingTokenInTestDefiAdapter,
    );
    // 5. assert whether lptoken balance is as expected or not after deposit
    const actuallpTokenBalance = await lpTokenInstance.balanceOf(this.testDeFiAdapterForMetapoolFactory.address);
    expect(actuallpTokenBalance).to.gte(calculatedlpTokenAmount.mul(95).div(100));
    const expectedlpTokenBalance = await this.curveFactoryMetapoolAdapter.getLiquidityPoolTokenBalance(
      this.testDeFiAdapterForMetapoolFactory.address,
      hre.ethers.constants.AddressZero,
      pool.pool,
    );
    expect(expectedlpTokenBalance).to.eq(actuallpTokenBalance);

    // assert remaining underlying token after deposit
    const expectedBalanceOfUnderlyingTokenInTestDefiAdapterAfterDeposit = balanceOfUnderlyingTokenInTestDefiAdapter.sub(
      _actualDepositAmount.toString(),
    );
    const balanceOfUnderlyingTokenInTestDefiAdapterAfterDeposit = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForMetapoolFactory.address,
    );
    expect(expectedBalanceOfUnderlyingTokenInTestDefiAdapterAfterDeposit).to.closeTo(
      balanceOfUnderlyingTokenInTestDefiAdapterAfterDeposit,
      BigNumber.from("3")
        .mul(BigNumber.from("10").pow(Math.ceil(underlyingTokenDecimals / 2)))
        .toNumber(),
    );
  });
}
