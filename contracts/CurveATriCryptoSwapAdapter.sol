/* solhint-disable no-empty-blocks*/
// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";
// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";
import { IAdapterInvestLimit } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterInvestLimit.sol";
import { ICurveATriCryptoZap } from "@optyfi/defi-legos/polygon/curve/contracts/ICurveATriCryptoZap.sol";

// TODO TriCryptoSwap implementation
contract CurveATriCryptoZapAdapter is AdapterInvestLimitBase {
    constructor(address _registry) AdapterModifiersBase(_registry) {}
}
