/* solhint-disable no-unused-vars*/
// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";
// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";
import "@optyfi/defi-legos/polygon/curve/contracts/ICurve2StableSwapMetapoolFactory.sol";
import "@optyfi/defi-legos/polygon/curve/contracts/ICurve3StableSwapMetapoolFactory.sol";
import "@optyfi/defi-legos/polygon/curve/contracts/ICurve4StableSwapMetapoolFactory.sol";
import { ICurveL2Factory } from "@optyfi/defi-legos/polygon/curve/contracts/ICurveL2Factory.sol";

contract CurveMetapoolFactoryAdapter is AdapterInvestLimitBase, IAdapter {
    using Address for address;
    /**@notice address of metapool factory contract on matic */
    address public constant CurveL2Factory = address(0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee);

    /**@dev list of tokens that cannot accept zero allowance*/
    mapping(address => bool) public noZeroAllowanceAllowed;

    /*solhint-disable  no-empty-blocks*/
    constructor(address _registry) AdapterModifiersBase(_registry) {}

    /*solhint-enable  no-empty-blocks*/

    /**
     * @notice lists the tokens that does not accept zero allowance
     * @dev Only operator can access this function
     * @param _tokens address of the tokens
     * @param _noZeroAllowanceAllowed whether token allows zero allowance or not
     */
    function setNoZeroAllowanceAllowed(address[] memory _tokens, bool[] memory _noZeroAllowanceAllowed)
        external
        onlyOperator
    {
        uint256 _nTokens = _tokens.length;
        require(_nTokens == _noZeroAllowanceAllowed.length, "!length");
        for (uint256 _i; _i < _nTokens; _i++) {
            require(_tokens[_i].isContract(), "!isContract");
            noZeroAllowanceAllowed[_tokens[_i]] = _noZeroAllowanceAllowed[_i];
        }
    }

    /**
     * @inheritdoc IAdapter
     */
    function getPoolValue(address _liquidityPool, address) public view override returns (uint256) {
        uint256 _virtualPrice = ICurve2StableSwapMetapoolFactory(_liquidityPool).get_virtual_price();
        uint256 _totalSupply = ERC20(_liquidityPool).totalSupply();
        // the pool value will be in USD for US dollar stablecoin pools
        // the pool value will be in BTC for BTC pools
        return (_virtualPrice * _totalSupply) / (10**18);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositSomeCodes(
        address payable,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) external view override returns (bytes[] memory) {
        return _getDepositCode(_underlyingToken, _liquidityPool, _amount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositAllCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view override returns (bytes[] memory) {
        return _getDepositCode(_underlyingToken, _liquidityPool, ERC20(_underlyingToken).balanceOf(_vault));
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawSomeCodes(
        address payable,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) public view override returns (bytes[] memory _codes) {
        if (_amount > 0) {
            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _liquidityPool,
                abi.encodeCall(ERC20(_liquidityPool).approve, (_liquidityPool, uint256(0)))
            );
            _codes[1] = abi.encode(
                _liquidityPool,
                abi.encodeCall(ERC20(_liquidityPool).approve, (_liquidityPool, _amount))
            );

            _codes[2] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature(
                    "remove_liquidity_one_coin(uint256,int128,uint256)",
                    _amount,
                    _getTokenIndex(_liquidityPool, _underlyingToken),
                    (getSomeAmountInToken(_underlyingToken, _liquidityPool, _amount) * 95) / 100
                )
            );
        }
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawAllCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view override returns (bytes[] memory) {
        return
            getWithdrawSomeCodes(
                _vault,
                _underlyingToken,
                _liquidityPool,
                getLiquidityPoolTokenBalance(_vault, _underlyingToken, _liquidityPool)
            );
    }

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolToken(address, address _liquidityPool) external pure override returns (address) {
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
        address[4] memory _underlyingCoins = _getUnderlyingTokens(_liquidityPool);
        uint256 _nCoins = _getNCoins(_liquidityPool);
        _underlyingTokens = new address[](_nCoins);
        for (uint256 _i = 0; _i < _nCoins; _i++) {
            _underlyingTokens[_i] = _underlyingCoins[_i];
        }
    }

    /**
     * @inheritdoc IAdapter
     */
    function getAllAmountInToken(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        return
            getSomeAmountInToken(
                _underlyingToken,
                _liquidityPool,
                getLiquidityPoolTokenBalance(_vault, address(0), _liquidityPool)
            );
    }

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolTokenBalance(
        address payable _vault,
        address,
        address _liquidityPool
    ) public view override returns (uint256) {
        return ICurve2StableSwapMetapoolFactory(_liquidityPool).balanceOf(_vault);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getSomeAmountInToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) public view override returns (uint256) {
        if (_liquidityPoolTokenAmount > 0) {
            return
                ICurve2StableSwapMetapoolFactory(_liquidityPool).calc_withdraw_one_coin(
                    _liquidityPoolTokenAmount,
                    _getTokenIndex(_liquidityPool, _underlyingToken)
                );
        }
        return 0;
    }

    /**
     * @inheritdoc IAdapter
     */
    function calculateAmountInLPToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _underlyingTokenAmount
    ) external view override returns (uint256) {
        if (_underlyingTokenAmount > 0) {
            uint256 _nCoins = _getNCoins(_liquidityPool);
            address[4] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
            uint256[] memory _amounts = new uint256[](_nCoins);
            for (uint256 _i; _i < _nCoins; _i++) {
                if (_underlyingTokens[_i] == _underlyingToken) {
                    _amounts[_i] = _underlyingTokenAmount;
                }
            }
            if (_nCoins == 2) {
                return
                    ICurve2StableSwapMetapoolFactory(_liquidityPool).calc_token_amount(
                        [_amounts[0], _amounts[1]],
                        true
                    );
            } else if (_nCoins == 3) {
                return
                    ICurve3StableSwapMetapoolFactory(_liquidityPool).calc_token_amount(
                        [_amounts[0], _amounts[1], _amounts[2]],
                        true
                    );
            } else if (_nCoins == 4) {
                return
                    ICurve4StableSwapMetapoolFactory(_liquidityPool).calc_token_amount(
                        [_amounts[0], _amounts[1], _amounts[2], _amounts[3]],
                        true
                    );
            }
        }
        return uint256(0);
    }

    /**
     * @inheritdoc IAdapter
     */
    function calculateRedeemableLPTokenAmount(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (uint256 _amount) {
        uint256 _liquidityPoolTokenBalance = getLiquidityPoolTokenBalance(_vault, address(0), _liquidityPool);
        uint256 _balanceInToken = getAllAmountInToken(_vault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        return ((_liquidityPoolTokenBalance * _redeemAmount) / _balanceInToken) + 1;
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
     * @inheritdoc IAdapter
     */
    function canStake(address) external pure override returns (bool) {
        return false;
    }

    /**
     * @dev Get number of underlying tokens in a swap pool
     * @param _swapPool swap pool address
     * @return  Number of underlying tokens
     */
    function _getNCoins(address _swapPool) internal view returns (uint256) {
        return ICurveL2Factory(CurveL2Factory).get_n_coins(_swapPool);
    }

    /**
     * @dev Get the underlying tokens within a swap pool.
     * @param _swapPool the swap pool address
     * @return list of coin addresses
     */
    function _getUnderlyingTokens(address _swapPool) internal view returns (address[4] memory) {
        return ICurveL2Factory(CurveL2Factory).get_coins(_swapPool);
    }

    /**
     * @dev This functions returns the token index for a underlying token
     * @param _underlyingToken address of the underlying asset
     * @param _swapPool swap pool address
     * @return _tokenIndex index of coin in swap pool
     */
    function _getTokenIndex(address _swapPool, address _underlyingToken) internal view returns (int128) {
        address[4] memory _underlyingTokens = _getUnderlyingTokens(_swapPool);
        for (uint256 _i; _i < _underlyingTokens.length; _i++) {
            if (_underlyingTokens[_i] == _underlyingToken) {
                return int128(uint128(_i));
            }
        }
        return int128(0);
    }

    /**
     * @dev This function composes the configuration required to construct fuction calls
     * @param _underlyingToken address of the underlying asset
     * @param _swapPool swap pool address
     * @param _amount amount in underlying token
     * @return _nCoins number of underlying tokens in swap pool
     * @return _underlyingTokens underlying tokens in a swap pool
     * @return _amounts value in an underlying token for each underlying token
     * @return _codeLength number of function call required for deposit
     */
    function _getDepositCodeConfig(
        address _underlyingToken,
        address _swapPool,
        uint256 _amount
    )
        internal
        view
        returns (
            uint256 _nCoins,
            address[4] memory _underlyingTokens,
            uint256[] memory _amounts,
            uint256 _codeLength
        )
    {
        _nCoins = _getNCoins(_swapPool);
        _underlyingTokens = _getUnderlyingTokens(_swapPool);
        _amounts = new uint256[](_nCoins);
        _codeLength = 1;
        for (uint256 _i = 0; _i < _nCoins; _i++) {
            if (_underlyingTokens[_i] == _underlyingToken) {
                _amounts[_i] = _getDepositAmount(
                    _swapPool,
                    _underlyingToken,
                    _amount,
                    getPoolValue(_swapPool, address(0))
                );
                if (_amounts[_i] > 0) {
                    if (noZeroAllowanceAllowed[_underlyingTokens[_i]]) {
                        _codeLength = 2;
                    } else {
                        _codeLength = 3;
                    }
                }
            }
        }
    }

    /**
     * @dev This functions composes the function calls to deposit asset into deposit pool
     * @param _underlyingToken address of the underlying asset
     * @param _liquidityPool liquidity pool address
     * @param _amount the amount in underlying token
     * @return _codes bytes array of function calls to be executed from vault
     * */
    function _getDepositCode(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) internal view returns (bytes[] memory _codes) {
        (
            uint256 _nCoins,
            address[4] memory _underlyingTokens,
            uint256[] memory _amounts,
            uint256 _codeLength
        ) = _getDepositCodeConfig(_underlyingToken, _liquidityPool, _amount);
        if (_codeLength > 1) {
            _codes = new bytes[](_codeLength);
            uint256 _j;
            for (uint256 _i; _i < _nCoins; _i++) {
                if (_amounts[_i] > 0) {
                    if (noZeroAllowanceAllowed[_underlyingTokens[_i]]) {
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[_i],
                            abi.encodeCall(ERC20(_underlyingTokens[_i]).approve, (_liquidityPool, _amounts[_i]))
                        );
                    } else {
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[_i],
                            abi.encodeCall(ERC20(_underlyingTokens[_i]).approve, (_liquidityPool, uint256(0)))
                        );
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[_i],
                            abi.encodeCall(ERC20(_underlyingTokens[_i]).approve, (_liquidityPool, _amounts[_i]))
                        );
                    }
                }
            }
            if (_nCoins == uint256(2)) {
                uint256[2] memory _depositAmounts = [_amounts[0], _amounts[1]];
                uint256 _minMintAmount = (ICurve2StableSwapMetapoolFactory(_liquidityPool).calc_token_amount(
                    _depositAmounts,
                    true
                ) * 95) / 100;
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[2],uint256)", _depositAmounts, _minMintAmount)
                );
            } else if (_nCoins == uint256(3)) {
                uint256[3] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2]];
                uint256 _minMintAmount = (ICurve3StableSwapMetapoolFactory(_liquidityPool).calc_token_amount(
                    _depositAmounts,
                    true
                ) * 95) / 100;
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[3],uint256)", _depositAmounts, _minMintAmount)
                );
            } else if (_nCoins == uint256(4)) {
                uint256[4] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2], _amounts[3]];
                uint256 _minMintAmount = (ICurve4StableSwapMetapoolFactory(_liquidityPool).calc_token_amount(
                    _depositAmounts,
                    true
                ) * 95) / 100;
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[4],uint256)", _depositAmounts, _minMintAmount)
                );
            }
        }
    }
}
