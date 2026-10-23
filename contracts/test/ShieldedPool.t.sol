// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ShieldedPool} from "../src/ShieldedPool.sol";
import {MockUSDG} from "../src/mocks/MockUSDG.sol";

contract ShieldedPoolTest is Test {
    ShieldedPool pool;
    MockUSDG usdg;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        vm.prank(owner);
        pool = new ShieldedPool(owner);

        usdg = new MockUSDG(address(this));
        usdg.transfer(alice, 10_000e18);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    // ---------- native ETH ----------

    function test_depositNative_creditsBalance() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        assertEq(pool.balanceOf(address(0), alice), 1 ether);
        assertEq(pool.totalShielded(address(0)), 1 ether);
    }

    function test_depositNative_revertsOnZero() public {
        vm.prank(alice);
        vm.expectRevert(ShieldedPool.ZeroAmount.selector);
        pool.depositNative{value: 0}();
    }

    function test_withdrawNative_toSelf() public {
        vm.prank(alice);
        pool.depositNative{value: 2 ether}();

        uint256 before = alice.balance;
        vm.prank(alice);
        pool.withdraw(address(0), 1 ether, alice);

        assertEq(alice.balance, before + 1 ether);
        assertEq(pool.balanceOf(address(0), alice), 1 ether);
        assertEq(pool.totalShielded(address(0)), 1 ether);
    }

    function test_withdrawNative_toDifferentAddress() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        address dest = makeAddr("dest");
        vm.prank(alice);
        pool.withdraw(address(0), 1 ether, dest);

        assertEq(dest.balance, 1 ether);
    }

    function test_withdraw_revertsIfInsufficientBalance() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ShieldedPool.InsufficientBalance.selector, 1 ether, 2 ether));
        pool.withdraw(address(0), 2 ether, alice);
    }

    function test_withdraw_revertsOnZeroAmount() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(ShieldedPool.ZeroAmount.selector);
        pool.withdraw(address(0), 0, alice);
    }

    function test_withdraw_revertsOnZeroAddress() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(ShieldedPool.ZeroAddress.selector);
        pool.withdraw(address(0), 1 ether, address(0));
    }

    /// @dev One user's balance can never be drained by another user's withdrawal.
    function test_withdraw_cannotDrainOtherUsersBalance() public {
        vm.prank(alice);
        pool.depositNative{value: 5 ether}();

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ShieldedPool.InsufficientBalance.selector, 0, 1 ether));
        pool.withdraw(address(0), 1 ether, bob);
    }

    // ---------- ERC-20 ----------

    function test_erc20_depositRequiresSupportedAsset() public {
        vm.prank(alice);
        usdg.approve(address(pool), 100e18);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ShieldedPool.AssetNotSupported.selector, address(usdg)));
        pool.deposit(address(usdg), 100e18);
    }

    function test_erc20_depositAndWithdraw() public {
        vm.prank(owner);
        pool.setAssetSupported(address(usdg), true);

        vm.startPrank(alice);
        usdg.approve(address(pool), 500e18);
        pool.deposit(address(usdg), 500e18);
        vm.stopPrank();

        assertEq(pool.balanceOf(address(usdg), alice), 500e18);
        assertEq(usdg.balanceOf(address(pool)), 500e18);

        vm.prank(alice);
        pool.withdraw(address(usdg), 200e18, alice);

        assertEq(usdg.balanceOf(alice), 10_000e18 - 500e18 + 200e18);
        assertEq(pool.balanceOf(address(usdg), alice), 300e18);
    }

    // ---------- access control ----------

    function test_onlyOwnerCanSetAssetSupport() public {
        vm.prank(alice);
        vm.expectRevert();
        pool.setAssetSupported(address(usdg), true);
    }

    function test_onlyOwnerCanPause() public {
        vm.prank(alice);
        vm.expectRevert();
        pool.pause();
    }

    // ---------- pause ----------

    function test_pause_blocksNewDeposits() public {
        vm.prank(owner);
        pool.pause();

        vm.prank(alice);
        vm.expectRevert();
        pool.depositNative{value: 1 ether}();
    }

    /// @dev Guardian pause must never block withdrawals — brief §48.
    function test_pause_doesNotBlockWithdrawals() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        vm.prank(owner);
        pool.pause();

        vm.prank(alice);
        pool.withdraw(address(0), 1 ether, alice);

        assertEq(pool.balanceOf(address(0), alice), 0);
    }

    // ---------- conservation invariant ----------

    function test_conservation_multipleUsersSumsToTotal() public {
        vm.prank(alice);
        pool.depositNative{value: 3 ether}();
        vm.prank(bob);
        pool.depositNative{value: 2 ether}();

        assertEq(
            pool.balanceOf(address(0), alice) + pool.balanceOf(address(0), bob),
            pool.totalShielded(address(0))
        );
        assertEq(address(pool).balance, pool.totalShielded(address(0)));
    }

    // ---------- internal transfer (Send) ----------

    function test_transfer_movesBalanceBetweenAccounts() public {
        vm.prank(alice);
        pool.depositNative{value: 5 ether}();

        vm.prank(alice);
        pool.transfer(address(0), bob, 2 ether);

        assertEq(pool.balanceOf(address(0), alice), 3 ether);
        assertEq(pool.balanceOf(address(0), bob), 2 ether);
        // total shielded is unchanged — nothing entered or left the pool.
        assertEq(pool.totalShielded(address(0)), 5 ether);
    }

    function test_transfer_revertsOnInsufficientBalance() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ShieldedPool.InsufficientBalance.selector, 1 ether, 2 ether));
        pool.transfer(address(0), bob, 2 ether);
    }

    function test_transfer_revertsOnZeroAddress() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(ShieldedPool.ZeroAddress.selector);
        pool.transfer(address(0), address(0), 1 ether);
    }

    function test_transfer_revertsOnSelfTransfer() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(ShieldedPool.SelfTransfer.selector);
        pool.transfer(address(0), alice, 1 ether);
    }

    function test_transfer_blockedWhenPaused() public {
        vm.prank(alice);
        pool.depositNative{value: 1 ether}();

        vm.prank(owner);
        pool.pause();

        vm.prank(alice);
        vm.expectRevert();
        pool.transfer(address(0), bob, 1 ether);
    }

    function test_transfer_doesNotChangeOnchainAssetBalance() public {
        vm.prank(alice);
        pool.depositNative{value: 4 ether}();

        uint256 poolBalanceBefore = address(pool).balance;
        vm.prank(alice);
        pool.transfer(address(0), bob, 4 ether);

        // A transfer is a pure ledger move: the pool's actual ETH holdings
        // must not change even though ownership inside the pool did.
        assertEq(address(pool).balance, poolBalanceBefore);
    }
}
