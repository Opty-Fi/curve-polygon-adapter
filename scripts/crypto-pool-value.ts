import { ethers } from "hardhat";
import CurveAdapterParticulars from "@optyfi/defi-legos/polygon/curve";
import { ICurveATriCryptoSwapV1 } from "../typechain/ICurveATriCryptoSwapV1";
// import { ICurveATriCryptoSwapV3 } from "../typechain/ICurveATriCryptoSwapV3";
import { BigNumber } from "ethers";
import { setTokenBalanceInStorage } from "../test/utils";
import { ICurveATriCryptoZap } from "../typechain/ICurveATriCryptoZap";
import { ERC20 } from "../typechain";

const {
  CurveATriCryptoSwap: { pools: CurveCryptoPools },
} = CurveAdapterParticulars;

const to_10_pow_18 = BigNumber.from(10).pow(18);

const amWBTC_v3 = CurveCryptoPools.amWBTC_crvUSDBTCETH_3;
const amWBTC_v1 = CurveCryptoPools.amWBTC_crvUSDCBTCETH_1;
const atriCryptoZapPool = CurveAdapterParticulars.CurveATriCryptoZap.pools.dai_crvUSDBTCETH;

async function main() {
  const [alice] = await ethers.getSigners();
  const triCryptoSwapPoolV1 = <ICurveATriCryptoSwapV1>(
    await ethers.getContractAt("ICurveATriCryptoSwapV1", "0x751B1e21756bDbc307CBcC5085c042a0e9AaEf36")
  );
  const atriCryptoZapPoolInstance = <ICurveATriCryptoZap>(
    await ethers.getContractAt("ICurveATriCryptoZap", atriCryptoZapPool.pool)
  );
  const vpV1 = await triCryptoSwapPoolV1.get_virtual_price();
  const dai = <ERC20>await ethers.getContractAt("ERC20", atriCryptoZapPool.tokens[0]);
  await setTokenBalanceInStorage(dai, alice.address, "1000");
  const daifundamount = await dai.balanceOf(alice.address);
  const v1Expected = daifundamount.mul(BigNumber.from("10").pow(36 - 18)).div(vpV1);
  await dai.connect(alice).approve(atriCryptoZapPoolInstance.address, daifundamount);
  await atriCryptoZapPoolInstance.connect(alice)["add_liquidity(uint256[5],uint256)"]([daifundamount, 0, 0, 0, 0], 0);
  const lpTokenV1 = await ethers.getContractAt("ERC20", await atriCryptoZapPoolInstance.token());
  console.log("Expected ", v1Expected.toString());
  console.log("Actual ", (await lpTokenV1.balanceOf(alice.address)).toString());
  console.log((await dai.balanceOf(alice.address)).toString());
}

export function cubic_root(x: BigNumber): BigNumber {
  // # x is taken at base 1e36
  // # result is at base 1e18
  // # Will have convergence problems when ETH*BTC is cheaper than 0.01 squared dollar
  // # (for example, when BTC < $0.1 and ETH < $0.1)
  let D = x.div(to_10_pow_18);
  for (let i = 0; i < 255; i++) {
    let diff = BigNumber.from("0");
    const D_prev = D;
    D = D.mul(
      BigNumber.from(2)
        .mul(to_10_pow_18)
        .add(x)
        .div(D.mul(to_10_pow_18).div(D.mul(to_10_pow_18).div(D)).div(BigNumber.from(3).mul(to_10_pow_18))),
    );

    if (D.gt(D_prev)) {
      diff = D.sub(D_prev);
    } else {
      diff = D_prev.sub(D);
    }
    if (diff.lte(1) || diff.mul(to_10_pow_18).lt(D)) {
      return D;
    }
  }
  return BigNumber.from("0");
}

export async function tricrypto_lp_price() {
  const triCryptoSwapPoolV1 = <ICurveATriCryptoSwapV1>(
    await ethers.getContractAt("ICurveATriCryptoSwapV1", "0x751B1e21756bDbc307CBcC5085c042a0e9AaEf36")
  );
  const GAMMA0 = 69999999999999;
  const A0 = 3645;
  const DISCOUNT0 = 0;
  const vp = await triCryptoSwapPoolV1.virtual_price();
  const p1 = await triCryptoSwapPoolV1.price_oracle(0);
  const p2 = await triCryptoSwapPoolV1.price_oracle(1);
  let max_price = BigNumber.from("3")
    .mul(vp)
    .mul(cubic_root(p1.mul(p2)))
    .div(to_10_pow_18);
  // # ((A/A0) * (gamma/gamma0)**2) ** (1/3)
  const g = (await triCryptoSwapPoolV1.gamma()).mul(to_10_pow_18).div(GAMMA0);
  const a = (await triCryptoSwapPoolV1.A()).mul(to_10_pow_18).div(A0);
  const l1 = BigNumber.from(g).pow("2").div(to_10_pow_18.mul(a));
  const l2 = BigNumber.from(10).pow("34");
  let discount = l1.gt(l2) ? l1 : l2; // # handle qbrt nonconvergence
  // # if discount is small, we take an upper bound
  discount = cubic_root(discount).mul(DISCOUNT0).div(to_10_pow_18);
  max_price = max_price.sub(max_price.mul(discount).div(to_10_pow_18));
  console.log(max_price.toString);
}

main().then(console.log).catch(console.error);
