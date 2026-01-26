'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button, Card } from '@/components/ui';
import { SeverityBadge, StatusChip } from '@/components/cards';
import { useBountyContract } from '@/hooks/useBountyContract';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getIPFSGatewayUrl, fetchJSONFromIPFS } from '@/lib/ipfs';
import Link from 'next/link';

interface VulnerabilityReportAccount {
  vault: PublicKey;
  researcher: PublicKey;
  severity: { critical?: {}; high?: {}; medium?: {}; low?: {} };
  status: { pending?: {}; approved?: {}; rejected?: {}; paid?: {} };
  reportIpfsHash: number[];
  reportBump: number;
  submittedAt: BN;
  approvedAt: BN | null;
  paidAt: BN | null;
  approver: PublicKey | null;
  approvalReason: string | null;
  payoutAmount: BN | null;
}

interface BountyVaultAccount {
  authority: PublicKey;
  programTeam: PublicKey;
  governanceAuthority: PublicKey;
  name: string;
  descriptionIpfsHash: number[];
  criticalReward: BN;
  highReward: BN;
  mediumReward: BN;
  lowReward: BN;
  totalFunded: BN;
  totalPaidOut: BN;
  totalReports: BN;
  approvedReports: BN;
  vaultActive: boolean;
  createdAt: BN;
}

interface IPFSReportData {
  title: string;
  description: string;
  severity: string;
  stepsToReproduce?: string;
  impact?: string;
  suggestedFix?: string;
  submitterAddress: string;
  bountyId: string;
  timestamp: number;
}

interface ParsedReport {
  id: string;
  publicKey: PublicKey;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  bountyProject: string;
  bountyId: string;
  vaultPubkey: PublicKey;
  submittedBy: string;
  researcherFullAddress: string;
  researcherPubkey: PublicKey;
  submittedDate: string;
  submittedTimestamp: number;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid';
  ipfsHash: string;
  payoutAmount: number | null;
  approver: string | null;
  impact?: string;
  stepsToReproduce?: string;
  suggestedFix?: string;
  // Bounty details
  bountyOwner: string;
  bountyRewards: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  bountyTotalFunded: number;
  bountyIsActive: boolean;
}

// Helper to convert byte array to IPFS CID string
const bytesToIpfsHash = (bytes: number[]): string => {
  const nonZeroBytes = bytes.filter((b) => b !== 0);
  if (nonZeroBytes.length === 0) return '';
  return String.fromCharCode(...nonZeroBytes);
};

// Try to resolve full CID from registry (for truncated hashes)
const resolveFullCid = async (shortHash: string): Promise<string> => {
  try {
    const response = await fetch(`/api/ipfs/registry?shortHash=${encodeURIComponent(shortHash)}`);
    if (response.ok) {
      const data = await response.json();
      return data.fullCid || shortHash;
    }
  } catch (e) {
    console.warn('Failed to resolve full CID:', e);
  }
  return shortHash;
};

const getSeverityFromEnum = (severity: { critical?: {}; high?: {}; medium?: {}; low?: {} }): 'critical' | 'high' | 'medium' | 'low' => {
  if (severity.critical !== undefined) return 'critical';
  if (severity.high !== undefined) return 'high';
  if (severity.medium !== undefined) return 'medium';
  return 'low';
};

const getStatusFromEnum = (status: { pending?: {}; approved?: {}; rejected?: {}; paid?: {} }): 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid' => {
  if (status.pending !== undefined) return 'submitted';
  if (status.approved !== undefined) return 'approved';
  if (status.rejected !== undefined) return 'rejected';
  if (status.paid !== undefined) return 'paid';
  return 'submitted';
};

const formatDate = (timestamp: BN): string => {
  const date = new Date(timestamp.toNumber() * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (timestamp: BN): string => {
  const date = new Date(timestamp.toNumber() * 1000);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const shortenAddress = (address: string): string => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const getExpectedReward = (severity: string, rewards: { critical: number; high: number; medium: number; low: number }): number => {
  switch (severity) {
    case 'critical': return rewards.critical;
    case 'high': return rewards.high;
    case 'medium': return rewards.medium;
    case 'low': return rewards.low;
    default: return 0;
  }
};

/**
 * Governance & Review Panel
 * Accessible only to DAO/multisig members
 * View and approve/reject vulnerability reports
 */
export default function GovernancePanel() {
  const { publicKey, connected } = useWallet();
  const { fetchReports, fetchBounties, approveReport, program } = useBountyContract();
  
  const [reports, setReports] = useState<ParsedReport[]>([]);
  const [vaults, setVaults] = useState<Map<string, BountyVaultAccount>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingReport, setProcessingReport] = useState<string | null>(null);

  // Mock governance check - in production, verify against smart contract
  const isGovernanceMember = true;

  const loadData = useCallback(async () => {
    if (!program) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all bounty vaults first to get project names
      const vaultData = await fetchBounties();
      const vaultMap = new Map<string, BountyVaultAccount>();
      vaultData.forEach((v: { publicKey: PublicKey; account: BountyVaultAccount }) => {
        vaultMap.set(v.publicKey.toBase58(), v.account);
      });
      setVaults(vaultMap);
      
      // Fetch all vulnerability reports
      const reportData = await fetchReports();

      console.log("reports from blockchain", reportData);
      
      // Parse reports into UI format (don't wait for IPFS data initially)
      const parsedReports: ParsedReport[] = reportData.map((r: { publicKey: PublicKey; account: VulnerabilityReportAccount }, index: number) => {
        const vault = vaultMap.get(r.account.vault.toBase58());
        const ipfsHash = bytesToIpfsHash(r.account.reportIpfsHash);
        const researcherAddress = r.account.researcher.toBase58();
        
        return {
          id: r.publicKey.toBase58(),
          publicKey: r.publicKey,
          title: `Vulnerability Report #${index + 1}`,
          description: '',
          severity: getSeverityFromEnum(r.account.severity),
          bountyProject: vault?.name || 'Unknown Bounty',
          bountyId: r.account.vault.toBase58(),
          vaultPubkey: r.account.vault,
          submittedBy: shortenAddress(researcherAddress),
          researcherFullAddress: researcherAddress,
          researcherPubkey: r.account.researcher,
          submittedDate: formatDate(r.account.submittedAt),
          submittedTimestamp: r.account.submittedAt.toNumber(),
          status: getStatusFromEnum(r.account.status),
          ipfsHash,
          payoutAmount: r.account.payoutAmount ? r.account.payoutAmount.toNumber() / LAMPORTS_PER_SOL : null,
          approver: r.account.approver ? shortenAddress(r.account.approver.toBase58()) : null,
          impact: undefined,
          stepsToReproduce: undefined,
          suggestedFix: undefined,
          // Bounty details
          bountyOwner: vault?.programTeam ? shortenAddress(vault.programTeam.toBase58()) : 'Unknown',
          bountyRewards: {
            critical: vault?.criticalReward ? vault.criticalReward.toNumber() / LAMPORTS_PER_SOL : 0,
            high: vault?.highReward ? vault.highReward.toNumber() / LAMPORTS_PER_SOL : 0,
            medium: vault?.mediumReward ? vault.mediumReward.toNumber() / LAMPORTS_PER_SOL : 0,
            low: vault?.lowReward ? vault.lowReward.toNumber() / LAMPORTS_PER_SOL : 0,
          },
          bountyTotalFunded: vault?.totalFunded ? vault.totalFunded.toNumber() / LAMPORTS_PER_SOL : 0,
          bountyIsActive: vault?.vaultActive ?? false,
        };
      });
      
      // Sort by submission date (newest first)
      parsedReports.sort((a, b) => b.submittedTimestamp - a.submittedTimestamp);
      
      setReports(parsedReports);
      setLoading(false);
      
      // Fetch IPFS data in background for each report
      for (const report of parsedReports) {
        if (report.ipfsHash) {
          // Try to resolve full CID first (on-chain stores truncated version)
          resolveFullCid(report.ipfsHash)
            .then((fullCid) => {
              console.log(`Resolved CID: ${report.ipfsHash} -> ${fullCid}`);
              return fetchJSONFromIPFS(fullCid, 'report.json');
            })
            .then((jsonData) => {
              const ipfsData = jsonData as unknown as IPFSReportData;
              setReports((prevReports) =>
                prevReports.map((r) =>
                  r.id === report.id
                    ? {
                        ...r,
                        title: ipfsData.title || r.title,
                        description: ipfsData.description || '',
                        impact: ipfsData.impact,
                        stepsToReproduce: ipfsData.stepsToReproduce,
                        suggestedFix: ipfsData.suggestedFix,
                      }
                    : r
                )
              );
            })
            .catch((err) => {
              console.warn(`Could not fetch IPFS data for report ${report.id}:`, err.message);
            });
        }
      }
    } catch (err) {
      console.error('Failed to load governance data:', err);
      setError('Failed to load reports from blockchain');
    } finally {
      setLoading(false);
    }
  }, [program, fetchReports, fetchBounties]);

  useEffect(() => {
    if (connected && program) {
      loadData();
    }
  }, [connected, program, loadData]);

  const handleApprove = async (report: ParsedReport) => {
    if (!publicKey) return;
    
    setProcessingReport(report.id);
    try {
      await approveReport(report.id);
      
      // Reload data after approval
      await loadData();
    } catch (err) {
      console.error('Failed to approve report:', err);
      setError('Failed to approve report');
    } finally {
      setProcessingReport(null);
    }
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    if (severityFilter !== 'all' && report.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    return true;
  });

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-gray-400 text-sm">Total Reports</p>
          <p className="text-2xl font-bold text-gray-100">{reports.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-400 text-sm">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-400">
            {reports.filter((r) => r.status === 'submitted').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-400 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-400">
            {reports.filter((r) => r.status === 'approved' || r.status === 'paid').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-400 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-400">
            {reports.filter((r) => r.status === 'rejected').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <select 
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select 
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          {loading ? 'Loading...' : '↻ Refresh'}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-8">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading reports from blockchain...</p>
        </div>
      )}

      {/* Reports List */}
      {!loading && (
        <div className="space-y-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:border-blue-500 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-100">{report.title}</h3>
                    <SeverityBadge severity={report.severity} size="sm" />
                  </div>
                  <p className="text-gray-400 text-sm">
                    Submitted on {report.submittedDate}
                  </p>
                </div>
                <StatusChip status={report.status} />
              </div>

              {/* Description Preview */}
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                {report.description ? (
                  <p className="text-gray-300 text-sm line-clamp-3">{report.description}</p>
                ) : report.ipfsHash ? (
                  <p className="text-gray-500 text-sm italic">Loading description from IPFS...</p>
                ) : (
                  <p className="text-gray-500 text-sm">No description available</p>
                )}
              </div>

              {/* Bounty Information */}
              {/* <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-400 text-lg">🎯</span>
                  <h4 className="font-semibold text-blue-300">Bounty Information</h4>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Bounty Name</p>
                    <Link 
                      href={`/bounties/${report.bountyId}`}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {report.bountyProject}
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Bounty Owner</p>
                    <p className="font-mono text-sm text-gray-300">{report.bountyOwner}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Funded</p>
                    <p className="text-gray-100 font-medium">{report.bountyTotalFunded.toFixed(2)} SOL</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Expected Reward ({report.severity})</p>
                    <p className="text-green-400 font-bold">
                      {getExpectedReward(report.severity, report.bountyRewards).toFixed(2)} SOL
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Researcher Information */}
              {/* <div className="mb-4 p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-purple-400 text-lg">👤</span>
                  <h4 className="font-semibold text-purple-300">Researcher Information</h4>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                    <p className="font-mono text-sm text-purple-400" title={report.researcherFullAddress}>
                      {report.submittedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Full Address</p>
                    <p className="font-mono text-xs text-gray-400 break-all">{report.researcherFullAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Report Account</p>
                    <p className="font-mono text-xs text-gray-400">{shortenAddress(report.id)}</p>
                  </div>
                </div>
              </div> */}

              {/* Report Details */}
              <div className="grid md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-700">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Severity Level</p>
                  <p className={`font-bold capitalize ${
                    report.severity === 'critical' ? 'text-red-400' :
                    report.severity === 'high' ? 'text-orange-400' :
                    report.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                    {report.severity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className={`font-medium capitalize ${
                    report.status === 'submitted' ? 'text-yellow-400' :
                    report.status === 'approved' ? 'text-green-400' :
                    report.status === 'rejected' ? 'text-red-400' :
                    report.status === 'paid' ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {report.status === 'submitted' ? 'Pending Review' : report.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">IPFS Report</p>
                  {report.ipfsHash ? (
                    <a
                      href={getIPFSGatewayUrl(report.ipfsHash, 'report.json')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Full Report →
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">No IPFS data</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Payout Amount</p>
                  {report.payoutAmount !== null ? (
                    <p className="text-lg font-bold text-green-400">{report.payoutAmount} SOL</p>
                  ) : (
                    <p className="text-gray-500 text-sm">Pending approval</p>
                  )}
                </div>
              </div>

              {/* Impact & Steps (if available) */}
              {(report.impact || report.stepsToReproduce) && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {report.impact && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                      <p className="text-xs text-red-400 mb-1 font-semibold">💥 Impact</p>
                      <p className="text-gray-300 text-sm">{report.impact}</p>
                    </div>
                  )}
                  {report.stepsToReproduce && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                      <p className="text-xs text-yellow-400 mb-1 font-semibold">📝 Steps to Reproduce</p>
                      <p className="text-gray-300 text-sm whitespace-pre-line">{report.stepsToReproduce}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Fix (if available) */}
              {report.suggestedFix && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                  <p className="text-xs text-green-400 mb-1 font-semibold">💡 Suggested Fix</p>
                  <p className="text-gray-300 text-sm">{report.suggestedFix}</p>
                </div>
              )}

              {/* Actions - only show for pending reports */}
              {report.status === 'submitted' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleApprove(report)}
                    disabled={processingReport === report.id}
                  >
                    {processingReport === report.id ? 'Processing...' : '✓ Approve & Pay ' + getExpectedReward(report.severity, report.bountyRewards).toFixed(2) + ' SOL'}
                  </Button>
                  <Button variant="danger" size="sm" disabled={processingReport === report.id}>
                    ✗ Reject
                  </Button>
                  {report.ipfsHash && (
                    <a
                      href={getIPFSGatewayUrl(report.ipfsHash, 'report.json')}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        📄 View Full Report
                      </Button>
                    </a>
                  )}
                </div>
              )}

              {/* Show approval info for approved reports */}
              {(report.status === 'approved' || report.status === 'paid') && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-green-400">
                    <span>✅</span>
                    <span className="text-sm">
                      Approved {report.approver && `by ${report.approver}`}
                      {report.payoutAmount !== null && ` • Paid ${report.payoutAmount} SOL`}
                    </span>
                  </div>
                </div>
              )}

              {/* Show rejection info */}
              {report.status === 'rejected' && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-red-400">
                    <span>❌</span>
                    <span className="text-sm">
                      Rejected {report.approver && `by ${report.approver}`}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* No Reports */}
      {!loading && filteredReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            {reports.length === 0 
              ? 'No vulnerability reports have been submitted yet' 
              : 'No reports match the selected filters'}
          </p>
        </div>
      )}
    </div>
  );
}
