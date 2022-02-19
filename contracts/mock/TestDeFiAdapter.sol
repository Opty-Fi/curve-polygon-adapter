// SPDX-License-Identifier: MIT

pragma solidity =0.8.11;

import { ERC20 } from "@openzeppelin/contracts-0.8.x/token/ERC20/ERC20.sol";
import { IAdapterFull } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterFull.sol";
import { IAdapterHarvestRewardV2 } from "../utils/interfaces/IAdapterHarvestRewardV2.sol";

import { MultiCall } from "../utils/MultiCall.sol";

///////////////////////////////////////
/// THIS CONTRACTS MOCKS AS A VAULT ///
///////////////////////////////////////

////////////////////////////////
/// DO NOT USE IN PRODUCTION ///
////////////////////////////////

contract TestDeFiAdapter is MultiCall {
    function testGetDepositAllCodes(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getDepositAllCodes(payable(address(this)), _underlyingToken, _liquidityPool),
            "depositAll"
        );
    }

    function testGetDepositSomeCodes(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter,
        uint256 _amount
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getDepositSomeCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _amount
            ),
            "depositSome"
        );
    }

    function testClaimRewardTokenCode(address _liquidityPool, address _adapter) external {
        executeCodes(
            IAdapterFull(_adapter).getClaimRewardTokenCode(payable(address(this)), _liquidityPool),
            "claimReward"
        );
    }

    function testGetHarvestAllCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getHarvestAllCodes(payable(address(this)), _underlyingToken, _liquidityPool),
            "harvestAll"
        );
    }

    function testGetHarvestSomeCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter,
        uint256 _rewardTokenAmount
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getHarvestSomeCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _rewardTokenAmount
            ),
            "harvestSome"
        );
    }

    function testGetHarvestSomeCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter,
        address _rewardToken,
        uint256 _rewardTokenAmount
    ) external {
        executeCodes(
            IAdapterHarvestRewardV2(_adapter).getHarvestSomeCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _rewardToken,
                _rewardTokenAmount
            ),
            "harvestSome"
        );
    }

    function testGetWithdrawAllCodes(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getWithdrawAllCodes(payable(address(this)), _underlyingToken, _liquidityPool),
            "withdrawAll"
        );
    }

    function testGetWithdrawSomeCodes(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter,
        uint256 _amount
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getWithdrawSomeCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _amount
            ),
            "withdrawSome"
        );
    }

    function getERC20TokenBalance(address _token, address _account) external view returns (uint256) {
        return ERC20(_token).balanceOf(_account);
    }
}
