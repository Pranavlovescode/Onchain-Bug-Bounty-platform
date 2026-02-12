// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// import {IERC20} from "lib/forge-std/src/interfaces/IERC20.sol";

contract BugBounty {
    // core features

    enum SeverityLevel {
        Critical,
        High,
        Moderate,
        Low
    }

    // 1.  create a bug bounty program
    struct BugBountyProgram {
        string programName;
        string description;
        address programOwner;
        bool isActive;
        uint256 criticalReward;
        uint256 highReward;
        uint256 moderateReward;
        uint256 lowReward;
        uint256 totalFunded;
        uint256 totalPaid;
        uint256 createdAt;
    }

    struct Report {
        uint256 programId;
        address researcher;
        SeverityLevel severity;
        string ipfsHash; // to store the report details off-chain
        bool approved;
        bool paid;
        uint256 createdAt;
        uint256 approvedVote;
        uint256 rejectedVote;
        uint256 votingDeadline;
        bool finalized;
    }

    // this creates key-value pair of programId and BugBountyProgram struct, where programId is a unique identifier for each bug bounty program
    mapping(uint256 => BugBountyProgram) public programs;
    uint256 public programId;

    mapping(uint256 => Report) public reports;
    uint256 public reportId;

    // tracks whether an address has already voted on a report
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public constant APPROVAL_THRESHOLD = 3; // votes needed to approve

    function createBugBountyProgram(
        string memory _programName,
        string memory _description,
        uint256 _critical,
        uint256 _high,
        uint256 _moderate,
        uint256 _low
    ) external payable {
        programs[programId] = BugBountyProgram({
            programName: _programName,
            description: _description,
            programOwner: msg.sender,
            isActive: true,
            criticalReward: _critical,
            highReward: _high,
            moderateReward: _moderate,
            lowReward: _low,
            totalFunded: msg.value,
            totalPaid: 0,
            createdAt: block.timestamp
        });

        programId++;
    }

    function submitReport(
        uint256 _programId,
        address _researcher,
        SeverityLevel _severity,
        string memory _ipfsHash
    ) public returns (address) {
        require(_programId < programId, "Program does not exist");
        require(programs[_programId].isActive, "Program is not active");
        require(_researcher != address(0), "Invalid researcher address");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

        reports[reportId] = Report({
            programId: _programId,
            researcher: _researcher,
            severity: _severity,
            ipfsHash: _ipfsHash,
            approved: false,
            paid: false,
            createdAt: block.timestamp,
            approvedVote: 0,
            rejectedVote: 0,
            votingDeadline: block.timestamp + 7 days,
            finalized: false
        });

        reportId++;

        return _researcher; // return the address of the contract for reference
    }

    // DAO based voting mechanism for approving or rejecting reports, where community members can vote on the validity of a report, and once a report receives enough votes, it can be approved or rejected. This adds a layer of decentralization and community involvement in the bug bounty process.
    function vote(uint256 _reportId, bool approve) external {
        require(_reportId < reportId, "Invalid report");

        Report storage report = reports[_reportId];

        require(block.timestamp < report.votingDeadline, "Voting ended");
        require(!hasVoted[_reportId][msg.sender], "Already voted");

        hasVoted[_reportId][msg.sender] = true;

        if (approve) {
            report.approvedVote++;
        } else {
            report.rejectedVote++;
        }
    }

    function finalizeReport(uint256 _reportId) external {
        Report storage report = reports[_reportId];

        require(
            block.timestamp >= report.votingDeadline,
            "Voting still active"
        );
        require(!report.finalized, "Already finalized");

        report.finalized = true;

        if (report.approvedVote > report.rejectedVote) {
            report.approved = true;
        }
    }
}
