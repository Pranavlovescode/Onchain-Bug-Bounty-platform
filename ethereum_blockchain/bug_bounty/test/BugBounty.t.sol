// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {BugBounty} from "../src/bug_bounty.sol";

contract BugBountyTest is Test {
    BugBounty public bugBounty;

    address owner = makeAddr("owner");
    address researcher = makeAddr("researcher");
    address voter1 = makeAddr("voter1");
    address voter2 = makeAddr("voter2");
    address voter3 = makeAddr("voter3");
    address voter4 = makeAddr("voter4");
    address voter5 = makeAddr("voter5");

    function setUp() public {
        bugBounty = new BugBounty();

        vm.deal(owner, 10 ether);
        vm.prank(owner);
        bugBounty.createBugBountyProgram{value: 5 ether}(
            "Test Program",
            "A test bug bounty program",
            1 ether,   // critical
            0.5 ether, // high
            0.2 ether, // moderate
            0.1 ether  // low
        );
    }

    // ========================================
    // createBugBountyProgram
    // ========================================

    function test_CreateBugBountyProgram() public view {
        (
            string memory name,
            string memory description,
            address programOwner,
            bool isActive,
            uint256 criticalReward,
            uint256 highReward,
            uint256 moderateReward,
            uint256 lowReward,
            uint256 totalFunded,
            uint256 totalPaid,
            uint256 createdAt
        ) = bugBounty.programs(0);

        assertEq(name, "Test Program");
        assertEq(description, "A test bug bounty program");
        assertEq(programOwner, owner);
        assertTrue(isActive);
        assertEq(criticalReward, 1 ether);
        assertEq(highReward, 0.5 ether);
        assertEq(moderateReward, 0.2 ether);
        assertEq(lowReward, 0.1 ether);
        assertEq(totalFunded, 5 ether);
        assertEq(totalPaid, 0);
        assertGt(createdAt, 0);
    }

    function test_CreateMultiplePrograms() public {
        vm.prank(owner);
        bugBounty.createBugBountyProgram{value: 1 ether}(
            "Second Program", "Another program",
            2 ether, 1 ether, 0.5 ether, 0.1 ether
        );
        assertEq(bugBounty.programId(), 2);
    }

    function test_CreateProgramWithZeroFunding() public {
        vm.prank(owner);
        bugBounty.createBugBountyProgram(
            "No Funding", "Zero funded",
            1 ether, 0.5 ether, 0.2 ether, 0.1 ether
        );
        (, , , , , , , , uint256 totalFunded, ,) = bugBounty.programs(1);
        assertEq(totalFunded, 0);
    }

    function test_ProgramIdIncrementsCorrectly() public view {
        assertEq(bugBounty.programId(), 1);
    }

    // ========================================
    // submitReport
    // ========================================

    function test_SubmitReport() public {
        address returned = bugBounty.submitReport(
            0, researcher, BugBounty.SeverityLevel.Critical, "QmTestHash123"
        );

        assertEq(returned, researcher);
        assertEq(bugBounty.reportId(), 1);

        (
            uint256 progId,
            address reportResearcher,
            BugBounty.SeverityLevel severity,
            string memory ipfsHash,
            bool approved,
            bool paid,
            uint256 createdAt,
            uint256 approvedVote,
            uint256 rejectedVote,
            uint256 votingDeadline,
            bool finalized
        ) = bugBounty.reports(0);

        assertEq(progId, 0);
        assertEq(reportResearcher, researcher);
        assertEq(uint256(severity), uint256(BugBounty.SeverityLevel.Critical));
        assertEq(ipfsHash, "QmTestHash123");
        assertFalse(approved);
        assertFalse(paid);
        assertGt(createdAt, 0);
        assertEq(approvedVote, 0);
        assertEq(rejectedVote, 0);
        assertEq(votingDeadline, createdAt + 7 days);
        assertFalse(finalized);
    }

    function test_SubmitMultipleReports() public {
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.Critical, "QmHash1");
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.Low, "QmHash2");
        assertEq(bugBounty.reportId(), 2);
    }

    function test_SubmitReportAllSeverities() public {
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.Critical, "QmCrit");
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.High, "QmHigh");
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.Moderate, "QmMod");
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.Low, "QmLow");
        assertEq(bugBounty.reportId(), 4);
    }

    function test_RevertSubmitReport_InvalidProgram() public {
        vm.expectRevert("Program does not exist");
        bugBounty.submitReport(999, researcher, BugBounty.SeverityLevel.High, "QmHash");
    }

    function test_RevertSubmitReport_ZeroAddress() public {
        vm.expectRevert("Invalid researcher address");
        bugBounty.submitReport(0, address(0), BugBounty.SeverityLevel.High, "QmHash");
    }

    function test_RevertSubmitReport_EmptyIpfsHash() public {
        vm.expectRevert("IPFS hash cannot be empty");
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.High, "");
    }

    // ========================================
    // vote
    // ========================================

    function _createReport() internal {
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.Critical, "QmTestHash");
    }

    function test_VoteApprove() public {
        _createReport();

        vm.prank(voter1);
        bugBounty.vote(0, true);

        (, , , , , , , uint256 approvedVote, , ,) = bugBounty.reports(0);
        assertEq(approvedVote, 1);
        assertTrue(bugBounty.hasVoted(0, voter1));
    }

    function test_VoteReject() public {
        _createReport();

        vm.prank(voter1);
        bugBounty.vote(0, false);

        (, , , , , , , , uint256 rejectedVote, ,) = bugBounty.reports(0);
        assertEq(rejectedVote, 1);
        assertTrue(bugBounty.hasVoted(0, voter1));
    }

    function test_MultipleVotersApprove() public {
        _createReport();

        vm.prank(voter1);
        bugBounty.vote(0, true);
        vm.prank(voter2);
        bugBounty.vote(0, true);
        vm.prank(voter3);
        bugBounty.vote(0, true);

        (, , , , , , , uint256 approvedVote, , ,) = bugBounty.reports(0);
        assertEq(approvedVote, 3);
    }

    function test_MixedVotes() public {
        _createReport();

        vm.prank(voter1);
        bugBounty.vote(0, true);
        vm.prank(voter2);
        bugBounty.vote(0, false);
        vm.prank(voter3);
        bugBounty.vote(0, true);

        (, , , , , , , uint256 approvedVote, uint256 rejectedVote, ,) = bugBounty.reports(0);
        assertEq(approvedVote, 2);
        assertEq(rejectedVote, 1);
    }

    function test_VoteDoesNotAutoApprove() public {
        _createReport();

        // Even with 3+ approve votes, report should NOT be approved before finalization
        vm.prank(voter1);
        bugBounty.vote(0, true);
        vm.prank(voter2);
        bugBounty.vote(0, true);
        vm.prank(voter3);
        bugBounty.vote(0, true);

        (, , , , bool approved, , , , , , bool finalized) = bugBounty.reports(0);
        assertFalse(approved);
        assertFalse(finalized);
    }

    function test_RevertVote_InvalidReport() public {
        vm.expectRevert("Invalid report");
        vm.prank(voter1);
        bugBounty.vote(999, true);
    }

    function test_RevertVote_DoubleVote() public {
        _createReport();

        vm.prank(voter1);
        bugBounty.vote(0, true);

        vm.expectRevert("Already voted");
        vm.prank(voter1);
        bugBounty.vote(0, true);
    }

    function test_RevertVote_DoubleVoteDifferentDirection() public {
        _createReport();

        vm.prank(voter1);
        bugBounty.vote(0, true);

        vm.expectRevert("Already voted");
        vm.prank(voter1);
        bugBounty.vote(0, false);
    }

    function test_RevertVote_AfterDeadline() public {
        _createReport();

        vm.warp(block.timestamp + 7 days + 1);

        vm.expectRevert("Voting ended");
        vm.prank(voter1);
        bugBounty.vote(0, true);
    }

    function test_VoteRightBeforeDeadline() public {
        _createReport();

        vm.warp(block.timestamp + 7 days - 1);

        vm.prank(voter1);
        bugBounty.vote(0, true);

        (, , , , , , , uint256 approvedVote, , ,) = bugBounty.reports(0);
        assertEq(approvedVote, 1);
    }

    // ========================================
    // finalizeReport
    // ========================================

    function test_FinalizeReport_Approved() public {
        _createReport();

        vm.prank(voter1);
        bugBounty.vote(0, true);
        vm.prank(voter2);
        bugBounty.vote(0, true);
        vm.prank(voter3);
        bugBounty.vote(0, true);

        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        (, , , , bool approved, , , , , , bool finalized) = bugBounty.reports(0);
        assertTrue(approved);
        assertTrue(finalized);
    }

    function test_FinalizeReport_Rejected_NotEnoughVotes() public {
        _createReport();

        // More rejects than approves — report should not be approved
        vm.prank(voter1);
        bugBounty.vote(0, false);
        vm.prank(voter2);
        bugBounty.vote(0, false);
        vm.prank(voter3);
        bugBounty.vote(0, true);

        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        (, , , , bool approved, , , , , , bool finalized) = bugBounty.reports(0);
        assertFalse(approved); // 1 approve is NOT > 2 rejects
        assertTrue(finalized);
    }

    function test_FinalizeReport_Rejected_MoreRejects() public {
        _createReport();

        // 3 approve, 4 reject
        vm.prank(voter1);
        bugBounty.vote(0, true);
        vm.prank(voter2);
        bugBounty.vote(0, true);
        vm.prank(voter3);
        bugBounty.vote(0, true);
        vm.prank(voter4);
        bugBounty.vote(0, false);
        vm.prank(voter5);
        bugBounty.vote(0, false);
        address voter6 = makeAddr("voter6");
        vm.prank(voter6);
        bugBounty.vote(0, false);
        address voter7 = makeAddr("voter7");
        vm.prank(voter7);
        bugBounty.vote(0, false);

        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        (, , , , bool approved, , , uint256 approvedVote, uint256 rejectedVote, , bool finalized) = bugBounty.reports(0);
        assertEq(approvedVote, 3);
        assertEq(rejectedVote, 4);
        assertFalse(approved);
        assertTrue(finalized);
    }

    function test_FinalizeReport_Rejected_NoVotes() public {
        _createReport();

        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        (, , , , bool approved, , , , , , bool finalized) = bugBounty.reports(0);
        assertFalse(approved);
        assertTrue(finalized);
    }

    function test_FinalizeReport_ApprovedExactThreshold() public {
        _createReport();

        // 3 approve, 2 reject
        vm.prank(voter1);
        bugBounty.vote(0, true);
        vm.prank(voter2);
        bugBounty.vote(0, true);
        vm.prank(voter3);
        bugBounty.vote(0, true);
        vm.prank(voter4);
        bugBounty.vote(0, false);
        vm.prank(voter5);
        bugBounty.vote(0, false);

        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        (, , , , bool approved, , , , , , bool finalized) = bugBounty.reports(0);
        assertTrue(approved); // 3 >= 3 && 3 > 2
        assertTrue(finalized);
    }

    function test_FinalizeReport_Rejected_EqualVotes() public {
        _createReport();

        // 3 approve, 3 reject — threshold met but approve NOT > reject
        vm.prank(voter1);
        bugBounty.vote(0, true);
        vm.prank(voter2);
        bugBounty.vote(0, true);
        vm.prank(voter3);
        bugBounty.vote(0, true);
        vm.prank(voter4);
        bugBounty.vote(0, false);
        vm.prank(voter5);
        bugBounty.vote(0, false);
        address voter6 = makeAddr("voter6");
        vm.prank(voter6);
        bugBounty.vote(0, false);

        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        (, , , , bool approved, , , uint256 approvedVote, uint256 rejectedVote, , bool finalized) = bugBounty.reports(0);
        assertEq(approvedVote, 3);
        assertEq(rejectedVote, 3);
        assertFalse(approved); // 3 is NOT > 3
        assertTrue(finalized);
    }

    function test_RevertFinalize_VotingStillActive() public {
        _createReport();

        vm.expectRevert("Voting still active");
        bugBounty.finalizeReport(0);
    }

    function test_RevertFinalize_AlreadyFinalized() public {
        _createReport();

        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        vm.expectRevert("Already finalized");
        bugBounty.finalizeReport(0);
    }

    function test_FinalizeExactlyAtDeadline() public {
        _createReport();

        (, , , , , , , , , uint256 votingDeadline,) = bugBounty.reports(0);
        vm.warp(votingDeadline);

        bugBounty.finalizeReport(0);

        (, , , , , , , , , , bool finalized) = bugBounty.reports(0);
        assertTrue(finalized);
    }

    // ========================================
    // End-to-end scenarios
    // ========================================

    function test_E2E_FullApprovalFlow() public {
        // 1. Submit report
        vm.prank(researcher);
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.High, "QmE2EHash");

        // 2. Community votes
        vm.prank(voter1);
        bugBounty.vote(0, true);
        vm.prank(voter2);
        bugBounty.vote(0, true);
        vm.prank(voter3);
        bugBounty.vote(0, false);
        vm.prank(voter4);
        bugBounty.vote(0, true);

        // 3. Finalize after deadline
        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        // 4. Verify
        (, , , , bool approved, , , uint256 approvedVote, uint256 rejectedVote, , bool finalized) = bugBounty.reports(0);
        assertTrue(approved);
        assertTrue(finalized);
        assertEq(approvedVote, 3);
        assertEq(rejectedVote, 1);
    }

    function test_E2E_FullRejectionFlow() public {
        bugBounty.submitReport(0, researcher, BugBounty.SeverityLevel.Low, "QmRejectHash");

        vm.prank(voter1);
        bugBounty.vote(0, false);
        vm.prank(voter2);
        bugBounty.vote(0, false);
        vm.prank(voter3);
        bugBounty.vote(0, true);

        vm.warp(block.timestamp + 7 days);
        bugBounty.finalizeReport(0);

        (, , , , bool approved, , , , , , bool finalized) = bugBounty.reports(0);
        assertFalse(approved);
        assertTrue(finalized);
    }
}
