import { ethers } from "hardhat";
import CurveAdapterParticulars from "@optyfi/defi-legos/polygon/curve";
import { ICurveATriCryptoSwapV1 } from "../typechain/ICurveATriCryptoSwapV1";
import { ICurveATriCryptoZap } from "../typechain/ICurveATriCryptoZap";
import { BigNumber } from "ethers";
import { setTokenBalanceInStorage } from "../test/utils";

const {
  CurveATriCryptoSwap: { pools: CurveCryptoPools },
  CurveATriCryptoZap: { pools: CurveCryptoZapPools },
} = CurveAdapterParticulars;

const amWBTC_v1 = CurveCryptoPools.amWBTC_crvUSDCBTCETH_1;
const wbtc_pool = CurveCryptoZapPools["wbtc_crvUSDBTCETH"];

async function main() {
  const [alice] = await ethers.getSigners();
  const triCryptoPoolV1 = <ICurveATriCryptoSwapV1>(
    await ethers.getContractAt("ICurveATriCryptoSwapV1", "0x751B1e21756bDbc307CBcC5085c042a0e9AaEf36")
  );
  const triCryptoZapPool = <ICurveATriCryptoZap>await ethers.getContractAt("ICurveATriCryptoZap", wbtc_pool.pool);
  // const triCryptoPoolV3 = <ICurveATriCryptoSwapV3>(
  //   await ethers.getContractAt("ICurveCryptoV3", "0x92215849c439E1f8612b6646060B4E3E5ef822cC")
  // );
  const vpV1 = await triCryptoPoolV1.get_virtual_price();
  // const vpV2 = await triCryptoPoolV3.get_virtual_price();
  const wbtc = await ethers.getContractAt("ERC20", wbtc_pool.tokens[0]);
  await setTokenBalanceInStorage(wbtc, alice.address, "1");
  const WBTCfundAmount = await wbtc.balanceOf(alice.address);
  const v1Expected = WBTCfundAmount.mul(BigNumber.from("10").pow(36 - 18)).div(vpV1);
  // const v2Expected = amWBTCfundAmount.mul(BigNumber.from("10").pow(36 - 8)).div(vpV2);
  await wbtc.connect(alice).approve(triCryptoZapPool.address, WBTCfundAmount);
  console.log(WBTCfundAmount.toString());
  await triCryptoZapPool.connect(alice)["add_liquidity(uint256[5],uint256)"]([0, 0, 0, WBTCfundAmount, 0], 0);
  const lpTokenV1 = await ethers.getContractAt("ERC20", await triCryptoZapPool.token());
  console.log(v1Expected.toString());
  console.log((await lpTokenV1.balanceOf(alice.address)).toString());
  console.log((await wbtc.balanceOf(alice.address)).toString());
  // await setTokenBalanceInStorage(amWBTC, alice.address, amWBTCfundAmount.toString())
  // await amWBTC.connect(alice).approve(triCryptoPoolV3.address,amWBTCfundAmount)
}

main().then(console.log).catch(console.error);
