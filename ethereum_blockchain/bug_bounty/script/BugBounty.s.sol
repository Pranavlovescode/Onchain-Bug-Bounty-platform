// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {BugBounty} from "../src/bug_bounty.sol";

contract CounterScript is Script {
    BugBounty public bugBounty;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        bugBounty = new BugBounty();

        vm.stopBroadcast();
    }
}


