/* solhint-disable no-unused-vars*/
// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";
import { ERC20 } from "@openzeppelin/contracts-0.8.x/token/ERC20/ERC20.sol";

// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";
import { ICurve2StableSwap } from "@optyfi/defi-legos/polygon/curve/contracts/ICurve2StableSwap.sol";
import { ICurve3StableSwap } from "@optyfi/defi-legos/polygon/curve/contracts/ICurve3StableSwap.sol";

/**
 * @title Adapter for Curve StableSwap pools on polygon
 * @author Opty.fi
 * @dev Abstraction layer to Curve's stableswap pools
 */

contract CurveStableSwapAdapter is IAdapter, AdapterInvestLimitBase {
    using Address for address;

    /**@notice Curve aPool for use on Polygon */
    address public constant aPool = address(0x445FE580eF8d70FF569aB36e80c647af338db351);

    address public constant aBTCPool = address(0xC2d95EEF97Ec6C17551d45e77B590dc1F9117C67);

    /**@notice PoS DAI stable coin address */
    address public constant DAI = address(0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063);

    /**@notice PoS USD coin address */
    address public constant USDC = address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);

    /**@notice PoS Tether USD address */
    address public constant USDT = address(0xc2132D05D31c914a87C6611C10748AEb04B58e8F);

    /**@notice PoS Wrapped BTC address */
    address public constant WBTC = address(0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6);

    /**@notice renBTC address */
    address public constant renBTC = address(0xDBf31dF14B66535aF65AaC99C32e9eA844e14501);

    /**@dev input token index per pool*/
    mapping(address => mapping(address => int128)) public tokenIndexes;

    /**@dev assign number of input tokens per pool */
    mapping(address => uint256) public nTokens;

    /**@dev assign coins per pool */
    mapping(address => address[8]) public coins;

    /**@dev assign underlying coins per pool */
    mapping(address => address[8]) public underlyingCoins;

    /**@dev list of tokens that cannot accept zero allowance*/
    mapping(address => bool) public noZeroAllowanceAllowed;

    /**@dev list of pools where amount is not same for underlying or wrapped asset withdrawals*/
    mapping(address => bool) public calcWithdrawOneCoinNotSame;

    constructor(address _registry) AdapterModifiersBase(_registry) {
        // aPool
        tokenIndexes[aPool][DAI] = int128(0);
        tokenIndexes[aPool][USDC] = int128(1);
        tokenIndexes[aPool][USDT] = int128(2);
        nTokens[aPool] = uint256(3);
        underlyingCoins[aPool][0] = DAI;
        underlyingCoins[aPool][1] = USDC;
        underlyingCoins[aPool][2] = USDT;
        // aBTCPool
        tokenIndexes[aBTCPool][WBTC] = int128(0);
        tokenIndexes[aBTCPool][renBTC] = int128(1);
        nTokens[aBTCPool] = uint256(2);
        coins[aBTCPool][1] = renBTC;
        underlyingCoins[aBTCPool][0] = WBTC;
        underlyingCoins[aBTCPool][1] = renBTC;
    }

    /**
     * @notice assign token index per liquidity pool
     * @dev Only operator can access this function
     * @param _pools address of the liquidity pool
     * @param _tokens address of the input tokens
     * @param _indexes index of the input token
     */
    function setTokenIndexes(
        address[] memory _pools,
        address[] memory _tokens,
        int128[] memory _indexes
    ) external onlyOperator {
        uint256 _nPools = _pools.length;
        require(_nPools == _tokens.length && _nPools == _indexes.length, "!length");
        for (uint256 _i; _i < _nPools; _i++) {
            require(_pools[_i].isContract(), "!isContract");
            require(_tokens[_i].isContract(), "!isContract");
            tokenIndexes[_pools[_i]][_tokens[_i]] = _indexes[_i];
        }
    }

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
     * @notice Set the pools where amount is not same for underlying or wrapped asset withdrawals
     * @dev Only operator can access this function
     * @param _pools the list of pool addresses
     * @param _calcWithdrawOneCoinNotSame whether pools calculate wrapped/unwrapped asset withdrawals differently
     */
    function setCalcWithdrawOneCoinNotSame(address[] memory _pools, bool[] memory _calcWithdrawOneCoinNotSame)
        external
        onlyOperator
    {
        uint256 _nPools = _pools.length;
        require(_nPools == _calcWithdrawOneCoinNotSame.length, "!length");
        for (uint256 _i; _i < _nPools; _i++) {
            calcWithdrawOneCoinNotSame[_pools[_i]] = _calcWithdrawOneCoinNotSame[_i];
        }
    }

    /**
     * @inheritdoc IAdapter
     */
    function getPoolValue(address _liquidityPool, address) public view override returns (uint256) {
        uint256 _virtualPrice = ICurve2StableSwap(_liquidityPool).get_virtual_price();
        uint256 _totalSupply = ERC20(_getLiquidityPoolToken(_liquidityPool)).totalSupply();
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
            address _liquidityPoolToken = getLiquidityPoolToken(address(0), _liquidityPool);

            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _liquidityPoolToken,
                abi.encodeCall(ERC20(_liquidityPool).approve, (_liquidityPool, uint256(0)))
            );
            _codes[1] = abi.encode(
                _liquidityPoolToken,
                abi.encodeCall(ERC20(_liquidityPool).approve, (_liquidityPool, _amount))
            );

            _codes[2] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature(
                    "remove_liquidity_one_coin(uint256,int128,uint256,bool)",
                    _amount,
                    tokenIndexes[_liquidityPool][_underlyingToken],
                    (getSomeAmountInToken(_underlyingToken, _liquidityPool, _amount) * 95) / 100,
                    true
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
    ) external view override returns (bytes[] memory _codes) {
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
    function getLiquidityPoolToken(address, address _liquidityPool) public view returns (address) {
        return ICurve2StableSwap(_liquidityPool).lp_token();
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
        address[8] memory _underlyingCoins = underlyingCoins[_liquidityPool];
        uint256 _nCoins = nTokens[_liquidityPool];
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
                getLiquidityPoolTokenBalance(_vault, _underlyingToken, _liquidityPool)
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
        return ERC20(getLiquidityPoolToken(address(0), _liquidityPool)).balanceOf(_vault);
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
                calcWithdrawOneCoinNotSame[_liquidityPool]
                    ? ICurveXSwap(_liquidityPool).calc_withdraw_one_coin(
                        _liquidityPoolTokenAmount,
                        tokenIndexes[_liquidityPool][_underlyingToken],
                        true
                    )
                    : ICurve2StableSwap(_liquidityPool).calc_withdraw_one_coin(
                        _liquidityPoolTokenAmount,
                        tokenIndexes[_liquidityPool][_underlyingToken]
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
            uint256 _nCoins = nTokens[_liquidityPool];
            address[8] memory _underlyingTokens = underlyingCoins[_liquidityPool];
            uint256[] memory _amounts = new uint256[](_nCoins);
            for (uint256 _i; _i < _nCoins; _i++) {
                if (_underlyingTokens[_i] == _underlyingToken) {
                    _amounts[_i] = _underlyingTokenAmount;
                }
            }
            if (_nCoins == 2) {
                return ICurve2StableSwap(_liquidityPool).calc_token_amount([_amounts[0], _amounts[1]], true);
            } else if (_nCoins == 3) {
                return
                    ICurve3StableSwap(_liquidityPool).calc_token_amount([_amounts[0], _amounts[1], _amounts[2]], true);
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
        uint256 _liquidityPoolTokenBalance = getLiquidityPoolTokenBalance(_vault, _underlyingToken, _liquidityPool);
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
     * @dev Retrieves liquidity pool token address
     * @param _liquidityPool address of the curve swap pool contract
     * @return address of the liquidity pool token
     */
    function _getLiquidityPoolToken(address _liquidityPool) internal view returns (address) {
        return ICurve2StableSwap(_liquidityPool).lp_token();
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
            address[8] memory _underlyingTokens,
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
                uint256 _minMintAmount = (ICurve2StableSwap(_liquidityPool).calc_token_amount(_depositAmounts, true) *
                    95) / 100;
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature(
                        "add_liquidity(uint256[2],uint256,bool)",
                        _depositAmounts,
                        _minMintAmount,
                        true
                    )
                );
            } else if (_nCoins == uint256(3)) {
                uint256[3] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2]];
                uint256 _minMintAmount = (ICurve3StableSwap(_liquidityPool).calc_token_amount(_depositAmounts, true) *
                    95) / 100;
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature(
                        "add_liquidity(uint256[3],uint256,bool)",
                        _depositAmounts,
                        _minMintAmount,
                        true
                    )
                );
            }
        }
    }

    /**
     * @dev This function composes the configuration required to construct fuction calls
     * @param _underlyingToken address of the underlying asset
     * @param _liquidityPool liquidity pool address
     * @param _amount amount in underlying token
     * @return _nCoins number of underlying tokens in liquidity pool
     * @return _underlyingTokens underlying tokens in a liquidity pool
     * @return _amounts value in an underlying token for each underlying token
     * @return _codeLength number of function call required for deposit
     */
    function _getDepositCodeConfig(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    )
        internal
        view
        returns (
            uint256 _nCoins,
            address[8] memory _underlyingTokens,
            uint256[] memory _amounts,
            uint256 _codeLength
        )
    {
        _nCoins = nTokens[_liquidityPool];
        _underlyingTokens = underlyingCoins[_liquidityPool];
        _amounts = new uint256[](_nCoins);
        for (uint256 _i; _i < _nCoins; _i++) {
            if (_underlyingTokens[_i] == _underlyingToken) {
                _amounts[_i] = _getDepositAmount(
                    _liquidityPool,
                    _underlyingToken,
                    _amount,
                    getPoolValue(_liquidityPool, _underlyingToken)
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
}

// solhint-disable func-name-mixedcase
interface ICurveXSwap {
    function calc_withdraw_one_coin(
        uint256 _liquidityPoolTokenAmount,
        int128 _tokenIndex,
        bool _useUnderlying
    ) external view returns (uint256);
}

// solhint-enable func-name-mixedcase
