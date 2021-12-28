import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { CurveFinanceAdapter, CurveFinanceAdapter__factory } from "../../../typechain";

task("deploy-curve.finance-adapter").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const CurveFinanceAdapterFactory: CurveFinanceAdapter__factory = await ethers.getContractFactory(
    "CurveFinanceAdapter",
  );
  const CurveFinanceAdapter: CurveFinanceAdapter = <CurveFinanceAdapter>await CurveFinanceAdapterFactory.deploy();
  await CurveFinanceAdapter.deployed();
  console.log("CurveFinanceAdapter deployed to: ", CurveFinanceAdapter.address);
});
