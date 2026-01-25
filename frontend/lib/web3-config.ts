import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

/**
 * Solana Network Configuration
 * Supports mainnet and devnet deployments
 */
export const SOLANA_NETWORKS = {
  mainnet: {
    name: 'mainnet-beta',
    url: process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('mainnet-beta'),
  },
  devnet: {
    name: 'devnet',
    url: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || clusterApiUrl('devnet'),
  },
  localhost: {
    name: 'localhost',
    url: 'http://127.0.0.1:8899',
  },
};

export const DEFAULT_NETWORK = 'devnet';
export const SOLANA_NETWORK = SOLANA_NETWORKS[DEFAULT_NETWORK as keyof typeof SOLANA_NETWORKS];

/**
 * Create Solana connection
 */
export function createSolanaConnection() {
  return new Connection(SOLANA_NETWORK.url, 'confirmed');
}

export const connection = createSolanaConnection();

/**
 * Smart contract (Program) addresses
 * Update these based on your deployment
 */
const DEFAULT_BOUNTY_PROGRAM = '7CjDDSGfTDYAydZ3nSamXbahqsaapDY862PQQaVJwiw2';

// Check if env var is a valid address (not a placeholder)
const isValidEnvAddress = (addr: string | undefined): boolean => {
  if (!addr) return false;
  // Check if it's a placeholder value
  if (addr.includes('your_') || addr.includes('_address') || addr.length < 32) return false;
  return true;
};

export const PROGRAMS = {
  BugBountyPlatform: isValidEnvAddress(process.env.NEXT_PUBLIC_BOUNTY_PROGRAM) 
    ? process.env.NEXT_PUBLIC_BOUNTY_PROGRAM! 
    : DEFAULT_BOUNTY_PROGRAM,
  ReputationNFT: process.env.NEXT_PUBLIC_REPUTATION_NFT || '',
};

/**
 * Helper to validate Solana public key
 */
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to convert string to PublicKey
 */
export function toPublicKey(key: string): PublicKey | null {
  try {
    return new PublicKey(key);
  } catch {
    return null;
  }
}

/**
 * IPFS Configuration
 */
export const IPFS_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_IPFS_API || 'https://api.web3.storage',
  token: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN || '',
  gatewayUrl: 'https://w3s.link/ipfs',
};

/**
 * Transaction settings (Solana uses dynamic fees, not gas multipliers)
 */
export const TX_CONFIG = {
  confirmations: 1,
  timeout: 60000, // 60 seconds
};
