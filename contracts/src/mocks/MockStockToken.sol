// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet-only mock Stock Token (e.g. NVDA, TSLA, AAPL) for Trade Wave testing.
contract MockStockToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        address initialHolder
    ) ERC20(name, symbol) {
        if (initialHolder != address(0)) {
            _mint(initialHolder, 100_000e18);
        }
    }

    /// @notice Open faucet so anyone testing Trade Waves can mint test shares.
    function faucet(uint256 amount) external {
        require(amount <= 1_000e18, "faucet: max 1,000 shares per call");
        _mint(msg.sender, amount);
    }
}
