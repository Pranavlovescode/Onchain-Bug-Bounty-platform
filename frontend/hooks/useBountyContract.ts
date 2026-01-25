import { useCallback, useMemo, useState, useEffect } from "react";
import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { generateId } from "@/lib/utils";
import { PROGRAMS } from "@/lib/web3-config";
import idl from "@/lib/idl/bug_bounty_platform.json";

// Token program ID
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// Vault data type
export interface VaultData {
  publicKey: PublicKey;
  account: {
    programTeam: PublicKey;
    governanceAuthority: PublicKey;
    vaultBump: number;
    vaultTokenAccount: PublicKey;
    criticalReward: BN;
    highReward: BN;
    mediumReward: BN;
    lowReward: BN;
    totalFunded: BN;
    totalPaidOut: BN;
    totalReports: BN;
    approvedReports: BN;
    rewardTokenMint: PublicKey | null;
    vaultActive: boolean;
    createdAt: BN;
  };
}

/**
 * Hook for interacting with the bug bounty Solana program
 * Handles program calls for creating and managing bounties
 */
export function useBountyContract() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  
  // State for user's existing vault
  const [userVault, setUserVault] = useState<VaultData | null>(null);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);

  // Create Anchor program instance
  const program = useMemo(() => {
    if (!anchorWallet) return null;
    
    const provider = new AnchorProvider(
      connection,
      anchorWallet,
      { commitment: "confirmed" }
    );
    
    return new Program(idl as any, provider);
  }, [connection, anchorWallet]);

  // Get vault PDA for connected wallet
  const getVaultPDA = useCallback((walletPubkey: PublicKey) => {
    const programId = new PublicKey(PROGRAMS.BugBountyPlatform);
    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), walletPubkey.toBuffer()],
      programId,
    );
    return vaultPDA;
  }, []);

  // Fetch user's existing vault
  const fetchUserVault = useCallback(async () => {
    if (!publicKey || !program) {
      setUserVault(null);
      return null;
    }

    setVaultLoading(true);
    setVaultError(null);

    try {
      const vaultPDA = getVaultPDA(publicKey);
      
      // Try to fetch the vault account using the program's account namespace
      // The account name from IDL is "BugBountyVault" which becomes "bugBountyVault" in camelCase
      const accountNamespace = program.account as any;
      const vaultAccount = await accountNamespace.bugBountyVault.fetch(vaultPDA);
      
      const vault: VaultData = {
        publicKey: vaultPDA,
        account: vaultAccount as any,
      };
      
      setUserVault(vault);
      return vault;
    } catch (error: any) {
      // Account doesn't exist - this is expected for new users
      if (error.message?.includes("Account does not exist")) {
        setUserVault(null);
        return null;
      }
      console.error("Failed to fetch user vault:", error);
      setVaultError("Failed to load vault data");
      setUserVault(null);
      return null;
    } finally {
      setVaultLoading(false);
    }
  }, [publicKey, program, getVaultPDA]);

  // Auto-fetch vault when wallet connects
  useEffect(() => {
    if (publicKey && program) {
      fetchUserVault();
    } else {
      setUserVault(null);
    }
  }, [publicKey, program, fetchUserVault]);

  /**
   * Create a new bounty
   */
  const createBounty = useCallback(
    async (bountyData: {
      projectName: string;
      description: string;
      totalReward: string;
      governanceType: "dao" | "safe" | "multisig";
      governanceAddress: string;
      severityTiers: Array<{
        level: string;
        minReward: string;
        maxReward: string;
      }>;
      expiryDays: number;
    }) => {
      if (!publicKey || !program) {
        throw new Error("Wallet not connected");
      }

      // Validate program ID
      console.log("Program ID:", PROGRAMS.BugBountyPlatform);
      if (!PROGRAMS.BugBountyPlatform) {
        throw new Error("Bug Bounty Program ID is not configured");
      }

      // Validate governance address
      const govAddrTrimmed = bountyData.governanceAddress.trim();
      console.log("Governance Address:", govAddrTrimmed);
      
      let governanceAddress: PublicKey;
      try {
        governanceAddress = new PublicKey(govAddrTrimmed);
      } catch (error) {
        throw new Error(
          `Invalid governance address "${govAddrTrimmed}": must be a valid Solana public key`,
        );
      }

      const txId = generateId("bounty_");

      try {
        // Convert reward amounts to lamports (BN)
        const rewardsByTier: Record<string, BN> = {};
        bountyData.severityTiers.forEach((tier) => {
          const lamports = Math.floor(parseFloat(tier.maxReward) * LAMPORTS_PER_SOL);
          rewardsByTier[tier.level] = new BN(lamports);
        });

        const criticalReward = rewardsByTier["critical"] || new BN(0);
        const highReward = rewardsByTier["high"] || new BN(0);
        const mediumReward = rewardsByTier["medium"] || new BN(0);
        const lowReward = rewardsByTier["low"] || new BN(0);
        
        // Calculate initial funding
        const totalRewardLamports = Math.floor(parseFloat(bountyData.totalReward) * LAMPORTS_PER_SOL);
        const initialFunding = new BN(totalRewardLamports);

        // Get vault PDA
        const programId = new PublicKey(PROGRAMS.BugBountyPlatform);
        const [vaultPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("vault"), publicKey.toBuffer()],
          programId,
        );

        // Check if vault already exists
        const existingVault = await program.provider.connection.getAccountInfo(vaultPDA);
        if (existingVault) {
          throw new Error(
            `A bounty vault already exists for your wallet at ${vaultPDA.toBase58()}. Each wallet can only have one vault.`
          );
        }

        // Generate a random pubkey for vault token account (UncheckedAccount)
        const vaultTokenAccount = Keypair.generate().publicKey;

        console.log("Creating bounty vault...");
        console.log("Vault PDA:", vaultPDA.toBase58());
        console.log("Governance:", governanceAddress.toBase58());
        console.log("Rewards - Critical:", criticalReward.toString(), "High:", highReward.toString());

        // Use Anchor to create the transaction
        const signature = await program.methods
          .createBountyVault(
            criticalReward,
            highReward,
            mediumReward,
            lowReward,
            initialFunding,
            null // reward_token_mint: None (use SOL)
          )
          .accounts({
            programTeam: publicKey,
            governanceAuthority: governanceAddress,
            vault: vaultPDA,
            vaultTokenAccount: vaultTokenAccount,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        console.log("Bounty created successfully! Signature:", signature);

        return { txId, signature };
      } catch (error) {
        console.error("Bounty creation failed:", error);
        throw error;
      }
    },
    [publicKey, program],
  );

  /**
   * Submit a vulnerability report
   */
  const submitReport = useCallback(
    async (bountyId: string, ipfsHash: string, severity: string) => {
      if (!publicKey || !program) {
        throw new Error("Wallet not connected");
      }

      const txId = generateId("report_");

      try {
        // TODO: Implement with Anchor
        throw new Error("Submit report not yet implemented");
      } catch (error) {
        console.error("Report submission failed:", error);
        throw error;
      }
    },
    [publicKey, program],
  );

  /**
   * Approve a vulnerability report (for governance)
   */
  const approveReport = useCallback(
    async (reportId: string) => {
      if (!publicKey || !program) {
        throw new Error("Wallet not connected");
      }

      const txId = generateId("approval_");

      try {
        // TODO: Implement with Anchor
        throw new Error("Approve report not yet implemented");
      } catch (error) {
        console.error("Report approval failed:", error);
        throw error;
      }
    },
    [publicKey, program],
  );

  /**
   * Fetch bounties from on-chain
   */
  const fetchBounties = useCallback(async () => {
    if (!program) {
      return [];
    }

    try {
      // Fetch all vault accounts
      const accountNamespace = program.account as any;
      const vaults = await accountNamespace.bugBountyVault.all();
      return vaults;
    } catch (error) {
      console.error("Failed to fetch bounties:", error);
      throw error;
    }
  }, [program]);

  return {
    connected: !!publicKey,
    publicKey,
    program,
    userVault,
    vaultLoading,
    vaultError,
    getVaultPDA,
    fetchUserVault,
    createBounty,
    submitReport,
    approveReport,
    fetchBounties,
  };
}
