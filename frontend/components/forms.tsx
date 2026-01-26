'use client';

import React, { useState } from 'react';
import { Button, Input, Textarea } from './ui';
import { SeverityBadge } from './cards';

/**
 * IPFSUploadProgress component
 * Shows upload status and progress to IPFS
 */
interface IPFSUploadProgressProps {
  fileName?: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  ipfsHash?: string;
}

export function IPFSUploadProgress({
  fileName,
  progress,
  status,
  error,
  ipfsHash,
}: IPFSUploadProgressProps) {
  if (status === 'idle') return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-200">
          {fileName || 'Uploading to IPFS...'}
        </p>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>

      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            status === 'success'
              ? 'bg-green-500'
              : status === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {status === 'success' && ipfsHash && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-3 mt-3">
          <p className="text-xs text-green-100 font-mono">{ipfsHash}</p>
          <p className="text-xs text-green-300 mt-1">✓ Upload successful</p>
        </div>
      )}

      {status === 'error' && error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-3 mt-3">
          <p className="text-xs text-red-100">✗ {error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * VulnerabilityReportForm component
 * Form for submitting vulnerability reports
 */
interface VulnerabilityReportFormProps {
  bountyId: string;
  onSubmit: (data: {
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    stepsToReproduce?: string;
    impact?: string;
    suggestedFix?: string;
    file?: File;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function VulnerabilityReportForm({
  bountyId,
  onSubmit,
  isSubmitting = false,
}: VulnerabilityReportFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    severity: 'high' as 'critical' | 'high' | 'medium' | 'low',
    description: '',
    stepsToReproduce: '',
    impact: '',
    suggestedFix: '',
  });
  const [file, setFile] = useState<File | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length > 200) newErrors.title = 'Title must be less than 200 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 50)
      newErrors.description = 'Description must be at least 50 characters';
    if (!formData.stepsToReproduce.trim()) 
      newErrors.stepsToReproduce = 'Steps to reproduce are required';
    if (!formData.impact.trim()) 
      newErrors.impact = 'Impact assessment is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit({
        ...formData,
        file,
      });
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Report Title"
        type="text"
        placeholder="e.g., Reentrancy vulnerability in withdraw function"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
        maxLength={200}
      />

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">Severity Level</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData({ ...formData, severity: level })}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.severity === level
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
              }`}
            >
              <SeverityBadge severity={level} size="sm" />
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Vulnerability Description"
        placeholder="Provide a clear and concise description of the vulnerability..."
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        error={errors.description}
        rows={5}
      />

      <Textarea
        label="Steps to Reproduce"
        placeholder="1. Navigate to...
2. Call function X with parameters...
3. Observe that..."
        value={formData.stepsToReproduce}
        onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
        error={errors.stepsToReproduce}
        rows={6}
      />

      <Textarea
        label="Impact Assessment"
        placeholder="Describe the potential impact of this vulnerability. What could an attacker achieve? What's the worst-case scenario?"
        value={formData.impact}
        onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
        error={errors.impact}
        rows={4}
      />

      <Textarea
        label="Suggested Fix (Optional)"
        placeholder="If you have recommendations for fixing this vulnerability, include them here..."
        value={formData.suggestedFix}
        onChange={(e) => setFormData({ ...formData, suggestedFix: e.target.value })}
        rows={4}
      />

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Attach Proof of Concept (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
          <input
            type="file"
            accept=".pdf,.md,.txt,.py,.js,.ts,.sol,.rs"
            onChange={(e) => setFile(e.target.files?.[0])}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-2xl mb-2">📄</div>
            <p className="text-gray-200 font-medium">Upload proof of concept or detailed report</p>
            <p className="text-gray-400 text-xs mt-1">PDF, Markdown, Text, or Code files (max 10MB)</p>
            {file && (
              <div className="mt-3 bg-blue-900/30 rounded-lg p-2">
                <p className="text-blue-400 text-sm">✓ {file.name}</p>
                <p className="text-gray-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
          </label>
        </div>
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="w-full"
      >
        Submit Vulnerability Report
      </Button>
    </form>
  );
}

/**
 * TransactionToast component
 * Displays transaction status notifications
 */
interface TransactionToastProps {
  hash: string;
  status: 'pending' | 'success' | 'failure';
  message: string;
  explorerUrl?: string;
  onDismiss?: () => void;
}

export function TransactionToast({
  hash,
  status,
  message,
  explorerUrl,
  onDismiss,
}: TransactionToastProps) {
  const statusConfig = {
    pending: {
      icon: '⏳',
      bgColor: 'bg-blue-900',
      borderColor: 'border-blue-700',
      textColor: 'text-blue-100',
    },
    success: {
      icon: '✅',
      bgColor: 'bg-green-900',
      borderColor: 'border-green-700',
      textColor: 'text-green-100',
    },
    failure: {
      icon: '❌',
      bgColor: 'bg-red-900',
      borderColor: 'border-red-700',
      textColor: 'text-red-100',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 flex items-start gap-3`}
    >
      <span className="text-xl shrink-0">{config.icon}</span>
      <div className="flex-1">
        <p className={`font-semibold ${config.textColor}`}>{message}</p>
        <p className="text-xs text-gray-300 mt-1 font-mono break-all">{hash}</p>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs ${config.textColor} hover:underline mt-2 inline-block`}
          >
            View on Explorer →
          </a>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-200 shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * BountyFilters component
 * Filter bounties by severity, reward, etc.
 */
interface BountyFiltersProps {
  onFilterChange: (filters: {
    severity?: string;
    minReward?: number;
    maxReward?: number;
    searchQuery?: string;
  }) => void;
}

export function BountyFilters({ onFilterChange }: BountyFiltersProps) {
  const [filters, setFilters] = useState({
    searchQuery: '',
    severity: '' as string,
    minReward: '' as string,
    maxReward: '' as string,
  });

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    onFilterChange({
      searchQuery: newFilters.searchQuery || undefined,
      severity: newFilters.severity || undefined,
      minReward: newFilters.minReward ? parseFloat(newFilters.minReward) : undefined,
      maxReward: newFilters.maxReward ? parseFloat(newFilters.maxReward) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search bounties..."
        value={filters.searchQuery}
        onChange={(e) => handleChange('searchQuery', e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Severity</label>
        <select
          value={filters.severity}
          onChange={(e) => handleChange('severity', e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          placeholder="Min SOL"
          value={filters.minReward}
          onChange={(e) => handleChange('minReward', e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max SOL"
          value={filters.maxReward}
          onChange={(e) => handleChange('maxReward', e.target.value)}
        />
      </div>
    </div>
  );
}
