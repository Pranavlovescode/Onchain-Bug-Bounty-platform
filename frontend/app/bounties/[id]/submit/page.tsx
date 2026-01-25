'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { VulnerabilityReportForm, IPFSUploadProgress, TransactionToast } from '@/components/forms';
import { uploadJSONToIPFS } from '@/lib/ipfs';

/**
 * Submit Vulnerability Report Page
 * Form for submitting vulnerability reports to a specific bounty
 */
export default function SubmitVulnerabilityPage({
  params,
}: {
  params: { id: string };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ipfsProgress, setIpfsProgress] = useState(0);
  const [ipfsStatus, setIpfsStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [ipfsHash, setIpfsHash] = useState<string | undefined>();
  const [txStatus, setTxStatus] = useState<{
    hash: string;
    status: 'pending' | 'success' | 'failure';
  } | null>(null);

  const bountyId = params.id;

  const handleSubmit = async (data: {
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    file?: File;
  }) => {
    setIsSubmitting(true);

    try {
      // Step 1: Upload to IPFS
      setIpfsStatus('uploading');

      const reportData = {
        title: data.title,
        severity: data.severity,
        description: data.description,
        submittedAt: new Date().toISOString(),
        bountyId,
      };

      const hash = await uploadJSONToIPFS(reportData);
      setIpfsHash(hash);
      setIpfsStatus('success');

      // Step 2: Create transaction (mock)
      // In production, this would call a smart contract function
      setTxStatus({
        hash: '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
        status: 'pending',
      });

      // Simulate transaction confirmation
      setTimeout(() => {
        setTxStatus((prev) =>
          prev ? { ...prev, status: 'success' } : null,
        );
      }, 3000);

      // Success notification
      setTimeout(() => {
        // Reset form
        setIsSubmitting(false);
      }, 4000);
    } catch (error) {
      console.error('Submission error:', error);
      setIpfsStatus('error');
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
            <Card className="mt-8 bg-blue-900 border-blue-700">
              <h4 className="font-bold text-blue-100 mb-4">Upload Status</h4>
              <IPFSUploadProgress
                progress={ipfsProgress}
                status={ipfsStatus}
                ipfsHash={ipfsHash}
              />
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
