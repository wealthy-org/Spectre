// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {Groth16Verifier} from "../src/WithdrawVerifier.sol";

contract DeployWithdrawVerifier is Script {
    function run() external returns (Groth16Verifier verifier) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        verifier = new Groth16Verifier();
        vm.stopBroadcast();

        console.log("WithdrawVerifier deployed at:", address(verifier));
        console.log("Deployer:", deployer);
    }
}
