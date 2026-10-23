// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {TradeWaveManager} from "../src/waves/TradeWaveManager.sol";
import {MockUSDG} from "../src/mocks/MockUSDG.sol";
import {MockStockToken} from "../src/mocks/MockStockToken.sol";

contract TradeWaveManagerTest is Test {
    TradeWaveManager waveManager;
    MockUSDG usdg;
    MockStockToken nvda;

    address owner = makeAddr("owner");
    address operator = makeAddr("operator");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        vm.prank(owner);
        waveManager = new TradeWaveManager(owner, operator, 120);

        usdg = new MockUSDG(address(this));
        nvda = new MockStockToken("Nvidia Stock Token", "NVDA", address(this));

        // Fund Alice with USDG and Bob with NVDA
        usdg.transfer(alice, 50_000e18);
        nvda.transfer(bob, 500e18);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_initialWaveOpened() public view {
        assertEq(waveManager.currentWaveId(), 1);
        (uint256 id, uint256 openTime, uint256 lockTime, , TradeWaveManager.WaveStatus status, , ) = waveManager.waves(1);
        assertEq(id, 1);
        assertEq(status == TradeWaveManager.WaveStatus.Open, true);
        assertGt(lockTime, openTime);
    }

    function test_submitIntent_escrowsERC20() public {
        vm.startPrank(alice);
        usdg.approve(address(waveManager), 10_000e18);
        uint256 intentId = waveManager.submitIntent(
            address(usdg),
            address(nvda),
            10_000e18,
            70e18 // min 70 NVDA
        );
        vm.stopPrank();

        assertEq(intentId, 1);
        assertEq(usdg.balanceOf(address(waveManager)), 10_000e18);
        assertEq(waveManager.totalEscrowed(address(usdg)), 10_000e18);

        (, , address intentOwner, , , uint256 amountIn, uint256 minOut, , , , ) = waveManager.intents(intentId);
        assertEq(intentOwner, alice);
        assertEq(amountIn, 10_000e18);
        assertEq(minOut, 70e18);
    }

    function test_submitIntent_escrowsNativeETH() public {
        vm.prank(alice);
        uint256 intentId = waveManager.submitIntent{value: 2 ether}(
            address(0),
            address(usdg),
            2 ether,
            6_000e18
        );

        assertEq(intentId, 1);
        assertEq(address(waveManager).balance, 2 ether);
        assertEq(waveManager.totalEscrowed(address(0)), 2 ether);
    }

    function test_lockWave_advancesWaveId() public {
        // Warp past wave lock timestamp
        vm.warp(block.timestamp + 121);

        waveManager.lockCurrentWave();

        // Wave #1 is locked, current wave is now #2
        (, , , , TradeWaveManager.WaveStatus status1, , ) = waveManager.waves(1);
        assertEq(status1 == TradeWaveManager.WaveStatus.Locked, true);
        assertEq(waveManager.currentWaveId(), 2);
    }

    function test_settleWavePair_successfulNettingAndClaim() public {
        // Alice wants to buy NVDA with 14_000 USDG (min 100 NVDA) -> price <= 140
        vm.startPrank(alice);
        usdg.approve(address(waveManager), 14_000e18);
        waveManager.submitIntent(address(usdg), address(nvda), 14_000e18, 100e18);
        vm.stopPrank();

        // Bob wants to sell 100 NVDA for USDG (min 13_500 USDG) -> price >= 135
        vm.startPrank(bob);
        nvda.approve(address(waveManager), 100e18);
        waveManager.submitIntent(address(nvda), address(usdg), 100e18, 13_500e18);
        vm.stopPrank();

        // Lock wave 1
        vm.warp(block.timestamp + 121);
        waveManager.lockCurrentWave();

        // Operator funds wave settlement (or adapter executes)
        // Rate: 100 NVDA per 14,000 USDG => 1 NVDA = 140 USDG
        // fillRateNumerator = 100e18 (NVDA), fillRateDenominator = 14_000e18 (USDG)
        // Send tokens into wave manager for payout
        nvda.transfer(address(waveManager), 100e18);
        usdg.transfer(address(waveManager), 14_000e18);

        vm.prank(operator);
        waveManager.settleWavePair(
            1,
            address(usdg),
            address(nvda),
            100e18,
            14_000e18,
            10000, // 100% fill
            keccak256("WAVE_1_SETTLEMENT")
        );

        // Alice claims her 100 NVDA
        vm.prank(alice);
        waveManager.claim(address(nvda));
        assertEq(nvda.balanceOf(alice), 100e18);

        // Bob claims his 14,000 USDG
        vm.prank(bob);
        waveManager.claim(address(usdg));
        assertEq(usdg.balanceOf(bob), 14_000e18);
    }

    function test_settleWavePair_slippageProtection_refunds() public {
        // Alice specifies a strict slippage bound: at least 100 NVDA for 10_000 USDG (price <= 100)
        vm.startPrank(alice);
        usdg.approve(address(waveManager), 10_000e18);
        waveManager.submitIntent(address(usdg), address(nvda), 10_000e18, 100e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 121);
        waveManager.lockCurrentWave();

        // Clearing price is 140 USDG per NVDA (yields only ~71.4 NVDA for 10k USDG)
        vm.prank(operator);
        waveManager.settleWavePair(
            1,
            address(usdg),
            address(nvda),
            714e17, // ~71.4 NVDA
            10_000e18,
            10000,
            keccak256("WAVE_SLIPPAGE_FAIL")
        );

        // Alice's intent was refunded in full because 71.4 < 100 minAmountOut
        assertEq(waveManager.claimableBalance(address(usdg), alice), 10_000e18);

        vm.prank(alice);
        waveManager.claim(address(usdg));
        assertEq(usdg.balanceOf(alice), 50_000e18); // 100% refunded!
    }

    function test_settleWavePair_proRataPartialFill() public {
        // Alice buys with 10_000 USDG
        vm.startPrank(alice);
        usdg.approve(address(waveManager), 10_000e18);
        waveManager.submitIntent(address(usdg), address(nvda), 10_000e18, 50e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 121);
        waveManager.lockCurrentWave();

        // Partial fill: 60% fill ratio (6,000 USDG filled, 4,000 USDG refunded)
        nvda.transfer(address(waveManager), 60e18);

        vm.prank(operator);
        waveManager.settleWavePair(
            1,
            address(usdg),
            address(nvda),
            1e18,
            100e18, // 1 NVDA = 100 USDG
            6000,   // 60% fill
            keccak256("PARTIAL_FILL")
        );

        // Alice receives 60 NVDA + 4,000 USDG unspent refund
        assertEq(waveManager.claimableBalance(address(nvda), alice), 60e18);
        assertEq(waveManager.claimableBalance(address(usdg), alice), 4_000e18);
    }

    function test_cancelAndRefundWave_recoversAllUserFunds() public {
        vm.startPrank(alice);
        usdg.approve(address(waveManager), 20_000e18);
        waveManager.submitIntent(address(usdg), address(nvda), 20_000e18, 100e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 121);
        waveManager.lockCurrentWave();

        // Execution failed or venue down -> operator cancels wave
        vm.prank(operator);
        waveManager.cancelAndRefundWave(1);

        // Alice can immediately claim 100% of her funds back
        vm.prank(alice);
        waveManager.claim(address(usdg));
        assertEq(usdg.balanceOf(alice), 50_000e18);
    }

    function test_unauthorizedSettleReverts() public {
        vm.warp(block.timestamp + 121);
        waveManager.lockCurrentWave();

        vm.prank(alice); // Alice is not operator
        vm.expectRevert(TradeWaveManager.Unauthorized.selector);
        waveManager.settleWavePair(1, address(usdg), address(nvda), 1, 1, 10000, bytes32(0));
    }
}
