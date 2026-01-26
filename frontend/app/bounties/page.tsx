'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { BountyCard, SeverityBadge } from '@/components/cards';
import { BountyFilters } from '@/components/forms';
import { useBountyContract } from '@/hooks/useBountyContract';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// Type for on-chain vault data
interface OnChainBounty {
  id: string;
  publicKey: string;
  projectName: string;
  description: string;
  totalReward: string;
  severities: Array<{ level: 'critical' | 'high' | 'medium' | 'low'; reward: string }>;
  governanceType: 'dao' | 'safe' | 'multisig';
  status: 'active' | 'paused';
  owner: string;
  totalReports: number;
  approvedReports: number;
  createdAt: Date;
}

/**
 * Bounties Dashboard Page
 * List all active bounties with filtering
 */
export default function BountiesDashboard() {
  const [filters, setFilters] = useState({});
  const [bounties, setBounties] = useState<OnChainBounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { fetchBounties, connected } = useBountyContract();

  // Format lamports to SOL
  const formatSol = (lamports: any) => {
    return (Number(lamports.toString()) / LAMPORTS_PER_SOL).toFixed(2);
  };

  // Fetch bounties from blockchain
  useEffect(() => {
    const loadBounties = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const vaults = await fetchBounties();
        
        // Transform on-chain data to UI format
        const formattedBounties: OnChainBounty[] = vaults.map((vault: any, index: number) => {
          const account = vault.account;
          const criticalReward = formatSol(account.criticalReward);
          const highReward = formatSol(account.highReward);
          const mediumReward = formatSol(account.mediumReward);
          const lowReward = formatSol(account.lowReward);
          
          // Calculate total from rewards
          const total = (
            Number(criticalReward) + 
            Number(highReward) + 
            Number(mediumReward) + 
            Number(lowReward)
          ).toFixed(2);

          return {
            id: vault.publicKey.toBase58(),
            publicKey: vault.publicKey.toBase58(),
            projectName: `Bounty Program #${index + 1}`,
            description: `Bug bounty vault created by ${account.programTeam.toBase58().slice(0, 8)}...`,
            totalReward: formatSol(account.totalFunded),
            severities: [
              { level: 'critical' as const, reward: criticalReward },
              { level: 'high' as const, reward: highReward },
              { level: 'medium' as const, reward: mediumReward },
              { level: 'low' as const, reward: lowReward },
            ].filter(s => Number(s.reward) > 0),
            governanceType: 'dao' as const,
            status: account.vaultActive ? 'active' as const : 'paused' as const,
            owner: account.programTeam.toBase58(),
            totalReports: Number(account.totalReports.toString()),
            approvedReports: Number(account.approvedReports.toString()),
            createdAt: new Date(Number(account.createdAt.toString()) * 1000),
          };
        });
        console.log("formatted Bounties",formattedBounties);
        setBounties(formattedBounties);
      } catch (err) {
        console.error('Failed to fetch bounties:', err);
        setError('Failed to load bounties from blockchain');
      } finally {
        setIsLoading(false);
      }
    };

    loadBounties();
  }, [fetchBounties]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-100 mb-2">Active Bounties</h1>
          <p className="text-gray-400">Find and submit vulnerability reports to earn rewards</p>
        </div>
        <Link href="/create">
          <Button variant="primary">Create Bounty</Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <h3 className="text-lg font-bold text-gray-100 mb-6">Filters</h3>
            <BountyFilters onFilterChange={setFilters} />
            
            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                <span className="text-gray-100 font-bold">{bounties.length}</span> bounties found
              </p>
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-green-400 font-bold">
                  {bounties.filter(b => b.status === 'active').length}
                </span> active
              </p>
            </div>
          </Card>
        </div>

        {/* Bounties Grid */}
        <div className="lg:col-span-3">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading bounties from blockchain...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="border-red-700 bg-red-900/20">
              <div className="text-center py-8">
                <p className="text-red-300 mb-4">{error}</p>
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {/* Bounties List */}
          {!isLoading && !error && bounties.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {bounties.map((bounty) => (
                <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                  <Card className="hover:border-blue-500 transition-all cursor-pointer h-full">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-100">{bounty.projectName}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bounty.status === 'active' 
                          ? 'bg-green-900 text-green-100' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {bounty.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{bounty.description}</p>
                    
                    {/* Reward Tiers */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {bounty.severities.map((severity) => (
                        <span 
                          key={severity.level}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            severity.level === 'critical' ? 'bg-red-900/50 text-red-300' :
                            severity.level === 'high' ? 'bg-orange-900/50 text-orange-300' :
                            severity.level === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-blue-900/50 text-blue-300'
                          }`}
                        >
                          {severity.level}: {severity.reward} SOL
                        </span>
                      ))}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                      <div>
                        <p className="text-2xl font-bold text-blue-400">{bounty.totalReward} SOL</p>
                        <p className="text-xs text-gray-500">Total Funded</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-300">{bounty.totalReports} reports</p>
                        <p className="text-xs text-gray-500">{bounty.approvedReports} approved</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && bounties.length === 0 && (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">No Bounties Found</h3>
              <p className="text-gray-400 mb-6">
                {connected 
                  ? "Be the first to create a bug bounty program!"
                  : "Connect your wallet to view bounties or create one."}
              </p>
              <Link href="/create">
                <Button variant="primary">Create First Bounty</Button>
              </Link>
            </Card>
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
