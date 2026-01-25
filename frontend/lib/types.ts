/**
 * Core TypeScript types for the bug bounty platform
 */

export interface Bounty {
  id: string;
  creatorAddress: string;
  projectName: string;
  description: string;
  totalReward: bigint;
  remainingReward: bigint;
  governanceType: 'dao' | 'safe' | 'multisig';
  governanceAddress: string;
  severityTiers: SeverityTier[];
  status: 'active' | 'paused' | 'closed';
  expiryDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface SeverityTier {
  severity: 'critical' | 'high' | 'medium' | 'low';
  minReward: bigint;
  maxReward: bigint;
  description: string;
}

export interface VulnerabilityReport {
  id: string;
  bountyId: string;
  reporterAddress: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  ipfsHash: string;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid';
  createdAt: number;
  approvedAt?: number;
  rejectionReason?: string;
  reward?: bigint;
}

export interface TransactionReceipt {
  hash: string;
  status: 'pending' | 'success' | 'failure';
  confirmations: number;
  createdAt: number;
  expiresAt: number;
}

export interface IPFSUploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  ipfsHash?: string;
}

export interface ReputationNFT {
  id: string;
  tokenId: number;
  tokenUri: string;
  bugsFound: number;
  reputationScore: number;
  minted: boolean;
}

export interface User {
  address: string;
  ensName?: string;
  role: 'researcher' | 'creator' | 'reviewer';
  bountiesCreated?: number;
  bugsFound?: number;
  earnings?: bigint;
  joinedAt: number;
}

export interface GovernanceProposal {
  id: string;
  bountyId: string;
  reportId: string;
  action: 'approve' | 'reject' | 'request_info';
  reason?: string;
  proposedBy: string;
  votes: {
    for: number;
    against: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}
