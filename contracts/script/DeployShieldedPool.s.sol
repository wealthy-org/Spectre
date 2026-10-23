// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {ShieldedPool} from "../src/ShieldedPool.sol";
import {MockUSDG} from "../src/mocks/MockUSDG.sol";

/// @notice Deploys ShieldedPool + a testnet MockUSDG, and wires the latter
/// as a supported asset. Usage (testnet only — see README.md in this folder):
///   forge script script/DeployShieldedPool.s.sol \
///     --rpc-url robinhood_testnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY
contract DeployShieldedPool is Script {
    function run() external returns (ShieldedPool pool, MockUSDG usdg) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        pool = new ShieldedPool(deployer);
        usdg = new MockUSDG(deployer);
        pool.setAssetSupported(address(usdg), true);
        vm.stopBroadcast();

        console.log("ShieldedPool deployed at:", address(pool));
        console.log("MockUSDG deployed at:", address(usdg));
        console.log("Owner:", deployer);
    }
}
