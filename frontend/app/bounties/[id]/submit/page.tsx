'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { VulnerabilityReportForm, IPFSUploadProgress, TransactionToast } from '@/components/forms';
import { uploadVulnerabilityReport, getIPFSGatewayUrl } from '@/lib/ipfs';
import { useWallet } from '@solana/wallet-adapter-react';
import { useBountyContract } from '@/hooks/useBountyContract';
import { PublicKey } from '@solana/web3.js';

/**
 * Submit Vulnerability Report Page
 * Form for submitting vulnerability reports to a specific bounty
 */
export default function SubmitVulnerabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { publicKey, connected } = useWallet();
  const { submitReport, program } = useBountyContract();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ipfsProgress, setIpfsProgress] = useState(0);
  const [ipfsStatus, setIpfsStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [ipfsHash, setIpfsHash] = useState<string | undefined>();
  const [ipfsError, setIpfsError] = useState<string | undefined>();
  const [txStatus, setTxStatus] = useState<{
    hash: string;
    status: 'pending' | 'success' | 'failure';
  } | null>(null);

  const bountyId = resolvedParams.id;

  const handleSubmit = async (data: {
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    stepsToReproduce?: string;
    impact?: string;
    suggestedFix?: string;
    file?: File;
  }) => {
    if (!connected || !publicKey) {
      setIpfsError('Please connect your wallet first');
      return;
    }

    if (!program) {
      setIpfsError('Program not initialized. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setIpfsError(undefined);
    setTxStatus(null);

    try {
      // Step 1: Upload to IPFS via Web3.Storage
      setIpfsStatus('uploading');
      setIpfsProgress(0);

      const reportData = {
        title: data.title,
        severity: data.severity,
        description: data.description,
        stepsToReproduce: data.stepsToReproduce || '',
        impact: data.impact || '',
        suggestedFix: data.suggestedFix,
        submitterAddress: publicKey.toBase58(),
        bountyId,
        timestamp: Date.now(),
      };

      // Upload report with optional attachments
      const attachments = data.file ? [data.file] : undefined;
      const cid = await uploadVulnerabilityReport(
        reportData,
        attachments,
        (progress) => setIpfsProgress(progress)
      );
      
      setIpfsHash(cid);
      setIpfsStatus('success');
      
      console.log('Report uploaded to IPFS:', cid);
      console.log('View at:', getIPFSGatewayUrl(cid, 'report.json'));

      // Step 2: Submit on-chain via Solana program
      setTxStatus({
        hash: 'submitting...',
        status: 'pending',
      });

      // Parse the bountyId as a PublicKey (vault address)
      let vaultPubkey: PublicKey;
      try {
        vaultPubkey = new PublicKey(bountyId);
      } catch (e) {
        throw new Error('Invalid bounty ID: must be a valid Solana address');
      }

      // Submit the report to the blockchain
      const { signature, reportPDA } = await submitReport(
        vaultPubkey,
        cid,
        data.severity
      );

      console.log('Report submitted on-chain! Signature:', signature);
      console.log('Report PDA:', reportPDA.toBase58());

      setTxStatus({
        hash: signature,
        status: 'success',
      });

      setIsSubmitting(false);
    } catch (error) {
      console.error('Submission error:', error);
      
      // Handle IPFS vs blockchain errors differently
      if (ipfsStatus !== 'success') {
        setIpfsStatus('error');
        setIpfsError(error instanceof Error ? error.message : 'Upload failed');
      } else {
        // IPFS succeeded but blockchain failed
        setTxStatus({
          hash: '',
          status: 'failure',
        });
        setIpfsError(error instanceof Error ? error.message : 'Blockchain submission failed');
      }
      
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/bounties/${bountyId}`}
          className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
        >
          ← Back to Bounty
        </Link>

        <h1 className="text-4xl font-bold text-gray-100 mb-2">Submit Vulnerability Report</h1>
        <p className="text-gray-400">
          Provide a detailed, well-documented report with proof-of-concept for maximum impact
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <VulnerabilityReportForm
              bountyId={bountyId}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </Card>

          {/* IPFS Upload Status */}
          {ipfsStatus !== 'idle' && (
            <Card className="mt-8 bg-blue-900/50 border-blue-700">
              <h4 className="font-bold text-blue-100 mb-4">Upload Status</h4>
              <IPFSUploadProgress
                progress={ipfsProgress}
                status={ipfsStatus}
                ipfsHash={ipfsHash}
                error={ipfsError}
              />
              {ipfsHash && ipfsStatus === 'success' && (
                <div className="mt-4 pt-4 border-t border-blue-700">
                  <p className="text-sm text-blue-200 mb-2">Your report has been uploaded to IPFS:</p>
                  <a
                    href={getIPFSGatewayUrl(ipfsHash, 'report.json')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 break-all"
                  >
                    View on IPFS →
                  </a>
                </div>
              )}
            </Card>
          )}

          {/* Transaction Status */}
          {txStatus && (
            <Card className="mt-8">
              <h4 className="font-bold text-gray-100 mb-4">Transaction</h4>
              <TransactionToast
                hash={txStatus.hash}
                status={txStatus.status}
                message={
                  txStatus.status === 'success'
                    ? 'Report submitted successfully! You can track it in your dashboard.'
                    : 'Submitting your report...'
                }
                explorerUrl="https://solscan.io"
              />
            </Card>
          )}
        </div>

        {/* Guidelines */}
        <div className="space-y-6">
          <Card>
            <h4 className="font-bold text-gray-100 mb-4">✓ Best Practices</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Include clear reproduction steps</li>
              <li>• Provide working proof-of-concept</li>
              <li>• Explain the security impact</li>
              <li>• Suggest a potential fix</li>
              <li>• Use professional language</li>
              <li>• Include relevant code snippets</li>
            </ul>
          </Card>

          <Card>
            <h4 className="font-bold text-gray-100 mb-4">⚠️ Avoid These</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Unsubstantiated claims</li>
              <li>• Vague descriptions</li>
              <li>• Missing proof-of-concept</li>
              <li>• Attacks on test/staging only</li>
              <li>• Publicly disclosed issues</li>
              <li>• Low-quality formatting</li>
            </ul>
          </Card>

          <Card className="bg-green-900 border-green-700">
            <h4 className="font-bold text-green-100 mb-3">💡 Pro Tips</h4>
            <ul className="space-y-2 text-sm text-green-200">
              <li>✓ Use markdown for formatting</li>
              <li>✓ Include timestamps and logs</li>
              <li>✓ Provide multiple test cases</li>
              <li>✓ Be specific about affected versions</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
