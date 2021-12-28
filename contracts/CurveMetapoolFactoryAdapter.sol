// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";
// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";
import { ICurve2StableSwap } from "@optyfi/defi-legos/polygon/curve/contracts/ICurve2StableSwap.sol";
import { ICurve3StableSwap } from "@optyfi/defi-legos/polygon/curve/contracts/ICurve3StableSwap.sol";
import { ICurve4StableSwap } from "@optyfi/defi-legos/polygon/curve/contracts/ICurve4StableSwap.sol";

contract CurveStableSwapAdapter is AdapterInvestLimitBase {
    /**@notice address of metapool factory contract on matic */
    address public constant CurveL2Factory = address(0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee);

    constructor(address _registry) AdapterModifiersBase(_registry) {}
}
