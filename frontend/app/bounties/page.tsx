'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { BountyCard, SeverityBadge } from '@/components/cards';
import { BountyFilters } from '@/components/forms';

/**
 * Bounties Dashboard Page
 * List all active bounties with filtering
 */
export default function BountiesDashboard() {
  const [filters, setFilters] = useState({});

  // Mock bounty data - in production, fetch from smart contracts
  const mockBounties = [
    {
      id: '1',
      projectName: 'Uniswap V4',
      description: 'Bug bounty for Uniswap V4 smart contracts and core protocol',
      totalReward: '50',
      severities: [
        { level: 'critical' as const, reward: '50' },
        { level: 'high' as const, reward: '25' },
        { level: 'medium' as const, reward: '10' },
      ],
      governanceType: 'dao' as const,
      status: 'active' as const,
      expiresIn: '45 days',
    },
    {
      id: '2',
      projectName: 'OpenSea Smart Contracts',
      description: 'Security bounty for OpenSea marketplace contracts',
      totalReward: '100',
      severities: [
        { level: 'critical' as const, reward: '100' },
        { level: 'high' as const, reward: '50' },
      ],
      governanceType: 'safe' as const,
      status: 'active' as const,
      expiresIn: '60 days',
    },
    {
      id: '3',
      projectName: 'Lido Staking',
      description: 'Bug bounty program for Lido staking protocol',
      totalReward: '75',
      severities: [
        { level: 'critical' as const, reward: '75' },
        { level: 'high' as const, reward: '40' },
        { level: 'medium' as const, reward: '15' },
      ],
      governanceType: 'dao' as const,
      status: 'active' as const,
      expiresIn: '30 days',
    },
    {
      id: '4',
      projectName: 'Curve Finance',
      description: 'Security audit and bug bounty for Curve AMM',
      totalReward: '60',
      severities: [
        { level: 'critical' as const, reward: '60' },
        { level: 'high' as const, reward: '30' },
      ],
      governanceType: 'multisig' as const,
      status: 'active' as const,
      expiresIn: '20 days',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">Active Bounties</h1>
        <p className="text-gray-400">Find and submit vulnerability reports to earn rewards</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <h3 className="text-lg font-bold text-gray-100 mb-6">Filters</h3>
            <BountyFilters onFilterChange={setFilters} />
          </Card>
        </div>

        {/* Bounties Grid */}
        <div className="lg:col-span-3">
          <div className="grid md:grid-cols-2 gap-6">
            {mockBounties.map((bounty) => (
              <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                <BountyCard {...bounty} />
              </Link>
            ))}
          </div>

          {mockBounties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No bounties match your filters</p>
              <Button variant="secondary" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-16 grid md:grid-cols-3 gap-6">
        <Card>
          <h4 className="font-bold text-gray-100 mb-2">💰 How to Get Paid</h4>
          <p className="text-sm text-gray-400">
            Find a vulnerability, submit a detailed report with proof-of-concept, and get paid upon approval
          </p>
        </Card>
        <Card>
          <h4 className="font-bold text-gray-100 mb-2">🛡️ Security Focus</h4>
          <p className="text-sm text-gray-400">
            Only legitimate, well-documented security issues qualify. Low-quality submissions are rejected
          </p>
        </Card>
        <Card>
          <h4 className="font-bold text-gray-100 mb-2">📊 Track Progress</h4>
          <p className="text-sm text-gray-400">
            Monitor your submissions in the dashboard and receive updates as projects review them
          </p>
        </Card>
      </div>
    </div>
  );
}
