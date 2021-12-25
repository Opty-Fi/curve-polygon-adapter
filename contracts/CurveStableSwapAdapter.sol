// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";

// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";

/**
 * @title Adapter for Curve StableSwap pools on polygon
 * @author Opty.fi
 * @dev Abstraction layer to Curve's stableswap pools
 */
/*IAdapter, IAdapterInvestLimit,*/
contract CurveStableSwapAdapter is AdapterInvestLimitBase {
    constructor(address _registry) AdapterModifiersBase(_registry) {}
}
