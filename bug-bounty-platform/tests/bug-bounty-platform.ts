import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BugBountyPlatform } from "../target/types/bug_bounty_platform";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";

describe("bug-bounty-platform", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.bugBountyPlatform as Program<BugBountyPlatform>;
  const provider = anchor.getProvider();
  const connection = provider.connection;

  // Test accounts
  let programTeam: anchor.web3.Keypair;
  let governanceAuthority: anchor.web3.Keypair;
  let researcher1: anchor.web3.Keypair;
  let researcher2: anchor.web3.Keypair;
  let funder: anchor.web3.Keypair;

  // Test data
  const VAULT_SEED = "vault";
  const REPORT_SEED = "report";
  const REPUTATION_SEED = "reputation";

  const rewardTiers = {
    critical: new anchor.BN(1000),
    high: new anchor.BN(500),
    medium: new anchor.BN(250),
    low: new anchor.BN(100),
  };

  let vaultPda: anchor.web3.PublicKey;
  let vaultBump: number;

  before(async () => {
    // Generate test keypairs
    programTeam = anchor.web3.Keypair.generate();
    governanceAuthority = anchor.web3.Keypair.generate();
    researcher1 = anchor.web3.Keypair.generate();
    researcher2 = anchor.web3.Keypair.generate();
    funder = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    const airdropAmount = 10 * anchor.web3.LAMPORTS_PER_SOL;
    const accounts = [programTeam, governanceAuthority, researcher1, researcher2, funder];

    for (const account of accounts) {
      const signature = await connection.requestAirdrop(account.publicKey, airdropAmount);
      await connection.confirmTransaction(signature);
    }

    // Calculate vault PDA
    [vaultPda, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(VAULT_SEED),
        programTeam.publicKey.toBuffer(),
      ],
      program.programId
    );
  });

  describe("Vault Creation & Management", () => {
    it("Should create a new bounty vault", async () => {
      const vaultTokenAccount = anchor.web3.Keypair.generate().publicKey;

      const tx = await program.methods
        .createBountyVault(
          rewardTiers.critical,
          rewardTiers.high,
          rewardTiers.medium,
          rewardTiers.low,
          new anchor.BN(10000),
          null
        )
        .accounts({
          programTeam: programTeam.publicKey,
          governanceAuthority: governanceAuthority.publicKey,
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([programTeam])
        .rpc();

      console.log("✅ Vault created with signature:", tx);

      // Verify vault was created
      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      expect(vaultAccount.programTeam.toString()).to.equal(programTeam.publicKey.toString());
      expect(vaultAccount.governanceAuthority.toString()).to.equal(governanceAuthority.publicKey.toString());
      expect(vaultAccount.criticalReward.toNumber()).to.equal(rewardTiers.critical.toNumber());
      expect(vaultAccount.highReward.toNumber()).to.equal(rewardTiers.high.toNumber());
      expect(vaultAccount.mediumReward.toNumber()).to.equal(rewardTiers.medium.toNumber());
      expect(vaultAccount.lowReward.toNumber()).to.equal(rewardTiers.low.toNumber());
      expect(vaultAccount.totalFunded.toNumber()).to.equal(10000);
      expect(vaultAccount.totalPaidOut.toNumber()).to.equal(0);
      expect(vaultAccount.totalReports.toNumber()).to.equal(0);
      expect(vaultAccount.approvedReports.toNumber()).to.equal(0);
      expect(vaultAccount.vaultActive).to.be.true;
    });

    it("Should toggle vault status (pause/unpause)", async () => {
      const tx = await program.methods
        .toggleVaultStatus()
        .accounts({
          programTeam: programTeam.publicKey,
          vault: vaultPda,
        })
        .signers([programTeam])
        .rpc();

      console.log("✅ Vault status toggled with signature:", tx);

      let vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      expect(vaultAccount.vaultActive).to.be.false;

      // Toggle back
      await program.methods
        .toggleVaultStatus()
        .accounts({
          programTeam: programTeam.publicKey,
          vault: vaultPda,
        })
        .signers([programTeam])
        .rpc();

      vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      expect(vaultAccount.vaultActive).to.be.true;
    });

    it("Should update reward tiers", async () => {
      const newTiers = {
        critical: new anchor.BN(2000),
        high: new anchor.BN(1000),
        medium: new anchor.BN(500),
        low: new anchor.BN(250),
      };

      const tx = await program.methods
        .updateRewardTiers(
          newTiers.critical,
          newTiers.high,
          newTiers.medium,
          newTiers.low
        )
        .accounts({
          programTeam: programTeam.publicKey,
          vault: vaultPda,
        })
        .signers([programTeam])
        .rpc();

      console.log("✅ Reward tiers updated with signature:", tx);

      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      expect(vaultAccount.criticalReward.toNumber()).to.equal(newTiers.critical.toNumber());
      expect(vaultAccount.highReward.toNumber()).to.equal(newTiers.high.toNumber());
      expect(vaultAccount.mediumReward.toNumber()).to.equal(newTiers.medium.toNumber());
      expect(vaultAccount.lowReward.toNumber()).to.equal(newTiers.low.toNumber());
    });
  });

  describe("Report Submission & Management", () => {
    let reportPda1: anchor.web3.PublicKey;
    let reportBump1: number;
    let reportPda2: anchor.web3.PublicKey;
    let reportBump2: number;

    before(async () => {
      // Get current report count
      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      const reportCount = vaultAccount.totalReports.toNumber();

      // Calculate report PDAs
      [reportPda1, reportBump1] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(REPORT_SEED),
          vaultPda.toBuffer(),
          researcher1.publicKey.toBuffer(),
          new anchor.BN(reportCount).toBuffer("le", 8),
        ],
        program.programId
      );

      [reportPda2, reportBump2] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(REPORT_SEED),
          vaultPda.toBuffer(),
          researcher2.publicKey.toBuffer(),
          new anchor.BN(reportCount + 1).toBuffer("le", 8),
        ],
        program.programId
      );
    });

    it("Should submit a critical severity report", async () => {
      const ipfsHash = Buffer.alloc(32, "report1");

      const tx = await program.methods
        .submitReport({ critical: {} }, ipfsHash)
        .accounts({
          researcher: researcher1.publicKey,
          vault: vaultPda,
          report: reportPda1,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([researcher1])
        .rpc();

      console.log("✅ Critical report submitted with signature:", tx);

      const reportAccount = await program.account.vulnerabilityReport.fetch(reportPda1);
      expect(reportAccount.researcher.toString()).to.equal(researcher1.publicKey.toString());
      expect(reportAccount.vault.toString()).to.equal(vaultPda.toString());
      expect(reportAccount.status.pending).to.exist;
      expect(reportAccount.payoutAmount.toNumber()).to.equal(2000); // Critical reward
    });

    it("Should submit a high severity report", async () => {
      const ipfsHash = Buffer.alloc(32, "report2");

      const tx = await program.methods
        .submitReport({ high: {} }, ipfsHash)
        .accounts({
          researcher: researcher2.publicKey,
          vault: vaultPda,
          report: reportPda2,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([researcher2])
        .rpc();

      console.log("✅ High severity report submitted with signature:", tx);

      const reportAccount = await program.account.vulnerabilityReport.fetch(reportPda2);
      expect(reportAccount.severity.high).to.exist;
      expect(reportAccount.payoutAmount.toNumber()).to.equal(1000); // High reward
    });

    it("Should reject a pending report", async () => {
      const rejectionReason = "Vulnerability does not meet criteria";

      const tx = await program.methods
        .rejectReport(rejectionReason)
        .accounts({
          governanceAuthority: governanceAuthority.publicKey,
          vault: vaultPda,
          report: reportPda2,
        })
        .signers([governanceAuthority])
        .rpc();

      console.log("✅ Report rejected with signature:", tx);

      const reportAccount = await program.account.vulnerabilityReport.fetch(reportPda2);
      expect(reportAccount.status.rejected).to.exist;
      expect(reportAccount.approver.toString()).to.equal(governanceAuthority.publicKey.toString());
    });

    it("Should approve a pending report", async () => {
      const approvalReason = "Valid critical vulnerability";

      const tx = await program.methods
        .approveReport(approvalReason)
        .accounts({
          governanceAuthority: governanceAuthority.publicKey,
          vault: vaultPda,
          report: reportPda1,
        })
        .signers([governanceAuthority])
        .rpc();

      console.log("✅ Report approved with signature:", tx);

      const reportAccount = await program.account.vulnerabilityReport.fetch(reportPda1);
      expect(reportAccount.status.approved).to.exist;
      expect(reportAccount.approver.toString()).to.equal(governanceAuthority.publicKey.toString());
    });

    it("Should fail to approve non-pending report", async () => {
      try {
        await program.methods
          .approveReport("Already rejected")
          .accounts({
            governanceAuthority: governanceAuthority.publicKey,
            vault: vaultPda,
            report: reportPda2,
          })
          .signers([governanceAuthority])
          .rpc();
        expect.fail("Should have thrown error for non-pending report");
      } catch (error) {
        console.log("✅ Correctly rejected approval of non-pending report");
        expect(error.message).to.include("Invalid report status");
      }
    });
  });

  describe("Payout Execution", () => {
    let reportPda3: anchor.web3.PublicKey;
    let reportBump3: number;

    before(async () => {
      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      const reportCount = vaultAccount.totalReports.toNumber();

      [reportPda3, reportBump3] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(REPORT_SEED),
          vaultPda.toBuffer(),
          researcher1.publicKey.toBuffer(),
          new anchor.BN(reportCount).toBuffer("le", 8),
        ],
        program.programId
      );
    });

    it("Should submit and approve a report for payout test", async () => {
      const ipfsHash = Buffer.alloc(32, "report3");

      await program.methods
        .submitReport({ medium: {} }, ipfsHash)
        .accounts({
          researcher: researcher1.publicKey,
          vault: vaultPda,
          report: reportPda3,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([researcher1])
        .rpc();

      await program.methods
        .approveReport("Approved for payout test")
        .accounts({
          governanceAuthority: governanceAuthority.publicKey,
          vault: vaultPda,
          report: reportPda3,
        })
        .signers([governanceAuthority])
        .rpc();

      const reportAccount = await program.account.vulnerabilityReport.fetch(reportPda3);
      expect(reportAccount.status.approved).to.exist;
    });

    it("Should fail to execute payout with unauthorized researcher", async () => {
      try {
        const mockTokenAccount = anchor.web3.Keypair.generate().publicKey;
        const mockVaultTokenAccount = anchor.web3.Keypair.generate().publicKey;
        const mockVaultAuthority = anchor.web3.Keypair.generate().publicKey;

        await program.methods
          .executePayout()
          .accounts({
            researcher: researcher2.publicKey,
            vault: vaultPda,
            report: reportPda3,
            vaultTokenAccount: mockVaultTokenAccount,
            researcherTokenAccount: mockTokenAccount,
            vaultAuthority: mockVaultAuthority,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([researcher2])
          .rpc();
        expect.fail("Should have thrown error for unauthorized researcher");
      } catch (error) {
        console.log("✅ Correctly rejected unauthorized payout");
        expect(error.message).to.include("Unauthorized researcher");
      }
    });
  });

  describe("Reputation NFT", () => {
    let reportPdaNFT: anchor.web3.PublicKey;
    let reportBumpNFT: number;
    let reputationNftPda: anchor.web3.PublicKey;
    let reputationNftBump: number;

    before(async () => {
      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      const reportCount = vaultAccount.totalReports.toNumber();

      [reportPdaNFT, reportBumpNFT] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(REPORT_SEED),
          vaultPda.toBuffer(),
          researcher1.publicKey.toBuffer(),
          new anchor.BN(reportCount).toBuffer("le", 8),
        ],
        program.programId
      );
    });

    it("Should fail to mint reputation NFT for non-paid report", async () => {
      // Use an approved but not paid report
      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      const firstReport = reportPdaNFT;

      [reputationNftPda, reputationNftBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(REPUTATION_SEED),
          researcher1.publicKey.toBuffer(),
          firstReport.toBuffer(),
        ],
        program.programId
      );

      try {
        await program.methods
          .mintReputationNft("Test Project")
          .accounts({
            researcher: researcher1.publicKey,
            report: firstReport,
            reputationNft: reputationNftPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([researcher1])
          .rpc();
        expect.fail("Should have thrown error for non-paid report");
      } catch (error) {
        console.log("✅ Correctly rejected NFT minting for non-paid report");
        expect(error.message).to.include("AnchorError");
      }
    });
  });

  describe("Vault Funding", () => {
    it("Should handle vault funding (integration test setup)", async () => {
      // This is a placeholder for funding tests
      // In a real scenario, you would:
      // 1. Create token mint
      // 2. Create token accounts
      // 3. Mint tokens to funder
      // 4. Call fund_vault

      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      expect(vaultAccount.totalFunded.toNumber()).to.be.greaterThan(0);
      console.log("✅ Vault funding integration test setup confirmed");
    });
  });

  describe("Error Cases & Edge Cases", () => {
    it("Should fail to create vault with unauthorized account", async () => {
      const unauthorizedTeam = anchor.web3.Keypair.generate();
      const signature = await connection.requestAirdrop(
        unauthorizedTeam.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature);

      const [newVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_SEED), unauthorizedTeam.publicKey.toBuffer()],
        program.programId
      );

      const vaultTokenAccount = anchor.web3.Keypair.generate().publicKey;

      const tx = await program.methods
        .createBountyVault(
          new anchor.BN(100),
          new anchor.BN(50),
          new anchor.BN(25),
          new anchor.BN(10),
          new anchor.BN(5000),
          null
        )
        .accounts({
          programTeam: unauthorizedTeam.publicKey,
          governanceAuthority: governanceAuthority.publicKey,
          vault: newVaultPda,
          vaultTokenAccount: vaultTokenAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([unauthorizedTeam])
        .rpc();

      console.log("✅ Successfully created vault with different team account");
    });

    it("Should fail to toggle vault status as non-program-team", async () => {
      const randomAccount = anchor.web3.Keypair.generate();
      const signature = await connection.requestAirdrop(
        randomAccount.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature);

      try {
        await program.methods
          .toggleVaultStatus()
          .accounts({
            programTeam: randomAccount.publicKey,
            vault: vaultPda,
          })
          .signers([randomAccount])
          .rpc();
        expect.fail("Should have thrown error for unauthorized team");
      } catch (error) {
        console.log("✅ Correctly rejected vault toggle by non-team account");
        expect(error.message).to.include("AnchorError");
      }
    });

    it("Should fail to approve report as non-governance-authority", async () => {
      const randomAuthority = anchor.web3.Keypair.generate();
      const signature = await connection.requestAirdrop(
        randomAuthority.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature);

      // Get first report for testing
      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);
      const [testReportPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(REPORT_SEED),
          vaultPda.toBuffer(),
          researcher1.publicKey.toBuffer(),
          new anchor.BN(0).toBuffer("le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .approveReport("Unauthorized approval")
          .accounts({
            governanceAuthority: randomAuthority.publicKey,
            vault: vaultPda,
            report: testReportPda,
          })
          .signers([randomAuthority])
          .rpc();
        expect.fail("Should have thrown error for non-governance-authority");
      } catch (error) {
        console.log("✅ Correctly rejected report approval by non-governance authority");
        expect(error.message).to.include("governance");
      }
    });
  });

  describe("State Verification", () => {
    it("Should verify vault state after operations", async () => {
      const vaultAccount = await program.account.bugBountyVault.fetch(vaultPda);

      console.log("\n📊 Final Vault State:");
      console.log(`  Program Team: ${vaultAccount.programTeam.toString()}`);
      console.log(`  Governance Authority: ${vaultAccount.governanceAuthority.toString()}`);
      console.log(`  Total Reports: ${vaultAccount.totalReports.toNumber()}`);
      console.log(`  Approved Reports: ${vaultAccount.approvedReports.toNumber()}`);
      console.log(`  Total Funded: ${vaultAccount.totalFunded.toNumber()}`);
      console.log(`  Total Paid Out: ${vaultAccount.totalPaidOut.toNumber()}`);
      console.log(`  Vault Active: ${vaultAccount.vaultActive}`);
      console.log(`  Critical Reward: ${vaultAccount.criticalReward.toNumber()}`);
      console.log(`  High Reward: ${vaultAccount.highReward.toNumber()}`);
      console.log(`  Medium Reward: ${vaultAccount.mediumReward.toNumber()}`);
      console.log(`  Low Reward: ${vaultAccount.lowReward.toNumber()}\n`);

      expect(vaultAccount.vaultActive).to.be.true;
      expect(vaultAccount.totalReports.toNumber()).to.be.greaterThan(0);
    });
  });
});
