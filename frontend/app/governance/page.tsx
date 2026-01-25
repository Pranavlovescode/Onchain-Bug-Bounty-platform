'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Button, Card, Badge } from '@/components/ui';
import { SeverityBadge, StatusChip } from '@/components/cards';

/**
 * Governance & Review Panel
 * Accessible only to DAO/multisig members
 * View and approve/reject vulnerability reports
 */
export default function GovernancePanel() {
  const { publicKey, connected } = useWallet();

  // Mock data - in production, check if user is multisig member
  const isGovernanceMember = true; // Would be verified against smart contract

  // Mock pending reports for review
  const pendingReports = [
    {
      id: '1',
      title: 'Reentrancy vulnerability in swap function',
      severity: 'critical' as const,
      submittedBy: '0x5678...9012',
      bountyId: '1',
      bountyProject: 'Uniswap V4',
      status: 'reviewing' as const,
      submittedDate: 'Jan 20, 2025',
      ipfsHash: 'QmXxxx...',
      votes: {
        approve: 3,
        reject: 0,
        pending: 2,
      },
      reward: '30',
    },
    {
      id: '2',
      title: 'Integer overflow in liquidity calculation',
      severity: 'high' as const,
      submittedBy: '0x9012...3456',
      bountyId: '1',
      bountyProject: 'Uniswap V4',
      status: 'reviewing' as const,
      submittedDate: 'Jan 18, 2025',
      ipfsHash: 'QmYyyy...',
      votes: {
        approve: 2,
        reject: 1,
        pending: 2,
      },
      reward: '20',
    },
    {
      id: '3',
      title: 'Missing access control check',
      severity: 'medium' as const,
      submittedBy: '0x3456...7890',
      bountyId: '2',
      bountyProject: 'OpenSea',
      status: 'reviewing' as const,
      submittedDate: 'Jan 15, 2025',
      ipfsHash: 'QmZzzz...',
      votes: {
        approve: 1,
        reject: 2,
        pending: 2,
      },
      reward: '10',
    },
  ];

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">
            Connect Wallet to Access Governance Panel
          </h1>
          <p className="text-gray-400 mb-8">
            You must be a DAO or multisig member to access this panel
          </p>
          <Button variant="primary" size="lg">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!isGovernanceMember) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-400 mb-8">
            Your wallet is not a member of any DAO or multisig governance. Only governance members can access this panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">Governance Panel</h1>
        <p className="text-gray-400">Review and vote on vulnerability reports</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100">
          <option>All Bounties</option>
          <option>Uniswap V4</option>
          <option>OpenSea</option>
          <option>Lido</option>
        </select>
        <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100">
          <option>All Severities</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {pendingReports.map((report) => (
          <Card key={report.id} className="hover:border-blue-500 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-100">{report.title}</h3>
                  <SeverityBadge severity={report.severity} size="sm" />
                </div>
                <p className="text-gray-400 text-sm">
                  {report.bountyProject} • {report.submittedDate}
                </p>
              </div>
              <StatusChip status={report.status} />
            </div>

            {/* Report Details */}
            <div className="grid md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-700">
              <div>
                <p className="text-xs text-gray-400 mb-1">Submitted By</p>
                <p className="font-mono text-sm text-blue-400">{report.submittedBy}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">IPFS Report</p>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${report.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm font-mono"
                >
                  View Report →
                </a>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Proposed Reward</p>
                <p className="text-lg font-bold text-green-400">{report.reward} SOL</p>
              </div>
            </div>

            {/* Voting Status */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-200 mb-3">Voting Status</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-900 border border-green-700 rounded-lg p-3">
                  <p className="text-green-100 text-sm">Approve</p>
                  <p className="text-2xl font-bold text-green-400">{report.votes.approve}</p>
                </div>
                <div className="bg-red-900 border border-red-700 rounded-lg p-3">
                  <p className="text-red-100 text-sm">Reject</p>
                  <p className="text-2xl font-bold text-red-400">{report.votes.reject}</p>
                </div>
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                  <p className="text-gray-200 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-gray-300">{report.votes.pending}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm">
                ✓ Approve
              </Button>
              <Button variant="danger" size="sm">
                ✗ Reject
              </Button>
              <Button variant="secondary" size="sm">
                ❓ Request Info
              </Button>
              <Button variant="ghost" size="sm">
                View Full Report
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* No Reports */}
      {pendingReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No pending reports for review</p>
        </div>
      )}
    </div>
  );
}
