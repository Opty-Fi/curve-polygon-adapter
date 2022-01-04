import { ethers } from "hardhat";
import CurveAdapterParticulars from "@optyfi/defi-legos/polygon/curve";
import { ICurveATriCryptoSwapV1 } from "../typechain/ICurveATriCryptoSwapV1";
// import { ICurveATriCryptoSwapV3 } from "../typechain/ICurveATriCryptoSwapV3";
import { BigNumber } from "ethers";
import { setTokenBalanceInStorage } from "../test/utils";

const {
  CurveATriCryptoSwap: { pools: CurveCryptoPools },
} = CurveAdapterParticulars;

const amWBTC_v3 = CurveCryptoPools.amWBTC_crvUSDBTCETH_3;
const amWBTC_v1 = CurveCryptoPools.amWBTC_crvUSDCBTCETH_1;

async function main() {
  const [alice] = await ethers.getSigners();
  const triCryptoPoolV1 = <ICurveATriCryptoSwapV1>(
    await ethers.getContractAt("ICurveATriCryptoSwapV1", "0x751B1e21756bDbc307CBcC5085c042a0e9AaEf36")
  );
  // const triCryptoPoolV3 = <ICurveATriCryptoSwapV3>(
  //   await ethers.getContractAt("ICurveCryptoV3", "0x92215849c439E1f8612b6646060B4E3E5ef822cC")
  // );
  const vpV1 = await triCryptoPoolV1.get_virtual_price();
  // const vpV2 = await triCryptoPoolV3.get_virtual_price();
  const amWBTC = await ethers.getContractAt("ERC20", amWBTC_v3.tokens[0]);
  await setTokenBalanceInStorage(amWBTC, alice.address, "2");
  const amWBTCfundAmount = await amWBTC.balanceOf(alice.address);
  const v1Expected = amWBTCfundAmount.mul(BigNumber.from("10").pow(36 - 8)).div(vpV1);
  // const v2Expected = amWBTCfundAmount.mul(BigNumber.from("10").pow(36 - 8)).div(vpV2);
  await amWBTC.connect(alice).approve(triCryptoPoolV1.address, amWBTCfundAmount);
  console.log(amWBTCfundAmount.toString());
  await triCryptoPoolV1.connect(alice).add_liquidity(["0", amWBTCfundAmount, 0], 0);
  const lpTokenV1 = await ethers.getContractAt("ERC20", await triCryptoPoolV1.token());
  console.log(v1Expected.toString());
  console.log((await lpTokenV1.balanceOf(alice.address)).toString());
  console.log((await amWBTC.balanceOf(alice.address)).toString());
  // await setTokenBalanceInStorage(amWBTC, alice.address, amWBTCfundAmount.toString())
  // await amWBTC.connect(alice).approve(triCryptoPoolV3.address,amWBTCfundAmount)
}

main().then(console.log).catch(console.error);
