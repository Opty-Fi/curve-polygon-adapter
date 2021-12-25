// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";
// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";

contract CurveStableSwapAdapter is AdapterInvestLimitBase {
    constructor(address _registry) AdapterModifiersBase(_registry) {}
}
