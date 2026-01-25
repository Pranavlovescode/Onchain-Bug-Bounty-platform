'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { ReportCard, NFTBadge, StatusChip } from '@/components/cards';

/**
 * Researcher Dashboard
 * Shows submitted reports, earnings, and reputation
 */
export default function ResearcherDashboard() {
  const { publicKey, connected } = useWallet();

  // Mock data - in production, fetch from smart contracts
  const researcherProfile = {
    address: publicKey?.toBase58() || 'Not connected',
    totalBugsFound: 5,
    totalEarnings: '2.5',
    reputationScore: 850,
    submissions: [
      {
        id: '1',
        title: 'Reentrancy in withdraw function',
        severity: 'critical' as const,
        status: 'approved' as const,
        submittedDate: 'Jan 15, 2025',
        reward: '15 SOL',
        bountyProject: 'Uniswap V4',
      },
      {
        id: '2',
        title: 'Integer overflow in token transfer',
        severity: 'high' as const,
        status: 'reviewing' as const,
        submittedDate: 'Jan 10, 2025',
        reward: undefined,
        bountyProject: 'OpenSea',
      },
      {
        id: '3',
        title: 'Missing input validation',
        severity: 'medium' as const,
        status: 'approved' as const,
        submittedDate: 'Dec 28, 2024',
        reward: '5 SOL',
        bountyProject: 'Lido',
      },
    ],
    nfts: [
      {
        bugsFound: 5,
        reputationScore: 850,
        isMinted: true,
      },
    ],
  };

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">Connect Wallet to View Dashboard</h1>
          <p className="text-gray-400 mb-8">
            Connect your wallet to see your vulnerability reports and earnings
          </p>
          <Button variant="primary" size="lg">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">My Researcher Dashboard</h1>
        <p className="text-gray-400">Track your vulnerability reports and earnings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <Card>
          <p className="text-gray-400 text-sm mb-2">Bugs Found</p>
          <p className="text-3xl font-bold text-blue-400">{researcherProfile.totalBugsFound}</p>
        </Card>
        <Card>
          <p className="text-gray-400 text-sm mb-2">Total Earnings</p>
          <p className="text-3xl font-bold text-green-400">{researcherProfile.totalEarnings} SOL</p>
        </Card>
        <Card>
          <p className="text-gray-400 text-sm mb-2">Reputation Score</p>
          <p className="text-3xl font-bold text-purple-400">{researcherProfile.reputationScore}</p>
        </Card>
        <Card>
          <p className="text-gray-400 text-sm mb-2">Status</p>
          <p className="text-lg font-bold text-gray-100">Active Hacker</p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Submissions */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-100">My Reports</h3>
              <Link href="/bounties">
                <Button variant="secondary" size="sm">
                  Submit New Report
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {researcherProfile.submissions.map((report) => (
                <Link key={report.id} href={`/reports/${report.id}`}>
                  <Card className="hover:border-blue-500 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-100">{report.title}</h4>
                          <span className="text-xs text-gray-400">{report.bountyProject}</span>
                        </div>
                        <p className="text-xs text-gray-400">{report.submittedDate}</p>
                      </div>
                      <StatusChip status={report.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          {report.severity === 'critical' && (
                            <span className="text-xs bg-red-900 text-red-100 px-2 py-1 rounded border border-red-700">
                              Critical
                            </span>
                          )}
                          {report.severity === 'high' && (
                            <span className="text-xs bg-orange-900 text-orange-100 px-2 py-1 rounded border border-orange-700">
                              High
                            </span>
                          )}
                          {report.severity === 'medium' && (
                            <span className="text-xs bg-yellow-900 text-yellow-100 px-2 py-1 rounded border border-yellow-700">
                              Medium
                            </span>
                          )}
                        </div>
                      </div>
                      {report.reward && (
                        <p className="font-semibold text-green-400">{report.reward}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reputation NFT */}
          {researcherProfile.nfts.map((nft, idx) => (
            <NFTBadge
              key={idx}
              bugsFound={nft.bugsFound}
              reputationScore={nft.reputationScore}
              isMinted={nft.isMinted}
            />
          ))}

          {/* Profile Info */}
          <Card>
            <h4 className="font-bold text-gray-100 mb-4">Your Profile</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                <p className="font-mono text-sm text-gray-300 bg-gray-900 p-2 rounded">
                  {researcherProfile.address}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Member Since</p>
                <p className="text-sm text-gray-300">January 2025</p>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card>
            <h4 className="font-bold text-gray-100 mb-4">Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Approval Rate</span>
                <span className="text-sm font-bold text-green-400">100%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Average Reward</span>
                <span className="text-sm font-bold text-gray-100">8.33 SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Pending Reviews</span>
                <span className="text-sm font-bold text-yellow-400">1</span>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <Card className="bg-blue-900 border-blue-700">
            <p className="text-blue-200 text-sm mb-4">
              Keep submitting quality reports to increase your reputation score and earn more rewards
            </p>
            <Link href="/bounties" className="w-full">
              <Button variant="primary" className="w-full" size="sm">
                Find More Bounties
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
