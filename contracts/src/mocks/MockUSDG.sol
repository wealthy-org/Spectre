// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet-only mock stablecoin so Shield/Withdraw flows can be
/// exercised against an ERC-20 asset, not just native ETH. Not USDG itself —
/// no such token exists on Robinhood Chain testnet.
contract MockUSDG is ERC20 {
    constructor(address initialHolder) ERC20("Mock USDG (testnet)", "mUSDG") {
        _mint(initialHolder, 1_000_000e18);
    }

    /// @notice Open faucet so anyone testing the app can mint themselves test tokens.
    function faucet(uint256 amount) external {
        require(amount <= 10_000e18, "faucet: max 10,000 mUSDG per call");
        _mint(msg.sender, amount);
    }
}
