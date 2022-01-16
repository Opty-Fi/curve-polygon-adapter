/* solhint-disable no-unused-vars*/
// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterModifiersBase.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// interfaces
import { IAdapter, IAdapterV2 } from "./utils/interfaces/IAdapterV2.sol";
import { IAdapterHarvestReward, IAdapterHarvestRewardV2 } from "./utils/interfaces/IAdapterHarvestRewardV2.sol";
import { ICurveGauge } from "@optyfi/defi-legos/polygon/curve/contracts/ICurveGauge.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract CurveGaugeAdapter is AdapterModifiersBase, IAdapterV2, IAdapterHarvestRewardV2 {
    using Address for address;
    /**
     * @notice Uniswap V2 router contract address
     */
    //Apeswap Router on Polygon
    // address public constant apeSwapV2Router02 = address(0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607);
    address public constant quickSwapV2Router02 = address(0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff);

    /**@notice am3Crv Gauge */
    address public constant am3CrvGauge = address(0x19793B454D3AfC7b454F206Ffe95aDE26cA6912c);

    /**@notice btcCrv Gauge */
    address public constant btcCrvGauge = address(0xffbACcE0CC7C19d46132f1258FC16CF6871D153c);

    /**@notice tricypto pool Gauge */
    address public constant crvUSDBTCETHGauge = address(0xb0a366b987d77b5eD5803cBd95C80bB6DEaB48C0);

    /**@notice PoS CRV */
    address public constant CRV = address(0x172370d5Cd63279eFa6d502DAB29171933a610AF);

    /**@notice PoS WMATIC */
    address public constant WMATIC = address(0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270);

    /**@notice reward tokens per gauge */
    mapping(address => address[8]) public rewardTokens;

    /**@notice number of reward tokens per gauge */
    mapping(address => uint256) public nRewardTokens;

    constructor(address _registry) AdapterModifiersBase(_registry) {
        // am3CrvGauge
        rewardTokens[am3CrvGauge][0] = CRV;
        rewardTokens[am3CrvGauge][1] = WMATIC;
        nRewardTokens[am3CrvGauge] = 2;
        // btcCrvGauge
        rewardTokens[btcCrvGauge][0] = CRV;
        rewardTokens[btcCrvGauge][1] = WMATIC;
        nRewardTokens[btcCrvGauge] = 2;
        // crvUSDBTCETHGauge
        rewardTokens[crvUSDBTCETHGauge][0] = CRV;
        rewardTokens[crvUSDBTCETHGauge][1] = WMATIC;
        nRewardTokens[crvUSDBTCETHGauge] = 2;
    }

    /**
     * @notice assign list of reward tokens to the gauge
     * @dev Only operator can access this function
     * @param _gauges list of gauge contracts
     * @param _indexes index of the reward token per gauge
     * @param _rewardTokens list of reward tokens per index per gauge
     */
    function setRewardTokens(
        address[] memory _gauges,
        uint256[] memory _indexes,
        address[] memory _rewardTokens
    ) external onlyOperator {
        uint256 _nGauges = _gauges.length;
        require(_nGauges == _indexes.length && _nGauges == _rewardTokens.length, "!length");
        for (uint256 _i; _i < _nGauges; _i++) {
            require(_gauges[_i].isContract(), "!isContract");
            require(_rewardTokens[_i].isContract(), "!isContract");
            rewardTokens[_gauges[_i]][_indexes[_i]] = _rewardTokens[_i];
        }
    }

    /**
     * @notice set number of reward tokens per gauge
     * @param _gauges list of gauge contract address
     * @param _nRewardTokens list of total reard tokens per
     */
    function setNRewardToken(address[] memory _gauges, uint256[] memory _nRewardTokens) external onlyOperator {
        uint256 _nGauges = _gauges.length;
        require(_nGauges == _nRewardTokens.length, "!length");
        for (uint256 _i; _i < _nGauges; _i++) {
            require(_gauges[_i].isContract(), "!isContract");
            nRewardTokens[_gauges[_i]] = _nRewardTokens[_i];
        }
    }

    /**
     * @inheritdoc IAdapter
     */
    function getPoolValue(address _liquidityPool, address) public view override returns (uint256) {
        return ICurveGauge(_liquidityPool).totalSupply();
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositSomeCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) public pure override returns (bytes[] memory _codes) {
        _codes = new bytes[](3);
        _codes[0] = abi.encode(
            _underlyingToken,
            abi.encodeCall(ERC20(_underlyingToken).approve, (_liquidityPool, uint256(0)))
        );
        _codes[1] = abi.encode(
            _underlyingToken,
            abi.encodeCall(ERC20(_underlyingToken).approve, (_liquidityPool, _amount))
        );
        // Claim pending unclaimed reward tokens on deposit
        _codes[2] = abi.encode(
            _liquidityPool,
            abi.encodeWithSignature("deposit(uint256,address,bool)", _amount, _vault, true)
        );
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositAllCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view override returns (bytes[] memory) {
        return
            getDepositSomeCodes(
                payable(address(0)),
                _underlyingToken,
                _liquidityPool,
                ERC20(_underlyingToken).balanceOf(_vault)
            );
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawSomeCodes(
        address payable,
        address,
        address _liquidityPool,
        uint256 _amount
    ) public pure override returns (bytes[] memory _codes) {
        _codes = new bytes[](1);
        // claim pending unclaimed reward tokens on withdraw
        _codes[0] = abi.encode(_liquidityPool, abi.encodeWithSignature("withdraw(uint256,bool)", _amount, true));
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawAllCodes(
        address payable _vault,
        address,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        return
            getWithdrawSomeCodes(
                payable(address(0)),
                address(0),
                _liquidityPool,
                ERC20(_liquidityPool).balanceOf(_vault)
            );
    }

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolToken(address, address _liquidityPool) public pure returns (address) {
        return _liquidityPool;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getUnderlyingTokens(address _liquidityPool, address)
        external
        view
        override
        returns (address[] memory _underlyingTokens)
    {
        _underlyingTokens = new address[](1);
        _underlyingTokens[0] = ICurveGauge(_liquidityPool).lp_token();
    }

    /**
     * @inheritdoc IAdapter
     */
    function getAllAmountInToken(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        return getLiquidityPoolTokenBalance(_vault, _underlyingToken, _liquidityPool);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolTokenBalance(
        address payable _vault,
        address,
        address _liquidityPool
    ) public view override returns (uint256) {
        return ERC20(_liquidityPool).balanceOf(_vault);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getSomeAmountInToken(
        address,
        address,
        uint256 _liquidityPoolTokenAmount
    ) public pure override returns (uint256) {
        return _liquidityPoolTokenAmount;
    }

    /**
     * @inheritdoc IAdapter
     */
    function calculateAmountInLPToken(
        address,
        address,
        uint256 _underlyingTokenAmount
    ) external pure override returns (uint256) {
        return _underlyingTokenAmount;
    }

    /**
     * @inheritdoc IAdapter
     */
    function calculateRedeemableLPTokenAmount(
        address payable,
        address,
        address,
        uint256 _redeemAmount
    ) external pure override returns (uint256 _amount) {
        return _redeemAmount;
    }

    /**
     * @inheritdoc IAdapter
     */
    function isRedeemableAmountSufficient(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInToken(_vault, _underlyingToken, _liquidityPool);
        return _balanceInToken >= _redeemAmount;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getRewardToken(address) external pure override returns (address) {
        return address(0);
    }

    /**
     * @inheritdoc IAdapterV2
     */
    function getRewardTokens(address _liquidityPool) public view override returns (address[] memory _rewardTokens) {
        uint256 _nTokens = nRewardTokens[_liquidityPool];
        _rewardTokens = new address[](_nTokens);
        for (uint256 _i; _i < _nTokens; _i++) {
            _rewardTokens[_i] = rewardTokens[_liquidityPool][_i];
        }
    }

    /**
     * @inheritdoc IAdapter
     */
    function canStake(address) external pure override returns (bool) {
        return false;
    }

    /*solhint-disable no-empty-blocks*/
    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getUnclaimedRewardTokenAmount(
        address payable,
        address,
        address
    ) external view override returns (uint256) {}

    /**
     * @inheritdoc IAdapterHarvestRewardV2
     */
    function getUnclaimedRewardTokenAmount(
        address payable,
        address,
        address,
        address
    ) external view returns (uint256 _amount) {}

    /*solhint-enable no-empty-blocks*/

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getClaimRewardTokenCode(address payable, address _liquidityPool)
        external
        pure
        override
        returns (bytes[] memory _codes)
    {
        _codes = new bytes[](1);
        // Claim available reward tokens for vault
        _codes[0] = abi.encode(_liquidityPool, abi.encodeWithSignature("claim_rewards()"));
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getHarvestSomeCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory _codes) {
        return _getHarvestCodes(_vault, getRewardTokens(_liquidityPool)[0], _underlyingToken, _rewardTokenAmount);
    }

    /**
     * @inheritdoc IAdapterHarvestRewardV2
     */
    function getHarvestSomeCodes(
        address payable _vault,
        address _underlyingToken,
        address,
        address _rewardToken,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory _codes) {
        return _getHarvestCodes(_vault, _rewardToken, _underlyingToken, _rewardTokenAmount);
    }

    /*solhint-disable  no-empty-blocks*/
    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getAddLiquidityCodes(address payable _vault, address _underlyingToken)
        external
        view
        override
        returns (bytes[] memory _codes)
    {}

    /*solhint-enable  no-empty-blocks*/

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getHarvestAllCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _rewardTokenAmount = ERC20(getRewardTokens(_liquidityPool)[0]).balanceOf(_vault);
        return getHarvestSomeCodes(_vault, _underlyingToken, _liquidityPool, _rewardTokenAmount);
    }

    /**
     * @inheritdoc IAdapterHarvestRewardV2
     */
    function getHarvestAllCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        address _rewardToken
    ) external view override returns (bytes[] memory _codes) {
        return getHarvestSomeCodes(_vault, _underlyingToken, _liquidityPool, ERC20(_rewardToken).balanceOf(_vault));
    }

    /**
     * @dev Get the codes for harvesting the tokens using uniswap like routers - i.e. swapping back into the underlying
     * @param _vault Vault contract address
     * @param _rewardToken Reward token address
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @param _rewardTokenAmount reward token amount to harvest
     * @return _codes List of harvest codes for harvesting reward tokens
     */
    function _getHarvestCodes(
        address payable _vault,
        address _rewardToken,
        address _underlyingToken,
        uint256 _rewardTokenAmount
    ) internal view returns (bytes[] memory _codes) {
        if (_rewardTokenAmount > 0) {
            uint256[] memory _amounts = IUniswapV2Router02(quickSwapV2Router02).getAmountsOut(
                _rewardTokenAmount,
                _getPath(_rewardToken, _underlyingToken)
            );
            if (_amounts[_amounts.length - 1] > 0) {
                _codes = new bytes[](3);
                _codes[0] = abi.encode(
                    _rewardToken,
                    abi.encodeCall(ERC20(_rewardToken).approve, (quickSwapV2Router02, uint256(0)))
                );
                _codes[1] = abi.encode(
                    _rewardToken,
                    abi.encodeCall(ERC20(_rewardToken).approve, (quickSwapV2Router02, _rewardTokenAmount))
                );
                _codes[2] = abi.encode(
                    quickSwapV2Router02,
                    abi.encodeCall(
                        IUniswapV2Router01(quickSwapV2Router02).swapExactTokensForTokens,
                        (
                            _rewardTokenAmount,
                            uint256(0),
                            _getPath(_rewardToken, _underlyingToken),
                            _vault,
                            type(uint256).max
                        )
                    )
                );
            }
        }
    }

    /**
     * @dev Constructs the path for token swap on Uniswap
     * @param _initialToken The token to be swapped with
     * @param _finalToken The token to be swapped for
     * @return _path The array of tokens in the sequence to be swapped for
     */
    function _getPath(address _initialToken, address _finalToken) internal pure returns (address[] memory _path) {
        if (_finalToken == WMATIC) {
            _path = new address[](2);
            _path[0] = _initialToken;
            _path[1] = WMATIC;
        } else if (_initialToken == WMATIC) {
            _path = new address[](2);
            _path[0] = WMATIC;
            _path[1] = _finalToken;
        } else {
            _path = new address[](3);
            _path[0] = _initialToken;
            _path[1] = WMATIC;
            _path[2] = _finalToken;
        }
    }
}
