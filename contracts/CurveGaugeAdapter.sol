// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";
// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";
import { IAdapterHarvestReward } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterHarvestReward.sol";

// contract CurveGaugeAdapter is IAdapter, IAdapterInvestLimit, IAdapterHarvestReward {}

contract CurveGaugeAdapter is AdapterInvestLimitBase {
    constructor(address _registry) AdapterModifiersBase(_registry) {}
}
