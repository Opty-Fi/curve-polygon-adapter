// SPDX-License-Identifier:MIT
pragma solidity =0.8.11;

//  helper contracts
import "./utils/AdapterInvestLimitBase.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// interfaces
import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";
import { ICurveSwap } from "@optyfi/defi-legos/polygon/curve/contracts/ICurveSwap.sol";

/**
 * @title Adapter for Curve StableSwap pools on polygon
 * @author Opty.fi
 * @dev Abstraction layer to Curve's stableswap pools
 */

contract CurveDepositPoolAdapter is IAdapter, AdapterInvestLimitBase {
    using Address for address;

    /**@notice Curve aPool for use on Polygon */
    address public constant aPool = address(0x445FE580eF8d70FF569aB36e80c647af338db351);

    /**@notice amDAI (Aave Matic Market DAI) address */
    address public constant amDAI = address(0x27F8D03b3a2196956ED754baDc28D73be8830A6e);

    /**@notice amUSDC (Aave Matic Market USDC) address */
    address public constant amUSDC = address(0x1a13F4Ca1d028320A707D99520AbFefca3998b7F);

    /**@notice amUSDT (Aave Matic Market USDT) address */
    address public constant amUSDT = address(0x60D55F02A771d515e077c9C2403a1ef324885CeC);

    /**@notice PoS DAI stable coin address */
    address public constant DAI = address(0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063);

    /**@notice PoS USD coin address */
    address public constant USDC = address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);

    /**@notice PoS Tether USD address */
    address public constant USDT = address(0xc2132D05D31c914a87C6611C10748AEb04B58e8F);

    /**@dev input token index per pool*/
    mapping(address => mapping(address => int128)) public tokenIdexes;

    /**@dev assign number of input tokens per pool */
    mapping(address => uint256) public nTokens;

    /**@dev assign coins per pool */
    mapping(address => address[8]) public coins;

    /**@dev assign underlying coins per pool */
    mapping(address => address[8]) public underlyingCoins;

    /**@dev list of the wrapped tokens */
    mapping(address => bool) public wrappedTokens;

    /**@dev list of tokens that cannot accept zero allowance*/
    mapping(address => bool) public noZeroAllowanceAllowed;

    constructor(address _registry) AdapterModifiersBase(_registry) {
        wrappedTokens[amDAI] = true;
        wrappedTokens[amUSDC] = true;
        wrappedTokens[amUSDT] = true;
        tokenIdexes[aPool][DAI] = int128(0);
        tokenIdexes[aPool][amDAI] = int128(0);
        tokenIdexes[aPool][USDC] = int128(1);
        tokenIdexes[aPool][amUSDC] = int128(1);
        tokenIdexes[aPool][USDT] = int128(2);
        tokenIdexes[aPool][amUSDT] = int128(2);
        nTokens[aPool] = uint256(3);
        coins[aPool][0] = amDAI;
        coins[aPool][1] = amUSDC;
        coins[aPool][2] = amUSDT;
        underlyingCoins[aPool][0] = DAI;
        underlyingCoins[aPool][1] = USDC;
        underlyingCoins[aPool][2] = USDT;
    }

    /**
     * @notice set the wrapped token address only by operator
     * @param _tokens list of token contract address
     * @param _isWrapped whether the token is wrapped or not
     */
    function setWrappedTokens(address[] memory _tokens, bool[] memory _isWrapped) external onlyOperator {
        uint256 _nTokens = _tokens.length;
        require(_nTokens == _isWrapped.length, "!length");
        for (uint256 _i; _i < _nTokens; _i++) {
            require(_tokens[_i].isContract(), "!isContract");
            wrappedTokens[_tokens[_i]] = _isWrapped[_i];
        }
    }

    /**
     * @notice assign token index per liquidity pool
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
        require(_pools.length == _tokens.length && _tokens.length == _indexes.length, "!length");
        for (uint256 _i; _i < _nPools; _i++) {
            require(_pools[_i].isContract(), "!isContract");
            require(_tokens[_i].isContract(), "!isContract");
            tokenIdexes[_pools[_i]][_tokens[_i]] = _indexes[_i];
        }
    }

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
    function getPoolValue(address _liquidityPool, address _underlyingToken) public view returns (uint256) {
        uint256 _virtualPrice = ICurveSwap(_liquidityPool).get_virtual_price();
        uint256 _totalSupply = ERC20(_getLiquidityPoolToken(_liquidityPool)).totalSupply();
        // the pool value will be in USD for US dollar stablecoin pools
        // the pool value will be in BTC for BTC pools
        return (_virtualPrice * _totalSupply) / (10**18);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositSomeCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) external view returns (bytes[] memory _codes) {}

    /**
     * @inheritdoc IAdapter
     */
    function getDepositAllCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes) {}

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawSomeCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) external view returns (bytes[] memory _codes) {}

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawAllCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes) {}

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolToken(address _underlyingToken, address _liquidityPool) external view returns (address) {}

    /**
     * @inheritdoc IAdapter
     */
    function getUnderlyingTokens(address _liquidityPool, address _liquidityPoolToken)
        external
        view
        returns (address[] memory _underlyingTokens)
    {}

    /**
     * @inheritdoc IAdapter
     */
    function getAllAmountInToken(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (uint256) {}

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolTokenBalance(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (uint256) {}

    /**
     * @inheritdoc IAdapter
     */
    function getSomeAmountInToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) external view returns (uint256) {}

    /**
     * @inheritdoc IAdapter
     */
    function calculateAmountInLPToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _underlyingTokenAmount
    ) external view returns (uint256) {}

    /**
     * @inheritdoc IAdapter
     */
    function calculateRedeemableLPTokenAmount(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (uint256 _amount) {}

    /**
     * @inheritdoc IAdapter
     */
    function isRedeemableAmountSufficient(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (bool) {}

    /**
     * @inheritdoc IAdapter
     */
    function getRewardToken(address _liquidityPool) external view returns (address) {
        return address(0);
    }

    /**
     * @inheritdoc IAdapter
     */
    function canStake(address _liquidityPool) external view returns (bool) {
        return false;
    }

    /**
     * @dev Retrieves liquidity pool token address
     * @param _liquidityPool address of the curve swap pool contract
     * @return address of the liquidity pool token
     */
    function _getLiquidityPoolToken(address _liquidityPool) internal view returns (address) {
        return ICurveSwap(_liquidityPool).lp_token();
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
            uint256 _codeLength,
            uint256 _minAmount
        )
    {
        _nCoins = nTokens[_liquidityPool];
        _underlyingTokens = wrappedTokens[_underlyingToken] ? coins[_liquidityPool] : underlyingCoins[_liquidityPool];
        _amounts = new uint256[](_nCoins);
        _codeLength = 1;
        for (uint256 _i; _i < _nCoins; _i++) {
            if (_underlyingTokens[_i] == _underlyingToken) {
                _amounts[_i] = _getDepositAmount(
                    _liquidityPool,
                    _underlyingToken,
                    _amount,
                    getPoolValue(_liquidityPool, _underlyingToken)
                );
                uint256 _decimals = ERC20(_underlyingToken).decimals();
                _minAmount =
                    (_amounts[_i] * 10**(uint256(36) - _decimals) * 95) /
                    (ICurveSwap(_liquidityPool).get_virtual_price() * 100);

                if (_amounts[_i] > 0) {
                    if (noZeroAllowanceAllowed[_underlyingTokens[_i]]) {
                        _codeLength++;
                    } else {
                        _codeLength += 2;
                    }
                }
            }
        }
    }
}
