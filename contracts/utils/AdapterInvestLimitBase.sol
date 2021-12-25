// SPDX-License-Identifier: gpl-3.0

pragma solidity >0.6.0 <0.9.0;

//  libraries
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

import { AdapterModifiersBase } from "./AdapterModifiersBase.sol";

import "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterInvestLimit.sol";

abstract contract AdapterInvestLimitBase is IAdapterInvestLimit, AdapterModifiersBase {
    using Address for address;

    /** @notice max deposit value datatypes */
    MaxExposure public maxDepositProtocolMode;

    /** @notice max deposit's default value in percentage */
    uint256 public maxDepositProtocolPct; // basis points

    /** @notice Maps liquidityPool to absolute max deposit value in underlying */
    mapping(address => uint256) public maxDepositAmount;

    /** @notice  Maps liquidityPool to max deposit value in percentage */
    mapping(address => uint256) public maxDepositPoolPct; // basis points

    constructor() {
        maxDepositProtocolPct = uint256(10000); // 100% (basis points)
        maxDepositProtocolMode = MaxExposure.Pct;
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct)
        external
        override
        onlyRiskOperator
    {
        require(_liquidityPool.isContract(), "!isContract");
        maxDepositPoolPct[_liquidityPool] = _maxDepositPoolPct;
        emit LogMaxDepositPoolPct(maxDepositPoolPct[_liquidityPool], msg.sender);
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositAmount(
        address _liquidityPool,
        address,
        uint256 _maxDepositAmount
    ) external override onlyRiskOperator {
        require(_liquidityPool.isContract(), "!isContract");
        // Note : use 18 as decimals for USD, BTC and ETH
        maxDepositAmount[_liquidityPool] = _maxDepositAmount;
        emit LogMaxDepositAmount(maxDepositAmount[_liquidityPool], msg.sender);
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositProtocolMode(MaxExposure _mode) public override onlyRiskOperator {
        maxDepositProtocolMode = _mode;
        emit LogMaxDepositProtocolMode(maxDepositProtocolMode, msg.sender);
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositProtocolPct(uint256 _maxDepositProtocolPct) public override onlyRiskOperator {
        maxDepositProtocolPct = _maxDepositProtocolPct;
        emit LogMaxDepositProtocolPct(maxDepositProtocolPct, msg.sender);
    }
}
