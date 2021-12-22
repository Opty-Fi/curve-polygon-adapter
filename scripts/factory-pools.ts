import hre from "hardhat";
import { BigNumber } from "ethers";
import fs from "fs";

const FACTORY_ABI = [
  {
    name: "BasePoolAdded",
    inputs: [{ name: "base_pool", type: "address", indexed: false }],
    anonymous: false,
    type: "event",
  },
  {
    name: "PlainPoolDeployed",
    inputs: [
      { name: "coins", type: "address[4]", indexed: false },
      { name: "A", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "deployer", type: "address", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "MetaPoolDeployed",
    inputs: [
      { name: "coin", type: "address", indexed: false },
      { name: "base_pool", type: "address", indexed: false },
      { name: "A", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "deployer", type: "address", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "LiquidityGaugeDeployed",
    inputs: [
      { name: "pool", type: "address", indexed: false },
      { name: "gauge", type: "address", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    stateMutability: "nonpayable",
    type: "constructor",
    inputs: [{ name: "_fee_receiver", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "metapool_implementations",
    inputs: [{ name: "_base_pool", type: "address" }],
    outputs: [{ name: "", type: "address[10]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "find_pool_for_coins",
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "find_pool_for_coins",
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
      { name: "i", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_base_pool",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_n_coins",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_meta_n_coins",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_coins",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "address[4]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_underlying_coins",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "address[8]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_decimals",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256[4]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_underlying_decimals",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256[8]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_metapool_rates",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256[2]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_balances",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256[4]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_underlying_balances",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256[8]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_A",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_fees",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_admin_balances",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256[4]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_coin_indices",
    inputs: [
      { name: "_pool", type: "address" },
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
    ],
    outputs: [
      { name: "", type: "int128" },
      { name: "", type: "int128" },
      { name: "", type: "bool" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_gauge",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_implementation_address",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "is_meta",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_pool_asset_type",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "get_fee_receiver",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "deploy_plain_pool",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_coins", type: "address[4]" },
      { name: "_A", type: "uint256" },
      { name: "_fee", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "deploy_plain_pool",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_coins", type: "address[4]" },
      { name: "_A", type: "uint256" },
      { name: "_fee", type: "uint256" },
      { name: "_asset_type", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "deploy_plain_pool",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_coins", type: "address[4]" },
      { name: "_A", type: "uint256" },
      { name: "_fee", type: "uint256" },
      { name: "_asset_type", type: "uint256" },
      { name: "_implementation_idx", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "deploy_metapool",
    inputs: [
      { name: "_base_pool", type: "address" },
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_coin", type: "address" },
      { name: "_A", type: "uint256" },
      { name: "_fee", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "deploy_metapool",
    inputs: [
      { name: "_base_pool", type: "address" },
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_coin", type: "address" },
      { name: "_A", type: "uint256" },
      { name: "_fee", type: "uint256" },
      { name: "_implementation_idx", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "deploy_gauge",
    inputs: [{ name: "_pool", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "add_base_pool",
    inputs: [
      { name: "_base_pool", type: "address" },
      { name: "_fee_receiver", type: "address" },
      { name: "_asset_type", type: "uint256" },
      { name: "_implementations", type: "address[10]" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_metapool_implementations",
    inputs: [
      { name: "_base_pool", type: "address" },
      { name: "_implementations", type: "address[10]" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_plain_implementations",
    inputs: [
      { name: "_n_coins", type: "uint256" },
      { name: "_implementations", type: "address[10]" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_gauge_implementation",
    inputs: [{ name: "_gauge_implementation", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_gauge",
    inputs: [
      { name: "_pool", type: "address" },
      { name: "_gauge", type: "address" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "batch_set_pool_asset_type",
    inputs: [
      { name: "_pools", type: "address[32]" },
      { name: "_asset_types", type: "uint256[32]" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "commit_transfer_ownership",
    inputs: [{ name: "_addr", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "accept_transfer_ownership",
    inputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_manager",
    inputs: [{ name: "_manager", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_fee_receiver",
    inputs: [
      { name: "_base_pool", type: "address" },
      { name: "_fee_receiver", type: "address" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "convert_metapool_fees",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "admin",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "future_admin",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "manager",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "pool_list",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "pool_count",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "base_pool_list",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "base_pool_count",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "plain_implementations",
    inputs: [
      { name: "arg0", type: "uint256" },
      { name: "arg1", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "fee_receiver",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "gauge_implementation",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
];

async function main() {
  const curveL2FactoryContractAddress = "0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee";
  const curveL2FactoryInstance = await hre.ethers.getContractAt(FACTORY_ABI, curveL2FactoryContractAddress);
  const pool_count = await curveL2FactoryInstance.pool_count();
  fs.writeFileSync("./pool.json", "{");
  for (let i = BigNumber.from("87"); BigNumber.from(i).lt(pool_count); i = BigNumber.from(i).add(BigNumber.from("1"))) {
    const pool = await curveL2FactoryInstance.pool_list(i);
    const poolInstance = await hre.ethers.getContractAt("ERC20", pool);
    const gauge = await curveL2FactoryInstance.get_gauge(pool);
    const n_coins = await curveL2FactoryInstance.get_n_coins(pool);
    const coins = await curveL2FactoryInstance.get_coins(pool);
    const lpTokenSymbol = await poolInstance.symbol();
    for (let j = BigNumber.from("0"); BigNumber.from(j).lt(n_coins); j = BigNumber.from(j).add(BigNumber.from("1"))) {
      const coinInstance = await hre.ethers.getContractAt("ERC20", coins[parseInt(j.toString())]);
      const coinSymbol = await coinInstance.symbol();
      const data = `"${coinSymbol.toLowerCase()}_${lpTokenSymbol.toLowerCase()}" : {
            "pool":"${pool}",
            "lpToken":"${pool}",
            "tokens":["${coins[parseInt(j.toString())]}"],
            "gauge": "${gauge}",
            "tokenIndexes":["${j.toString()}"]
        },`;
      fs.appendFileSync("./pool.json", data);
    }
  }
  fs.appendFileSync("./pool.json", "}");
}

main().then(console.log).catch(console.error);
