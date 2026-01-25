'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useBountyContract, VaultData } from '@/hooks/useBountyContract';
import { useTransaction } from '@/hooks/useTransaction';

/**
 * Existing Vault Display Component
 */
function ExistingVaultView({ vault, onRefresh }: { vault: VaultData; onRefresh: () => void }) {
  const { publicKey } = useWallet();
  
  const formatSol = (lamports: any) => {
    return (Number(lamports.toString()) / LAMPORTS_PER_SOL).toFixed(4);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
          ← Back Home
        </Link>
        <h1 className="text-4xl font-bold text-gray-100 mb-2">Your Bug Bounty Vault</h1>
        <p className="text-gray-400">
          You already have an active bounty vault. Manage it below.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Vault Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card className="border-green-700 bg-green-900/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-bold text-green-100">Vault Active</h3>
            </div>
            <p className="text-green-200 text-sm">
              Your bounty vault is live and ready to receive vulnerability reports from security researchers.
            </p>
          </Card>

          {/* Vault Info */}
          <Card>
            <h3 className="text-lg font-bold text-gray-100 mb-6 pb-4 border-b border-gray-700">
              Vault Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Vault Address</span>
                <span className="text-gray-100 font-mono text-sm">
                  {vault.publicKey.toBase58().slice(0, 8)}...{vault.publicKey.toBase58().slice(-8)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Owner</span>
                <span className="text-gray-100 font-mono text-sm">
                  {vault.account.programTeam.toBase58().slice(0, 8)}...
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Governance Authority</span>
                <span className="text-gray-100 font-mono text-sm">
                  {vault.account.governanceAuthority.toBase58().slice(0, 8)}...
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Status</span>
                <span className={`px-2 py-1 rounded text-sm ${vault.account.vaultActive ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
                  {vault.account.vaultActive ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>
          </Card>

          {/* Reward Tiers */}
          <Card>
            <h3 className="text-lg font-bold text-gray-100 mb-6 pb-4 border-b border-gray-700">
              Reward Tiers
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm font-medium">Critical</p>
                <p className="text-2xl font-bold text-red-100">{formatSol(vault.account.criticalReward)} SOL</p>
              </div>
              
              <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4">
                <p className="text-orange-300 text-sm font-medium">High</p>
                <p className="text-2xl font-bold text-orange-100">{formatSol(vault.account.highReward)} SOL</p>
              </div>
              
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-300 text-sm font-medium">Medium</p>
                <p className="text-2xl font-bold text-yellow-100">{formatSol(vault.account.mediumReward)} SOL</p>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-blue-300 text-sm font-medium">Low</p>
                <p className="text-2xl font-bold text-blue-100">{formatSol(vault.account.lowReward)} SOL</p>
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <Card>
            <h3 className="text-lg font-bold text-gray-100 mb-6 pb-4 border-b border-gray-700">
              Statistics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-gray-100">{formatSol(vault.account.totalFunded)}</p>
                <p className="text-gray-400 text-sm">Total Funded (SOL)</p>
              </div>
              
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-gray-100">{formatSol(vault.account.totalPaidOut)}</p>
                <p className="text-gray-400 text-sm">Paid Out (SOL)</p>
              </div>
              
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-gray-100">{vault.account.totalReports.toString()}</p>
                <p className="text-gray-400 text-sm">Total Reports</p>
              </div>
              
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-gray-100">{vault.account.approvedReports.toString()}</p>
                <p className="text-gray-400 text-sm">Approved</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card>
            <h4 className="font-bold text-gray-100 mb-4">🔧 Quick Actions</h4>
            <div className="space-y-3">
              <Button variant="primary" className="w-full" disabled>
                Add Funds (Coming Soon)
              </Button>
              <Button variant="secondary" className="w-full" disabled>
                Pause Vault (Coming Soon)
              </Button>
              <Button variant="secondary" className="w-full" onClick={onRefresh}>
                Refresh Data
              </Button>
            </div>
          </Card>

          <Card>
            <h4 className="font-bold text-gray-100 mb-4">📋 Vault Address</h4>
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Click to copy</p>
              <button 
                onClick={() => navigator.clipboard.writeText(vault.publicKey.toBase58())}
                className="text-sm font-mono text-blue-400 hover:text-blue-300 break-all text-left"
              >
                {vault.publicKey.toBase58()}
              </button>
            </div>
          </Card>

          <Card className="bg-blue-900/30 border-blue-700">
            <h4 className="font-bold text-blue-100 mb-3">💡 Note</h4>
            <p className="text-sm text-blue-200">
              Each wallet can only have one vault. Share your vault address with security researchers so they can submit reports.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}


/**
 * Create Bounty Page
 * Form for project teams to create new bug bounty programs
 */
export default function CreateBountyPage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { createBounty, userVault, vaultLoading, fetchUserVault } = useBountyContract();
  const { waitForConfirmation } = useTransaction();
  
  const [isLoading, setIsLoading] = useState(false);
  const [txMessage, setTxMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    totalReward: '',
    governanceType: 'dao' as 'dao' | 'safe' | 'multisig',
    governanceAddress: publicKey?.toString() || '',
    severityTiers: [
      { level: 'critical', minReward: '', maxReward: '' },
      { level: 'high', minReward: '', maxReward: '' },
      { level: 'medium', minReward: '', maxReward: '' },
      { level: 'low', minReward: '', maxReward: '' },
    ],
    expiryDays: '90',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.totalReward || parseFloat(formData.totalReward) <= 0) {
      newErrors.totalReward = 'Valid reward amount is required';
    }
    if (!formData.governanceAddress.trim()) {
      newErrors.governanceAddress = 'Governance address is required';
    } else {
      // Validate Solana address format
      try {
        new PublicKey(formData.governanceAddress);
      } catch (error) {
        newErrors.governanceAddress = 'Invalid Solana public key address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setTxMessage(null);

    try {
      // Convert rewards to lamports (1 SOL = 1e9 lamports)
      const bountyData = {
        projectName: formData.projectName,
        description: formData.description,
        totalReward: formData.totalReward,
        governanceType: formData.governanceType,
        governanceAddress: formData.governanceAddress.trim(),
        severityTiers: formData.severityTiers.map(tier => ({
          level: tier.level,
          minReward: tier.minReward || '0',
          maxReward: tier.maxReward || '0',
        })),
        expiryDays: parseInt(formData.expiryDays, 10),
      };

      console.log("bounty data",bountyData)
      const { txId, signature } = await createBounty(bountyData);

      // Wait for confirmation
      const confirmed = await waitForConfirmation(signature);
      
      if (confirmed) {
        setTxMessage({
          type: 'success',
          text: `Bounty created successfully! TX: ${signature.slice(0, 8)}...`,
        });
        
        // Redirect to bounty detail page after 2 seconds
        setTimeout(() => {
          router.push(`/bounties/${txId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to create bounty:', error);
      setTxMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create bounty',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">Connect Wallet to Create a Bounty</h1>
          <p className="text-gray-400 mb-8">
            You must connect your wallet to create a new bug bounty program
          </p>
          <Button variant="primary" size="lg">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while checking for existing vault
  if (vaultLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Checking your vault...</h1>
          <p className="text-gray-400">Please wait while we check if you have an existing bounty vault.</p>
        </div>
      </div>
    );
  }

  // Show existing vault if user already has one
  if (userVault) {
    return <ExistingVaultView vault={userVault} onRefresh={fetchUserVault} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
          ← Back Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-100 mb-2">Create a Bug Bounty Program</h1>
        <p className="text-gray-400">
          Set up a decentralized bug bounty with on-chain escrowed funds
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-100 mb-4 pb-4 border-b border-gray-700">
                  Project Information
                </h3>

                <Input
                  label="Project Name"
                  placeholder="e.g., Uniswap V4"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  error={errors.projectName}
                  className="mb-4"
                />

                <Textarea
                  label="Program Description"
                  placeholder="Describe your project, the scope of the bounty, and what vulnerabilities you're looking for"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  error={errors.description}
                  rows={6}
                />
              </div>

              {/* Reward Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-100 mb-4 pb-4 border-b border-gray-700">
                  Reward Configuration
                </h3>

                <Input
                  label="Total Bounty Pool (SOL)"
                  type="number"
                  placeholder="50"
                  value={formData.totalReward}
                  onChange={(e) => setFormData({ ...formData, totalReward: e.target.value })}
                  error={errors.totalReward}
                  step="0.1"
                  className="mb-6"
                />

                <p className="text-gray-300 font-semibold mb-4">Severity Tier Rewards</p>
                <div className="space-y-4">
                  {formData.severityTiers.map((tier, idx) => (
                    <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="font-semibold text-gray-200 mb-3 capitalize">{tier.level}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Min Reward (SOL)"
                          type="number"
                          placeholder="0"
                          value={tier.minReward}
                          onChange={(e) => {
                            const newTiers = [...formData.severityTiers];
                            newTiers[idx].minReward = e.target.value;
                            setFormData({ ...formData, severityTiers: newTiers });
                          }}
                          step="0.1"
                        />
                        <Input
                          label="Max Reward (SOL)"
                          type="number"
                          placeholder="0"
                          value={tier.maxReward}
                          onChange={(e) => {
                            const newTiers = [...formData.severityTiers];
                            newTiers[idx].maxReward = e.target.value;
                            setFormData({ ...formData, severityTiers: newTiers });
                          }}
                          step="0.1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Governance */}
              <div>
                <h3 className="text-lg font-bold text-gray-100 mb-4 pb-4 border-b border-gray-700">
                  Governance Setup
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-200 mb-3">Governance Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['dao', 'safe', 'multisig'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, governanceType: type })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.governanceType === type
                            ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                            : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                        }`}
                      >
                        <p className="font-semibold text-gray-100 capitalize">{type}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label="Governance Address"
                      placeholder="Enter Solana address or click Use My Wallet"
                      value={formData.governanceAddress}
                      onChange={(e) => setFormData({ ...formData, governanceAddress: e.target.value })}
                      error={errors.governanceAddress}
                    />
                  </div>
                  {publicKey && (
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setFormData({ ...formData, governanceAddress: publicKey.toString() })}
                      className="mb-1"
                    >
                      Use My Wallet
                    </Button>
                  )}
                </div>
              </div>

              {/* Expiry */}
              <div>
                <Input
                  label="Bounty Expiry (Days)"
                  type="number"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                  min="1"
                  max="365"
                />
              </div>

              {/* Submit */}
              {txMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    txMessage.type === 'success'
                      ? 'bg-green-900 border border-green-700 text-green-100'
                      : 'bg-red-900 border border-red-700 text-red-100'
                  }`}
                >
                  {txMessage.text}
                </div>
              )}
              
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating Bounty...' : 'Create Bounty Program'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h4 className="font-bold text-gray-100 mb-4">💡 Best Practices</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Define clear scope and guidelines</li>
              <li>• Set appropriate reward amounts</li>
              <li>• Specify severity criteria</li>
              <li>• Use multisig for governance</li>
              <li>• Allow sufficient time</li>
              <li>• Promote your program widely</li>
            </ul>
          </Card>

          <Card>
            <h4 className="font-bold text-gray-100 mb-4">📋 What to Include</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ Project background</li>
              <li>✓ Smart contract scope</li>
              <li>✓ Known issues (if any)</li>
              <li>✓ Submission requirements</li>
              <li>✓ Payout timeline</li>
              <li>✓ Contact information</li>
            </ul>
          </Card>

          <Card className="bg-blue-900 border-blue-700">
            <h4 className="font-bold text-blue-100 mb-3">⚠️ Important</h4>
            <p className="text-sm text-blue-200">
              Funds will be locked in smart contracts. Ensure you have sufficient SOL before creating the bounty.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
