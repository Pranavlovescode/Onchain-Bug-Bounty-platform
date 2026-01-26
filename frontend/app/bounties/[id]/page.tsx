'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { SeverityBadge, StatusChip } from '@/components/cards';
import { Markdown } from '@/components/markdown';
import { TransactionToast } from '@/components/forms';
import { useBountyContract } from '@/hooks/useBountyContract';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// Type for the bounty detail data
interface BountyDetail {
  id: string;
  publicKey: string;
  projectName: string;
  description: string;
  longDescription: string;
  totalReward: string;
  remainingReward: string;
  criticalReward: string;
  highReward: string;
  mediumReward: string;
  lowReward: string;
  severityTiers: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    reward: string;
    description: string;
  }>;
  governanceType: 'dao' | 'safe' | 'multisig';
  governanceAddress: string;
  status: 'active' | 'paused' | 'closed';
  owner: string;
  totalReports: number;
  approvedReports: number;
  totalPaidOut: string;
  createdAt: Date;
  rewardTokenMint: string | null;
}

/**
 * Bounty Detail Page
 * Shows full bounty information and submission options
 */
export default function BountyDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [showTransaction, setShowTransaction] = useState(false);
  const [bounty, setBounty] = useState<BountyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { program, connected } = useBountyContract();

  // Format lamports to SOL
  const formatSol = (lamports: any) => {
    return (Number(lamports.toString()) / LAMPORTS_PER_SOL).toFixed(2);
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Fetch bounty details from blockchain
  useEffect(() => {
    const loadBountyDetails = async () => {
      if (!program) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const bountyPublicKey = new PublicKey(resolvedParams.id);
        const accountNamespace = program.account as any;
        const vaultAccount = await accountNamespace.bugBountyVault.fetch(bountyPublicKey);

        const criticalReward = formatSol(vaultAccount.criticalReward);
        const highReward = formatSol(vaultAccount.highReward);
        const mediumReward = formatSol(vaultAccount.mediumReward);
        const lowReward = formatSol(vaultAccount.lowReward);
        const totalFunded = formatSol(vaultAccount.totalFunded);
        const totalPaidOut = formatSol(vaultAccount.totalPaidOut);
        const remaining = (Number(totalFunded) - Number(totalPaidOut)).toFixed(2);

        // Build severity tiers from on-chain data
        const severityTiers: BountyDetail['severityTiers'] = [];
        if (Number(criticalReward) > 0) {
          severityTiers.push({
            severity: 'critical',
            reward: criticalReward,
            description: 'Loss of funds, unauthorized access, or protocol breaking vulnerabilities',
          });
        }
        if (Number(highReward) > 0) {
          severityTiers.push({
            severity: 'high',
            reward: highReward,
            description: 'Significant financial impact, token theft, or major functionality issues',
          });
        }
        if (Number(mediumReward) > 0) {
          severityTiers.push({
            severity: 'medium',
            reward: mediumReward,
            description: 'Temporary disruption, limited fund impact, or design issues',
          });
        }
        if (Number(lowReward) > 0) {
          severityTiers.push({
            severity: 'low',
            reward: lowReward,
            description: 'Minor efficiency problems or non-critical bugs',
          });
        }

        const bountyData: BountyDetail = {
          id: resolvedParams.id,
          publicKey: bountyPublicKey.toBase58(),
          projectName: `Bug Bounty Program`,
          description: `Bug bounty vault created by ${vaultAccount.programTeam.toBase58().slice(0, 8)}...`,
          longDescription: `
# Bug Bounty Security Program

## About This Program

This is a decentralized bug bounty program running on Solana. Security researchers can submit vulnerability reports and earn rewards based on the severity of their findings.

## Program Details

- **Vault Address**: \`${bountyPublicKey.toBase58()}\`
- **Program Team**: \`${vaultAccount.programTeam.toBase58()}\`
- **Governance Authority**: \`${vaultAccount.governanceAuthority.toBase58()}\`

## Reward Structure

| Severity | Reward (SOL) |
|----------|-------------|
| Critical | ${criticalReward} SOL |
| High | ${highReward} SOL |
| Medium | ${mediumReward} SOL |
| Low | ${lowReward} SOL |

## In Scope

Critical vulnerabilities in:
- Smart contract logic
- Access control mechanisms
- Fund management
- State transitions
- Token handling

## Out of Scope

- Frontend vulnerabilities
- Phishing attacks
- Performance issues
- Cosmetic bugs
- Known issues already reported

## Submission Guidelines

1. Provide a clear description of the vulnerability
2. Include steps to reproduce
3. Attach proof-of-concept if possible
4. Suggest potential fixes (optional)
          `,
          totalReward: totalFunded,
          remainingReward: remaining,
          criticalReward,
          highReward,
          mediumReward,
          lowReward,
          severityTiers,
          governanceType: 'dao',
          governanceAddress: vaultAccount.governanceAuthority.toBase58(),
          status: vaultAccount.vaultActive ? 'active' : 'paused',
          owner: vaultAccount.programTeam.toBase58(),
          totalReports: Number(vaultAccount.totalReports.toString()),
          approvedReports: Number(vaultAccount.approvedReports.toString()),
          totalPaidOut,
          createdAt: new Date(Number(vaultAccount.createdAt.toString()) * 1000),
          rewardTokenMint: vaultAccount.rewardTokenMint ? vaultAccount.rewardTokenMint.toBase58() : null,
        };

        setBounty(bountyData);
      } catch (err) {
        console.error('Failed to fetch bounty details:', err);
        setError('Failed to load bounty details. The bounty may not exist or there was a network error.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBountyDetails();
  }, [program, resolvedParams.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading bounty details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !bounty) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/bounties" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
          ← Back to Bounties
        </Link>
        <Card className="text-center py-12">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Bounty Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The requested bounty could not be found.'}</p>
          <Link href="/bounties">
            <Button variant="primary">Browse All Bounties</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/bounties" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
          ← Back to Bounties
        </Link>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-100 mb-2">{bounty.projectName}</h1>
            <p className="text-gray-400 text-sm">
              Created on {bounty.createdAt.toLocaleDateString()} • Vault: {truncateAddress(bounty.publicKey)}
            </p>
          </div>
          <StatusChip status={bounty.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <Card>
            <h3 className="text-xl font-bold text-gray-100 mb-4">Overview</h3>
            <Markdown content={bounty.longDescription} />
          </Card>

          {/* Severity Tiers */}
          <Card>
            <h3 className="text-xl font-bold text-gray-100 mb-6">Reward Tiers</h3>
            {bounty.severityTiers.length > 0 ? (
              <div className="space-y-4">
                {bounty.severityTiers.map((tier, idx) => (
                  <div key={idx} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <SeverityBadge severity={tier.severity} />
                      <div className="text-right">
                        <div className="font-bold text-gray-100">
                          {tier.reward} SOL
                        </div>
                        <p className="text-xs text-gray-400">Max reward</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">{tier.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No reward tiers configured for this bounty.</p>
            )}
          </Card>

          {/* Governance Info */}
          <Card>
            <h3 className="text-xl font-bold text-gray-100 mb-4">Governance & Approvals</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Governance Type</p>
                <Badge variant="default">{bounty.governanceType.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Governance Authority</p>
                <p className="font-mono text-sm text-gray-300 bg-gray-900 p-3 rounded-lg break-all">
                  {bounty.governanceAddress}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Program Team (Owner)</p>
                <p className="font-mono text-sm text-gray-300 bg-gray-900 p-3 rounded-lg break-all">
                  {bounty.owner}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-gray-300">{bounty.approvedReports}</span> of{' '}
                  <span className="font-semibold text-gray-300">{bounty.totalReports}</span> reports
                  approved
                </p>
              </div>
            </div>
          </Card>

          {/* On-Chain Details */}
          <Card>
            <h3 className="text-xl font-bold text-gray-100 mb-4">On-Chain Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Vault Address</p>
                <p className="font-mono text-sm text-gray-300 bg-gray-900 p-3 rounded-lg break-all">
                  {bounty.publicKey}
                </p>
              </div>
              {bounty.rewardTokenMint && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Reward Token Mint</p>
                  <p className="font-mono text-sm text-gray-300 bg-gray-900 p-3 rounded-lg break-all">
                    {bounty.rewardTokenMint}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="bg-gray-900 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Critical Reward</p>
                  <p className="font-bold text-red-400">{bounty.criticalReward} SOL</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">High Reward</p>
                  <p className="font-bold text-orange-400">{bounty.highReward} SOL</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Medium Reward</p>
                  <p className="font-bold text-yellow-400">{bounty.mediumReward} SOL</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Low Reward</p>
                  <p className="font-bold text-blue-400">{bounty.lowReward} SOL</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reward Pool */}
          <Card>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Bounty Pool</p>
              <div className="text-4xl font-bold text-blue-400 mb-1">{bounty.totalReward}</div>
              <p className="text-gray-300 mb-4">SOL Total Funded</p>

              <div className="bg-gray-900 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400 mb-1">Remaining</p>
                <p className="font-bold text-green-400">{bounty.remainingReward} SOL</p>
              </div>

              <Link href={`/bounties/${bounty.id}/submit`} className="w-full">
                <Button variant="primary" className="w-full">
                  Submit Vulnerability Report
                </Button>
              </Link>
            </div>
          </Card>

          {/* Stats */}
          <Card>
            <h4 className="font-bold text-gray-100 mb-4">Program Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Submissions</span>
                <span className="font-bold text-gray-100">{bounty.totalReports}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Approved Reports</span>
                <span className="font-bold text-green-400">{bounty.approvedReports}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Paid Out</span>
                <span className="font-bold text-gray-100">{bounty.totalPaidOut} SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Status</span>
                <StatusChip status={bounty.status} size="sm" />
              </div>
            </div>
          </Card>

          {/* Creator */}
          <Card>
            <h4 className="font-bold text-gray-100 mb-3">Program Team</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {bounty.owner.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100">{bounty.projectName}</p>
                <p className="text-xs text-gray-400 truncate">{truncateAddress(bounty.owner)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 break-all font-mono">
                {bounty.owner}
              </p>
            </div>
          </Card>

          {/* CTA */}
          <Card className="bg-blue-900/50 border-blue-700">
            <div className="text-center">
              <p className="text-blue-200 text-sm mb-4">
                Ready to earn rewards? Submit a detailed vulnerability report with proof-of-concept.
              </p>
              <Link href={`/bounties/${bounty.id}/submit`} className="w-full">
                <Button variant="primary" className="w-full">
                  Start Report
                </Button>
              </Link>
            </div>
          </Card>

          {/* Helpful Links */}
          <Card>
            <h4 className="font-bold text-gray-100 mb-3">Quick Links</h4>
            <div className="space-y-2">
              <a 
                href={`https://explorer.solana.com/address/${bounty.publicKey}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Solana Explorer
              </a>
              <a 
                href={`https://explorer.solana.com/address/${bounty.owner}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Program Team
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Toast */}
      {showTransaction && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <TransactionToast
            hash="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            status="success"
            message="Vulnerability report submitted successfully!"
            explorerUrl="https://explorer.solana.com"
            onDismiss={() => setShowTransaction(false)}
          />
        </div>
      )}
    </div>
  );
}
