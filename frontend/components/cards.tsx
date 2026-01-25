'use client';

import React from 'react';
import { Badge } from './ui';
import { getSeverityColor, getStatusColor } from '@/lib/utils';

/**
 * SeverityBadge component
 * Displays vulnerability severity with appropriate color coding
 */
interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  size?: 'sm' | 'md' | 'lg';
}

export function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <Badge variant={severity} className={sizes[size]}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

/**
 * StatusChip component
 * Displays status with appropriate styling
 */
interface StatusChipProps {
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid' | 'active' | 'closed' | 'paused';
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    approved: 'success',
    paid: 'success',
    active: 'success',
    rejected: 'error',
    submitted: 'warning',
    reviewing: 'warning',
    closed: 'default',
    paused: 'default',
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <Badge variant={statusMap[status] || 'default'} className={sizes[size]}>
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );
}

/**
 * BountyCard component
 * Displays a single bounty with key information
 */
interface BountyCardProps {
  id: string;
  projectName: string;
  description: string;
  totalReward: string;
  severities: Array<{
    level: 'critical' | 'high' | 'medium' | 'low';
    reward: string;
  }>;
  governanceType: 'dao' | 'safe' | 'multisig';
  status: 'active' | 'paused' | 'closed';
  expiresIn?: string;
  onClick?: () => void;
}

export function BountyCard({
  id,
  projectName,
  description,
  totalReward,
  severities,
  governanceType,
  status,
  expiresIn,
  onClick,
}: BountyCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-100 mb-1">{projectName}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
        </div>
        <StatusChip status={status} size="sm" />
      </div>

      <div className="mb-4 pb-4 border-b border-gray-700">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-blue-400">{totalReward}</span>
          <span className="text-gray-400 text-sm">SOL</span>
        </div>
        <p className="text-gray-500 text-xs mt-1">Total Bounty Pool</p>
      </div>

      <div className="mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Severity Tiers</p>
        <div className="flex flex-wrap gap-2">
          {severities.map((tier, idx) => (
            <div key={idx} className="text-xs">
              <SeverityBadge severity={tier.level} size="sm" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-700 rounded-full">{governanceType.toUpperCase()}</span>
          {expiresIn && <span>Expires: {expiresIn}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * ReportCard component
 * Displays a submitted vulnerability report
 */
interface ReportCardProps {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid';
  submittedDate: string;
  reward?: string;
  onClick?: () => void;
}

export function ReportCard({
  id,
  title,
  severity,
  status,
  submittedDate,
  reward,
  onClick,
}: ReportCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-blue-500 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-100">{title}</h4>
          <p className="text-xs text-gray-400 mt-1">{submittedDate}</p>
        </div>
        <StatusChip status={status} size="sm" />
      </div>

      <div className="flex items-center justify-between">
        <SeverityBadge severity={severity} size="sm" />
        {reward && <span className="text-sm font-semibold text-green-400">{reward}</span>}
      </div>
    </div>
  );
}

/**
 * NFTBadge component
 * Displays reputation NFT
 */
interface NFTBadgeProps {
  bugsFound: number;
  reputationScore: number;
  isMinted: boolean;
}

export function NFTBadge({ bugsFound, reputationScore, isMinted }: NFTBadgeProps) {
  return (
    <div className="bg-linear-to-br from-purple-900 to-purple-800 border border-purple-700 rounded-lg p-4 text-center">
      <div className="text-3xl mb-2">🏆</div>
      <p className="text-purple-100 font-semibold text-sm">Reputation NFT</p>
      <div className="mt-3 space-y-1">
        <p className="text-xs text-purple-300">
          <span className="font-bold">{bugsFound}</span> Bugs Found
        </p>
        <p className="text-xs text-purple-300">
          Score: <span className="font-bold">{reputationScore}</span>
        </p>
      </div>
      <div className="mt-3">
        {isMinted ? (
          <Badge variant="success" className="text-xs">
            ✓ Minted
          </Badge>
        ) : (
          <Badge variant="warning" className="text-xs">
            Not Minted
          </Badge>
        )}
      </div>
    </div>
  );
}
