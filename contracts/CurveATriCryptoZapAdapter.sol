/* solhint-disable no-empty-blocks*/
// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";
// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";
import { IAdapterInvestLimit } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterInvestLimit.sol";
import { ICurveATriCryptoSwapV1 } from "@optyfi/defi-legos/polygon/curve/contracts/ICurveATriCryptoSwapV1.sol";
import { ICurveATriCryptoSwapV3 } from "@optyfi/defi-legos/polygon/curve/contracts/ICurveATriCryptoSwapV3.sol";

// TODO TriCryptoZap implementation
contract CurveATriCryptoSwapAdapter is AdapterInvestLimitBase {
    constructor(address _registry) AdapterModifiersBase(_registry) {}
}
