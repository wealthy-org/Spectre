// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TradeWaveManager — Phase 1 Transparent Trade Wave Prototype
/// @notice Implements the batching, netting, and pro-rata execution primitive
/// described in PRIVATE_MARKETS_ROBINHOOD_CHAIN_DEVELOPER_BRIEF.md §23–§35.
/// Trade intents accumulate during scheduled windows rather than executing
/// individually onchain.
contract TradeWaveManager is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant NATIVE_ASSET = address(0);

    enum WaveStatus {
        Open,
        Locked,
        Settled,
        Cancelled
    }

    struct TradeIntent {
        uint256 intentId;
        uint256 waveId;
        address owner;
        address assetIn;
        address assetOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 filledIn;
        uint256 filledOut;
        bool settled;
        bool refunded;
    }

    struct Wave {
        uint256 id;
        uint256 openTimestamp;
        uint256 lockTimestamp;
        uint256 settleTimestamp;
        WaveStatus status;
        uint256 totalIntents;
        bytes32 settlementRoot;
    }

    uint256 public currentWaveId;
    uint256 public waveDuration; // default e.g. 120 seconds (2 minutes per brief §29)
    uint256 public nextIntentId;

    mapping(uint256 waveId => Wave) public waves;
    mapping(uint256 waveId => uint256[]) private _waveIntentIds;
    mapping(uint256 intentId => TradeIntent) public intents;
    mapping(address asset => mapping(address account => uint256 amount)) public claimableBalance;
    mapping(address asset => uint256 total) public totalEscrowed;

    address public operator; // Authorized scheduler service

    event WaveOpened(uint256 indexed waveId, uint256 lockTimestamp);
    event WaveLocked(uint256 indexed waveId);
    event WaveSettled(
        uint256 indexed waveId,
        address indexed assetA,
        address indexed assetB,
        uint256 aggregateVolumeA,
        uint256 aggregateVolumeB,
        bytes32 settlementRoot
    );
    event WaveCancelled(uint256 indexed waveId);
    event IntentSubmitted(
        uint256 indexed waveId,
        uint256 indexed intentId,
        address indexed owner,
        address assetIn,
        address assetOut,
        uint256 amountIn,
        uint256 minAmountOut
    );
    event IntentSettled(
        uint256 indexed waveId,
        uint256 indexed intentId,
        uint256 filledIn,
        uint256 filledOut,
        uint256 refundedIn
    );
    event BalanceClaimed(address indexed asset, address indexed account, uint256 amount);
    event OperatorUpdated(address indexed newOperator);
    event WaveDurationUpdated(uint256 newDuration);

    error WaveNotOpen(uint256 waveId);
    error WaveNotLocked(uint256 waveId);
    error WaveAlreadySettled(uint256 waveId);
    error InvalidWaveDuration();
    error ZeroAmount();
    error ZeroAddress();
    error IdenticalAssets();
    error NativeMismatch(uint256 sent, uint256 expected);
    error NativeTransferFailed();
    error Unauthorized();
    error SlippageExceeded(uint256 received, uint256 minimum);
    error InsufficientBalance(uint256 available, uint256 requested);

    modifier onlyOperatorOrOwner() {
        if (msg.sender != operator && msg.sender != owner()) revert Unauthorized();
        _;
    }

    constructor(
        address initialOwner,
        address initialOperator,
        uint256 initialDurationSeconds
    ) Ownable(initialOwner) {
        if (initialDurationSeconds == 0) revert InvalidWaveDuration();
        operator = initialOperator;
        waveDuration = initialDurationSeconds;

        // Open initial Wave #1
        _openWave(1);
    }

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert ZeroAddress();
        operator = newOperator;
        emit OperatorUpdated(newOperator);
    }

    function setWaveDuration(uint256 newDuration) external onlyOwner {
        if (newDuration == 0) revert InvalidWaveDuration();
        waveDuration = newDuration;
        emit WaveDurationUpdated(newDuration);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Submit a private trade intent into the currently open Trade Wave.
    /// Assets are escrowed immediately; if execution fails or slippage bounds
    /// cannot be satisfied, funds are refunded in full (brief §27, §28).
    function submitIntent(
        address assetIn,
        address assetOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external payable nonReentrant whenNotPaused returns (uint256 intentId) {
        if (amountIn == 0) revert ZeroAmount();
        if (assetIn == assetOut) revert IdenticalAssets();

        Wave storage wave = waves[currentWaveId];
        if (wave.status != WaveStatus.Open) revert WaveNotOpen(currentWaveId);

        // Collect asset into escrow
        if (assetIn == NATIVE_ASSET) {
            if (msg.value != amountIn) revert NativeMismatch(msg.value, amountIn);
        } else {
            if (msg.value != 0) revert NativeMismatch(msg.value, 0);
            IERC20(assetIn).safeTransferFrom(msg.sender, address(this), amountIn);
        }

        totalEscrowed[assetIn] += amountIn;

        intentId = ++nextIntentId;
        intents[intentId] = TradeIntent({
            intentId: intentId,
            waveId: currentWaveId,
            owner: msg.sender,
            assetIn: assetIn,
            assetOut: assetOut,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            filledIn: 0,
            filledOut: 0,
            settled: false,
            refunded: false
        });

        _waveIntentIds[currentWaveId].push(intentId);
        wave.totalIntents++;

        emit IntentSubmitted(
            currentWaveId,
            intentId,
            msg.sender,
            assetIn,
            assetOut,
            amountIn,
            minAmountOut
        );

        // Check if wave is ready to auto-lock by timestamp
        if (block.timestamp >= wave.lockTimestamp) {
            _lockAndAdvanceWave();
        }
    }

    /// @notice Lock the active wave when its window expires, advancing to the next wave.
    function lockCurrentWave() external {
        Wave storage wave = waves[currentWaveId];
        if (wave.status != WaveStatus.Open) revert WaveNotOpen(currentWaveId);
        if (block.timestamp < wave.lockTimestamp && msg.sender != operator && msg.sender != owner()) {
            revert Unauthorized();
        }

        _lockAndAdvanceWave();
    }

    /// @notice Settle a pair of assets within a locked wave.
    /// @dev Calculates netted fills. If rate violates an intent's minAmountOut,
    /// that intent is fully refunded. Supported for any pair A <-> B.
    function settleWavePair(
        uint256 waveId,
        address assetA,
        address assetB,
        uint256 fillRateNumerator, // units of assetB per fillRateDenominator of assetA
        uint256 fillRateDenominator,
        uint256 fillRatioBps, // e.g. 10000 = 100% partial fill, 8000 = 80% fill
        bytes32 settlementRoot
    ) external onlyOperatorOrOwner nonReentrant {
        Wave storage wave = waves[waveId];
        if (wave.status != WaveStatus.Locked) revert WaveNotLocked(waveId);
        if (fillRateNumerator == 0 || fillRateDenominator == 0) revert ZeroAmount();
        if (fillRatioBps > 10000) revert InvalidWaveDuration();

        uint256[] storage ids = _waveIntentIds[waveId];
        uint256 aggregateVolumeA = 0;
        uint256 aggregateVolumeB = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            (uint256 va, uint256 vb) = _settleSingleIntent(
                waveId,
                ids[i],
                assetA,
                assetB,
                fillRateNumerator,
                fillRateDenominator,
                fillRatioBps
            );
            aggregateVolumeA += va;
            aggregateVolumeB += vb;
        }

        wave.status = WaveStatus.Settled;
        wave.settleTimestamp = block.timestamp;
        wave.settlementRoot = settlementRoot;

        emit WaveSettled(
            waveId,
            assetA,
            assetB,
            aggregateVolumeA,
            aggregateVolumeB,
            settlementRoot
        );
    }

    /// @notice Emergency recovery: cancel wave and refund all un-settled participants (brief §28).
    function cancelAndRefundWave(uint256 waveId) external onlyOperatorOrOwner nonReentrant {
        Wave storage wave = waves[waveId];
        if (wave.status == WaveStatus.Settled) revert WaveAlreadySettled(waveId);

        wave.status = WaveStatus.Cancelled;
        uint256[] storage ids = _waveIntentIds[waveId];

        for (uint256 i = 0; i < ids.length; i++) {
            TradeIntent storage intent = intents[ids[i]];
            if (!intent.settled && !intent.refunded) {
                _refundIntent(intent);
            }
        }

        emit WaveCancelled(waveId);
    }

    /// @notice Withdraw claimed output balances or refunds.
    function claim(address asset) external nonReentrant {
        uint256 amount = claimableBalance[asset][msg.sender];
        if (amount == 0) revert ZeroAmount();

        claimableBalance[asset][msg.sender] = 0;
        emit BalanceClaimed(asset, msg.sender, amount);

        if (asset == NATIVE_ASSET) {
            (bool ok,) = msg.sender.call{value: amount}("");
            if (!ok) revert NativeTransferFailed();
        } else {
            IERC20(asset).safeTransfer(msg.sender, amount);
        }
    }

    function getWaveIntents(uint256 waveId) external view returns (uint256[] memory) {
        return _waveIntentIds[waveId];
    }

    function _settleSingleIntent(
        uint256 waveId,
        uint256 intentId,
        address assetA,
        address assetB,
        uint256 rateNum,
        uint256 rateDen,
        uint256 fillBps
    ) internal returns (uint256 volA, uint256 volB) {
        TradeIntent storage intent = intents[intentId];
        if (intent.settled || intent.refunded) return (0, 0);

        if (intent.assetIn == assetA && intent.assetOut == assetB) {
            uint256 effIn = (intent.amountIn * fillBps) / 10000;
            uint256 expOut = (effIn * rateNum) / rateDen;
            if (expOut < (intent.minAmountOut * fillBps) / 10000) {
                _refundIntent(intent);
                return (0, 0);
            }
            uint256 refIn = intent.amountIn - effIn;
            intent.filledIn = effIn;
            intent.filledOut = expOut;
            intent.settled = true;

            totalEscrowed[assetA] -= intent.amountIn;
            claimableBalance[assetB][intent.owner] += expOut;
            if (refIn > 0) claimableBalance[assetA][intent.owner] += refIn;

            emit IntentSettled(waveId, intent.intentId, effIn, expOut, refIn);
            return (effIn, expOut);
        } else if (intent.assetIn == assetB && intent.assetOut == assetA) {
            uint256 effIn = (intent.amountIn * fillBps) / 10000;
            uint256 expOut = (effIn * rateDen) / rateNum;
            if (expOut < (intent.minAmountOut * fillBps) / 10000) {
                _refundIntent(intent);
                return (0, 0);
            }
            uint256 refIn = intent.amountIn - effIn;
            intent.filledIn = effIn;
            intent.filledOut = expOut;
            intent.settled = true;

            totalEscrowed[assetB] -= intent.amountIn;
            claimableBalance[assetA][intent.owner] += expOut;
            if (refIn > 0) claimableBalance[assetB][intent.owner] += refIn;

            emit IntentSettled(waveId, intent.intentId, effIn, expOut, refIn);
            return (expOut, effIn);
        }
        return (0, 0);
    }

    function _refundIntent(TradeIntent storage intent) internal {
        intent.refunded = true;
        totalEscrowed[intent.assetIn] -= intent.amountIn;
        claimableBalance[intent.assetIn][intent.owner] += intent.amountIn;
        emit IntentSettled(intent.waveId, intent.intentId, 0, 0, intent.amountIn);
    }

    function _openWave(uint256 waveId) internal {
        currentWaveId = waveId;
        uint256 lockTime = block.timestamp + waveDuration;
        waves[waveId] = Wave({
            id: waveId,
            openTimestamp: block.timestamp,
            lockTimestamp: lockTime,
            settleTimestamp: 0,
            status: WaveStatus.Open,
            totalIntents: 0,
            settlementRoot: bytes32(0)
        });

        emit WaveOpened(waveId, lockTime);
    }

    function _lockAndAdvanceWave() internal {
        waves[currentWaveId].status = WaveStatus.Locked;
        emit WaveLocked(currentWaveId);

        _openWave(currentWaveId + 1);
    }

    receive() external payable {
        revert Unauthorized();
    }
}
