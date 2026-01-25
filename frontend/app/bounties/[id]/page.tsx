'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { SeverityBadge, StatusChip } from '@/components/cards';
import { Markdown } from '@/components/markdown';
import { TransactionToast } from '@/components/forms';

/**
 * Bounty Detail Page
 * Shows full bounty information and submission options
 */
export default function BountyDetail({ params }: { params: { id: string } }) {
  const [showTransaction, setShowTransaction] = useState(false);

  // Mock bounty data - in production, fetch from smart contracts
  const bounty = {
    id: params.id,
    projectName: 'Uniswap V4',
    description:
      'Uniswap V4 introduces hooks, a new contract interaction paradigm, and improved capital efficiency. This bounty covers critical vulnerabilities in the core protocol including but not limited to:',
    longDescription: `
# Uniswap V4 Security Bounty

## About This Program

Uniswap V4 is the next generation of the Uniswap Protocol, featuring:

- **Hooks**: Custom contract interactions at key points in the swap lifecycle
- **Singleton Pattern**: All pools share a single contract, reducing deployment costs
- **Improved Capital Efficiency**: Better use of liquidity provider capital
- **Enhanced Features**: Flash accounting, dynamic fees, and more

## In Scope

Critical vulnerabilities in:
- Core swap logic
- Hook execution mechanism
- Liquidity management
- Flash accounting
- Token transfers
- Access control

## Out of Scope

- Frontend vulnerabilities
- Phishing attacks
- Performance issues
- Cosmetic bugs
- Known issues already reported

## Severity Guidelines

**Critical**: Loss of funds, unauthorized access, protocol breaking
**High**: Significant financial impact, token theft, major functionality issues
**Medium**: Temporary disruption, limited fund impact, design issues
**Low**: Minor efficiency problems, non-critical bugs
    `,
    totalReward: '50',
    remainingReward: '45',
    creatorAddress: '0x1234...5678',
    createdAt: '2024-01-15',
    expiresAt: '2024-03-15',
    status: 'active' as const,
    governanceType: 'dao' as const,
    governanceAddress: '0x5678...9012',
    severityTiers: [
      {
        severity: 'critical' as const,
        minReward: '25',
        maxReward: '50',
        description: 'Loss of funds or protocol breaking vulnerabilities',
      },
      {
        severity: 'high' as const,
        minReward: '10',
        maxReward: '24',
        description: 'Significant financial impact or major functionality issues',
      },
      {
        severity: 'medium' as const,
        minReward: '5',
        maxReward: '9',
        description: 'Moderate impact, limited funds at risk',
      },
      {
        severity: 'low' as const,
        minReward: '1',
        maxReward: '4',
        description: 'Minor issues with low impact',
      },
    ],
    submissionsCount: 12,
    approvedCount: 3,
  };

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
              Created on {bounty.createdAt} • Expires {bounty.expiresAt}
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
            <div className="space-y-4">
              {bounty.severityTiers.map((tier, idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <SeverityBadge severity={tier.severity} />
                    <div className="text-right">
                      <div className="font-bold text-gray-100">
                        {tier.minReward} - {tier.maxReward} SOL
                      </div>
                      <p className="text-xs text-gray-400">Reward range</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{tier.description}</p>
                </div>
              ))}
            </div>
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
                <p className="text-sm text-gray-400 mb-1">Governance Address</p>
                <p className="font-mono text-sm text-gray-300 bg-gray-900 p-3 rounded-lg">
                  {bounty.governanceAddress}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-gray-300">{bounty.approvedCount}</span> of{' '}
                  <span className="font-semibold text-gray-300">{bounty.submissionsCount}</span> reports
                  approved
                </p>
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
              <div className="text-4xl font-bold text-blue-400 mb-3">{bounty.totalReward}</div>
              <p className="text-gray-300 mb-4">ETH Available</p>

              <div className="bg-gray-900 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400 mb-1">Remaining</p>
                <p className="font-bold text-green-400">{bounty.remainingReward} ETH</p>
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
                <span className="font-bold text-gray-100">{bounty.submissionsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Approved Reports</span>
                <span className="font-bold text-green-400">{bounty.approvedCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Paid Out</span>
                <span className="font-bold text-gray-100">{parseFloat(bounty.totalReward) - parseFloat(bounty.remainingReward)} ETH</span>
              </div>
            </div>
          </Card>

          {/* Creator */}
          <Card>
            <h4 className="font-bold text-gray-100 mb-3">Created By</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-500 rounded-full" />
              <div>
                <p className="text-sm font-semibold text-gray-100">{bounty.projectName}</p>
                <p className="text-xs text-gray-400">{bounty.creatorAddress}</p>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <Card className="bg-blue-900 border-blue-700">
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
        </div>
      </div>

      {/* Transaction Toast */}
      {showTransaction && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <TransactionToast
            hash="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            status="success"
            message="Vulnerability report submitted successfully!"
            explorerUrl="https://etherscan.io"
            onDismiss={() => setShowTransaction(false)}
          />
        </div>
      )}
    </div>
  );
}
