use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token};

declare_id!("7CjDDSGfTDYAydZ3nSamXbahqsaapDY862PQQaVJwiw2");

// ============================================================================
// CONSTANTS
// ============================================================================

const VAULT_SEED: &str = "vault";
const REPORT_SEED: &str = "report";
const REPUTATION_SEED: &str = "reputation";

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(PartialEq, Eq, Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub enum SeverityTier {
    Critical,  // Highest reward
    High,
    Medium,
    Low,
}

#[derive(PartialEq, Eq, Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub enum ReportStatus {
    Pending,
    Approved,
    Rejected,
    Paid,
}

#[account]
pub struct BugBountyVault {
    pub program_team: Pubkey,
    pub governance_authority: Pubkey,
    pub vault_bump: u8,
    pub vault_token_account: Pubkey,
    
    // Reward tiers (in lamports or token units)
    pub critical_reward: u64,
    pub high_reward: u64,
    pub medium_reward: u64,
    pub low_reward: u64,
    
    // Vault state
    pub total_funded: u64,
    pub total_paid_out: u64,
    pub total_reports: u64,
    pub approved_reports: u64,
    
    // Token mint for payouts (SOL if None, otherwise specific mint)
    pub reward_token_mint: Option<Pubkey>,
    pub vault_active: bool,
    pub created_at: i64,
}

#[account]
pub struct VulnerabilityReport {
    pub vault: Pubkey,
    pub researcher: Pubkey,
    pub severity: SeverityTier,
    pub status: ReportStatus,
    pub report_ipfs_hash: [u8; 32],  // IPFS hash (32 bytes)
    pub report_bump: u8,
    
    pub submitted_at: i64,
    pub approved_at: Option<i64>,
    pub paid_at: Option<i64>,
    
    // Governance decision
    pub approver: Option<Pubkey>,
    pub approval_reason: Option<String>, // Optional metadata
    pub payout_amount: u64,
}

#[account]
pub struct ReputationNFT {
    pub researcher: Pubkey,
    pub vault: Pubkey,
    pub report: Pubkey,
    pub severity: SeverityTier,
    pub project_name: String,
    pub minted_at: i64,
}

// ============================================================================
// PROGRAM LOGIC
// ============================================================================

#[program]
pub mod bug_bounty_platform {
    use super::*;

    /// Initialize a new bug bounty vault
    pub fn create_bounty_vault(
        ctx: Context<CreateBountyVault>,
        critical_reward: u64,
        high_reward: u64,
        medium_reward: u64,
        low_reward: u64,
        initial_funding: u64,
        reward_token_mint: Option<Pubkey>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        vault.program_team = ctx.accounts.program_team.key();
        vault.governance_authority = ctx.accounts.governance_authority.key();
        vault.vault_bump = ctx.bumps.vault;
        vault.vault_token_account = ctx.accounts.vault_token_account.key();
        
        vault.critical_reward = critical_reward;
        vault.high_reward = high_reward;
        vault.medium_reward = medium_reward;
        vault.low_reward = low_reward;
        
        vault.total_funded = initial_funding;
        vault.total_paid_out = 0;
        vault.total_reports = 0;
        vault.approved_reports = 0;
        
        vault.reward_token_mint = reward_token_mint;
        vault.vault_active = true;
        vault.created_at = Clock::get()?.unix_timestamp;
        
        msg!("✅ Bug Bounty Vault created with {} critical, {} high rewards", critical_reward, high_reward);
        Ok(())
    }

    /// Submit a vulnerability report
    pub fn submit_report(
        ctx: Context<SubmitReport>,
        severity: SeverityTier,
        ipfs_hash: [u8; 32],
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.vault_active, BugBountyError::VaultInactive);
        
        let report = &mut ctx.accounts.report;
        
        report.vault = vault.key();
        report.researcher = ctx.accounts.researcher.key();
        report.severity = severity;
        report.status = ReportStatus::Pending;
        report.report_ipfs_hash = ipfs_hash;
        report.report_bump = ctx.bumps.report;
        report.submitted_at = Clock::get()?.unix_timestamp;
        
        // Set expected payout based on severity
        report.payout_amount = match severity {
            SeverityTier::Critical => vault.critical_reward,
            SeverityTier::High => vault.high_reward,
            SeverityTier::Medium => vault.medium_reward,
            SeverityTier::Low => vault.low_reward,
        };
        
        vault.total_reports += 1;
        
        msg!("📋 Report submitted by {} with {:?} severity", ctx.accounts.researcher.key(), severity);
        Ok(())
    }

    /// Governance approves a vulnerability report (requires governance authority)
    pub fn approve_report(
        ctx: Context<ApproveReport>,
        approval_reason: Option<String>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let report = &mut ctx.accounts.report;
        
        // Verify approver is governance authority
        require!(
            ctx.accounts.governance_authority.key() == vault.governance_authority,
            BugBountyError::NotGovernanceAuthority
        );
        
        require!(report.status == ReportStatus::Pending, BugBountyError::InvalidReportStatus);
        
        report.status = ReportStatus::Approved;
        report.approver = Some(ctx.accounts.governance_authority.key());
        report.approved_at = Some(Clock::get()?.unix_timestamp);
        report.approval_reason = approval_reason;
        
        let mut vault_mut = vault.clone();
        vault_mut.approved_reports += 1;
        
        msg!("✅ Report approved by governance. Payout: {} tokens", report.payout_amount);
        Ok(())
    }

    /// Governance rejects a vulnerability report
    pub fn reject_report(
        ctx: Context<RejectReport>,
        rejection_reason: String,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let report = &mut ctx.accounts.report;
        
        // Verify rejector is governance authority
        require!(
            ctx.accounts.governance_authority.key() == vault.governance_authority,
            BugBountyError::NotGovernanceAuthority
        );
        
        require!(report.status == ReportStatus::Pending, BugBountyError::InvalidReportStatus);
        
        report.status = ReportStatus::Rejected;
        report.approver = Some(ctx.accounts.governance_authority.key());
        report.approval_reason = Some(rejection_reason);
        
        msg!("❌ Report rejected by governance");
        Ok(())
    }

    /// Execute automatic payout after approval
    pub fn execute_payout(
        ctx: Context<ExecutePayout>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let report = &mut ctx.accounts.report;
        
        // Verify report is approved
        require!(report.status == ReportStatus::Approved, BugBountyError::ReportNotApproved);
        
        // Verify researcher matches
        require_eq!(report.researcher, ctx.accounts.researcher.key(), BugBountyError::UnauthorizedResearcher);
        
        let payout_amount = report.payout_amount;
        let bump_bytes = vec![vault.vault_bump];
        
        let vault_seed_bytes = VAULT_SEED.as_bytes().to_vec();
        let program_team_bytes = vault.program_team.as_ref().to_vec();
        
        // Create signer seeds array
        let seeds_inner: Vec<&[u8]> = vec![
            vault_seed_bytes.as_slice(),
            program_team_bytes.as_slice(),
            bump_bytes.as_slice(),
        ];
        
        let signer_seeds_vec = vec![seeds_inner.as_slice()];
        let signer_seeds: &[&[&[u8]]] = signer_seeds_vec.as_slice();
        
        // Execute transfer with PDA signature
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.researcher_token_account.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            signer_seeds,
        );
        
        token::transfer(cpi_ctx, payout_amount)?;
        
        report.status = ReportStatus::Paid;
        report.paid_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("💰 Payout of {} executed to researcher", payout_amount);
        Ok(())
    }

    /// Mint reputation NFT for approved reports (optional)
    pub fn mint_reputation_nft(
        ctx: Context<MintReputationNFT>,
        project_name: String,
    ) -> Result<()> {
        let report = &ctx.accounts.report;
        
        require!(report.status == ReportStatus::Paid, BugBountyError::ReportNotPaid);
        
        let reputation_nft = &mut ctx.accounts.reputation_nft;
        reputation_nft.researcher = report.researcher;
        reputation_nft.vault = report.vault;
        reputation_nft.report = report.key();
        reputation_nft.severity = report.severity;
        reputation_nft.project_name = project_name;
        reputation_nft.minted_at = Clock::get()?.unix_timestamp;
        
        msg!("🏆 Reputation NFT minted for researcher");
        Ok(())
    }

    /// Allow vault to receive additional funding
    pub fn fund_vault(
        ctx: Context<FundVault>,
        amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.funder_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.funder.to_account_info(),
            },
        );
        
        token::transfer(cpi_ctx, amount)?;
        
        vault.total_funded = vault.total_funded.checked_add(amount)
            .ok_or(BugBountyError::ArithmeticOverflow)?;
        
        msg!("💸 Vault funded with additional {} tokens", amount);
        Ok(())
    }

    /// Pause/unpause the vault (only program team)
    pub fn toggle_vault_status(
        ctx: Context<ToggleVaultStatus>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        require_eq!(ctx.accounts.program_team.key(), vault.program_team, BugBountyError::UnauthorizedTeam);
        
        vault.vault_active = !vault.vault_active;
        
        msg!("🔄 Vault status toggled: {}", vault.vault_active);
        Ok(())
    }

    /// Update reward tiers (only program team)
    pub fn update_reward_tiers(
        ctx: Context<UpdateRewardTiers>,
        critical_reward: u64,
        high_reward: u64,
        medium_reward: u64,
        low_reward: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        require_eq!(ctx.accounts.program_team.key(), vault.program_team, BugBountyError::UnauthorizedTeam);
        
        vault.critical_reward = critical_reward;
        vault.high_reward = high_reward;
        vault.medium_reward = medium_reward;
        vault.low_reward = low_reward;
        
        msg!("⚙️ Reward tiers updated");
        Ok(())
    }
}

// ============================================================================
// ACCOUNT CONTEXTS
// ============================================================================

#[derive(Accounts)]
#[instruction(critical_reward: u64, high_reward: u64, medium_reward: u64, low_reward: u64, initial_funding: u64)]
pub struct CreateBountyVault<'info> {
    #[account(mut)]
    pub program_team: Signer<'info>,
    
    pub governance_authority: SystemAccount<'info>,
    
    #[account(
        init,
        payer = program_team,
        space = 8 + std::mem::size_of::<BugBountyVault>(),
        seeds = [VAULT_SEED.as_bytes(), program_team.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, BugBountyVault>,
    
    /// CHECK: Token account for the vault
    pub vault_token_account: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(severity: SeverityTier, ipfs_hash: [u8; 32])]
pub struct SubmitReport<'info> {
    #[account(mut)]
    pub researcher: Signer<'info>,
    
    #[account(mut)]
    pub vault: Account<'info, BugBountyVault>,
    
    #[account(
        init,
        payer = researcher,
        space = 8 + std::mem::size_of::<VulnerabilityReport>() + 256,
        seeds = [REPORT_SEED.as_bytes(), vault.key().as_ref(), researcher.key().as_ref(), &vault.total_reports.to_le_bytes()],
        bump
    )]
    pub report: Account<'info, VulnerabilityReport>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveReport<'info> {
    pub governance_authority: Signer<'info>,
    
    pub vault: Account<'info, BugBountyVault>,
    
    #[account(mut, constraint = report.vault == vault.key())]
    pub report: Account<'info, VulnerabilityReport>,
}

#[derive(Accounts)]
pub struct RejectReport<'info> {
    pub governance_authority: Signer<'info>,
    
    pub vault: Account<'info, BugBountyVault>,
    
    #[account(mut, constraint = report.vault == vault.key())]
    pub report: Account<'info, VulnerabilityReport>,
}

#[derive(Accounts)]
pub struct ExecutePayout<'info> {
    #[account(mut)]
    pub researcher: Signer<'info>,
    
    pub vault: Account<'info, BugBountyVault>,
    
    #[account(mut, constraint = report.vault == vault.key())]
    pub report: Account<'info, VulnerabilityReport>,
    
    /// CHECK: Vault token account
    #[account(mut)]
    pub vault_token_account: UncheckedAccount<'info>,
    
    /// CHECK: Researcher token account
    #[account(mut)]
    pub researcher_token_account: UncheckedAccount<'info>,
    
    /// CHECK: Vault authority (PDA)
    pub vault_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintReputationNFT<'info> {
    #[account(mut)]
    pub researcher: Signer<'info>,
    
    pub report: Account<'info, VulnerabilityReport>,
    
    #[account(
        init,
        payer = researcher,
        space = 8 + std::mem::size_of::<ReputationNFT>() + 256,
        seeds = [REPUTATION_SEED.as_bytes(), report.researcher.as_ref(), report.key().as_ref()],
        bump
    )]
    pub reputation_nft: Account<'info, ReputationNFT>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundVault<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,
    
    #[account(mut)]
    pub vault: Account<'info, BugBountyVault>,
    
    /// CHECK: Funder token account
    #[account(mut)]
    pub funder_token_account: UncheckedAccount<'info>,
    
    /// CHECK: Vault token account
    #[account(mut)]
    pub vault_token_account: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ToggleVaultStatus<'info> {
    pub program_team: Signer<'info>,
    
    #[account(mut, constraint = vault.program_team == program_team.key())]
    pub vault: Account<'info, BugBountyVault>,
}

#[derive(Accounts)]
pub struct UpdateRewardTiers<'info> {
    pub program_team: Signer<'info>,
    
    #[account(mut, constraint = vault.program_team == program_team.key())]
    pub vault: Account<'info, BugBountyVault>,
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

#[error_code]
pub enum BugBountyError {
    #[msg("Vault is inactive")]
    VaultInactive,
    
    #[msg("Not authorized as governance authority")]
    NotGovernanceAuthority,
    
    #[msg("Invalid report status for this operation")]
    InvalidReportStatus,
    
    #[msg("Report must be approved before payout")]
    ReportNotApproved,
    
    #[msg("Report must be paid before NFT minting")]
    ReportNotPaid,
    
    #[msg("Unauthorized researcher")]
    UnauthorizedResearcher,
    
    #[msg("Only program team can perform this action")]
    UnauthorizedTeam,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
