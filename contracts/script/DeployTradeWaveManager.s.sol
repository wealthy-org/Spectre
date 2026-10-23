// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {TradeWaveManager} from "../src/waves/TradeWaveManager.sol";
import {MockStockToken} from "../src/mocks/MockStockToken.sol";

/// @notice Deploys TradeWaveManager and MockStockTokens on Robinhood Chain Testnet.
/// Usage:
///   forge script script/DeployTradeWaveManager.s.sol \
///     --rpc-url robinhood_testnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY
contract DeployTradeWaveManager is Script {
    function run()
        external
        returns (
            TradeWaveManager manager,
            MockStockToken nvda,
            MockStockToken tsla
        )
    {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        // 120 seconds default wave duration
        manager = new TradeWaveManager(deployer, deployer, 120);
        nvda = new MockStockToken("Nvidia Stock Token", "NVDA", deployer);
        tsla = new MockStockToken("Tesla Stock Token", "TSLA", deployer);
        vm.stopBroadcast();

        console.log("TradeWaveManager deployed at:", address(manager));
        console.log("MockNVDA deployed at:", address(nvda));
        console.log("MockTSLA deployed at:", address(tsla));
    }
}
