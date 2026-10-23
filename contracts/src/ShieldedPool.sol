// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ShieldedPool — Phase A transparent prototype
/// @notice Public balances are a deliberate, temporary simplification
/// (see PRIVATE_MARKETS_ROBINHOOD_CHAIN_DEVELOPER_BRIEF.md §14, §66).
/// This proves deposit/withdraw accounting is correct *before* it is
/// replaced with commitments + nullifiers + ZK proofs in Phase 2. Do not
/// treat `balanceOf` as a privacy guarantee — it is intentionally public.
contract ShieldedPool is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev address(0) represents the native asset (ETH on Robinhood Chain).
    address public constant NATIVE_ASSET = address(0);

    mapping(address asset => bool supported) public supportedAssets;
    mapping(address asset => mapping(address owner => uint256 amount)) public balanceOf;
    mapping(address asset => uint256 total) public totalShielded;

    event AssetSupportSet(address indexed asset, bool supported);
    event Deposited(address indexed asset, address indexed owner, uint256 amount);
    event Withdrawn(address indexed asset, address indexed owner, address indexed to, uint256 amount);
    event Transferred(address indexed asset, address indexed from, address indexed to, uint256 amount);

    error AssetNotSupported(address asset);
    error ZeroAmount();
    error InsufficientBalance(uint256 available, uint256 requested);
    error NativeAmountMismatch(uint256 sent, uint256 expected);
    error NativeTransferFailed();
    error ZeroAddress();
    error SelfTransfer();

    constructor(address initialOwner) Ownable(initialOwner) {
        supportedAssets[NATIVE_ASSET] = true;
        emit AssetSupportSet(NATIVE_ASSET, true);
    }

    /// @notice Multisig-gated per the admin matrix (brief §47) — never the deployer alone in production.
    function setAssetSupported(address asset, bool supported) external onlyOwner {
        supportedAssets[asset] = supported;
        emit AssetSupportSet(asset, supported);
    }

    /// @notice Guardian pause — blocks new deposits/trades, never blocks withdrawals (brief §48).
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Shield an ERC-20 asset into the pool. Caller must have approved this contract first.
    function deposit(address asset, uint256 amount) external nonReentrant whenNotPaused {
        if (asset == NATIVE_ASSET) revert AssetNotSupported(asset);
        if (!supportedAssets[asset]) revert AssetNotSupported(asset);
        if (amount == 0) revert ZeroAmount();

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        balanceOf[asset][msg.sender] += amount;
        totalShielded[asset] += amount;

        emit Deposited(asset, msg.sender, amount);
    }

    /// @notice Shield native ETH into the pool.
    function depositNative() external payable nonReentrant whenNotPaused {
        if (!supportedAssets[NATIVE_ASSET]) revert AssetNotSupported(NATIVE_ASSET);
        if (msg.value == 0) revert ZeroAmount();

        balanceOf[NATIVE_ASSET][msg.sender] += msg.value;
        totalShielded[NATIVE_ASSET] += msg.value;

        emit Deposited(NATIVE_ASSET, msg.sender, msg.value);
    }

    /// @notice Withdraw a previously shielded balance. Never pausable — see brief §48.
    function withdraw(address asset, uint256 amount, address to) external nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 available = balanceOf[asset][msg.sender];
        if (amount == 0) revert ZeroAmount();
        if (amount > available) revert InsufficientBalance(available, amount);

        balanceOf[asset][msg.sender] = available - amount;
        totalShielded[asset] -= amount;

        emit Withdrawn(asset, msg.sender, to, amount);

        if (asset == NATIVE_ASSET) {
            (bool ok,) = to.call{value: amount}("");
            if (!ok) revert NativeTransferFailed();
        } else {
            IERC20(asset).safeTransfer(to, amount);
        }
    }

    /// @notice Move a shielded balance to another private account without ever
    /// touching the underlying asset. Phase A: this is a plain internal
    /// ledger move — it does not hide sender/recipient (see brief §15, §70).
    function transfer(address asset, address to, uint256 amount) external nonReentrant whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (to == msg.sender) revert SelfTransfer();

        uint256 available = balanceOf[asset][msg.sender];
        if (amount == 0) revert ZeroAmount();
        if (amount > available) revert InsufficientBalance(available, amount);

        balanceOf[asset][msg.sender] = available - amount;
        balanceOf[asset][to] += amount;

        emit Transferred(asset, msg.sender, to, amount);
    }

    /// @dev Reject stray ETH sent outside depositNative() so balances can't silently drift.
    receive() external payable {
        revert AssetNotSupported(NATIVE_ASSET);
    }
}
