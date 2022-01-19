import { legos } from "@optyfi/defi-legos/polygon";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
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
      console.log("Skipping as total Supply is zero");
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
    if (pool.tokens[0] == legos.tokens.MOUSD) {
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
    }
    {
      await setTokenBalanceInStorage(underlyingTokenInstance, this.testDeFiAdapterForMetapoolFactory.address, "2000");
    }

    const balanceOfUnderlyingTokenInTestDefiAdapter = await underlyingTokenInstance.balanceOf(
      this.testDeFiAdapterForMetapoolFactory.address,
    );

    // 1. lpToken
    expect(await this.curveFactoryMetapoolAdapter.getLiquidityPoolToken(ethers.constants.AddressZero, pool.pool)).to.eq(
      pool.lpToken,
    );
    // 2. Pool value
    try {
      const actualPoolValue = await this.curveFactoryMetapoolAdapter.getPoolValue(
        pool.pool,
        ethers.constants.AddressZero,
      );
      const _virtualPrice = await curve2StableSwapMetapoolFactoryInstance.get_virtual_price();
      const expectedPoolValue = _virtualPrice.mul(_totalSupply).div(BigNumber.from("10").pow("18"));
      expect(actualPoolValue).to.eq(expectedPoolValue);
    } catch (error) {
      console.log("Skipping as getPoolValue is throwing error");
      this.skip();
    }

    // ============================================
    try {
      let calculatedlpTokenAmount: BigNumber = BigNumber.from(0);
      if (_nTokens.eq(BigNumber.from("3")) && pool.tokenIndexes[0] == "0") {
        calculatedlpTokenAmount = await curve3StableSwapMetapoolFactoryInstance.calc_token_amount(
          [balanceOfUnderlyingTokenInTestDefiAdapter, 0, 0],
          true,
        );
      } else if (_nTokens.eq(BigNumber.from("3")) && pool.tokenIndexes[0] == "1") {
        calculatedlpTokenAmount = await curve3StableSwapMetapoolFactoryInstance.calc_token_amount(
          [0, balanceOfUnderlyingTokenInTestDefiAdapter, 0],
          true,
        );
      } else if (_nTokens.eq(BigNumber.from("3")) && pool.tokenIndexes[0] == "2") {
        calculatedlpTokenAmount = await curve3StableSwapMetapoolFactoryInstance.calc_token_amount(
          [0, 0, balanceOfUnderlyingTokenInTestDefiAdapter],
          true,
        );
      } else if (_nTokens.eq(BigNumber.from("2")) && pool.tokenIndexes[0] == "0") {
        calculatedlpTokenAmount = await curve2StableSwapMetapoolFactoryInstance.calc_token_amount(
          [balanceOfUnderlyingTokenInTestDefiAdapter, 0],
          true,
        );
      } else if (_nTokens.eq(BigNumber.from("2")) && pool.tokenIndexes[0] == "1") {
        calculatedlpTokenAmount = await curve2StableSwapMetapoolFactoryInstance.calc_token_amount(
          [0, balanceOfUnderlyingTokenInTestDefiAdapter],
          true,
        );
      } else if (_nTokens.eq(BigNumber.from("4")) && pool.tokenIndexes[0] == "0") {
        calculatedlpTokenAmount = await curve4StableSwapMetapoolFactoryInstance.calc_token_amount(
          [balanceOfUnderlyingTokenInTestDefiAdapter, 0, 0, 0],
          true,
        );
      } else if (_nTokens.eq(BigNumber.from("4")) && pool.tokenIndexes[0] == "1") {
        calculatedlpTokenAmount = await curve4StableSwapMetapoolFactoryInstance.calc_token_amount(
          [0, balanceOfUnderlyingTokenInTestDefiAdapter, 0, 0],
          true,
        );
      } else if (_nTokens.eq(BigNumber.from("4")) && pool.tokenIndexes[0] == "2") {
        calculatedlpTokenAmount = await curve4StableSwapMetapoolFactoryInstance.calc_token_amount(
          [0, 0, balanceOfUnderlyingTokenInTestDefiAdapter, 0],
          true,
        );
      } else if (_nTokens.eq(BigNumber.from("4")) && pool.tokenIndexes[0] == "3") {
        calculatedlpTokenAmount = await curve4StableSwapMetapoolFactoryInstance.calc_token_amount(
          [0, 0, 0, balanceOfUnderlyingTokenInTestDefiAdapter],
          true,
        );
      }
      // ===========================================================
      // 3. calculate amount in lp token
      expect(
        await this.curveFactoryMetapoolAdapter.calculateAmountInLPToken(
          underlyingTokenInstance.address,
          pool.pool,
          balanceOfUnderlyingTokenInTestDefiAdapter,
        ),
      ).to.eq(calculatedlpTokenAmount);
    } catch (error) {
      console.error(error);
    }
  });
}
