import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

/**
 * Utility functions for the application
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format wallet address for display
 * @example formatAddress('0x1234...5678', 4) => '0x12...5678'
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  const parsed = address.toLowerCase();
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`;
}

/**
 * Format large numbers with human-readable suffixes
 * @example formatNumber(1500000) => '1.5M'
 */
export function formatNumber(num: number | bigint): string {
  const n = typeof num === 'bigint' ? Number(num) : num;

  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;

  return n.toFixed(2);
}

/**
 * Format lamports to SOL with specified decimals
 */
export function formatSol(lamports: bigint, decimals = 4): string {
  const sol = Number(lamports) / 1e9;
  return sol.toFixed(decimals);
}

/**
 * Parse string to lamports
 */
export function parseSol(sol: string): bigint {
  const [integer, decimal = ''] = sol.split('.');
  const decimalPart = decimal.padEnd(9, '0').slice(0, 9);
  return BigInt(integer + decimalPart);
}

/**
 * Format timestamp to relative time
 * @example getRelativeTime(Date.now() - 3600000) => 'about 1 hour ago'
 */
export function getRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
}

/**
 * Get severity color classes
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-900 text-red-100 border-red-700';
    case 'high':
      return 'bg-orange-900 text-orange-100 border-orange-700';
    case 'medium':
      return 'bg-yellow-900 text-yellow-100 border-yellow-700';
    case 'low':
      return 'bg-blue-900 text-blue-100 border-blue-700';
    default:
      return 'bg-gray-800 text-gray-100 border-gray-700';
  }
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
    case 'paid':
      return 'bg-green-900 text-green-100 border-green-700';
    case 'rejected':
      return 'bg-red-900 text-red-100 border-red-700';
    case 'reviewing':
      return 'bg-blue-900 text-blue-100 border-blue-700';
    case 'submitted':
      return 'bg-yellow-900 text-yellow-100 border-yellow-700';
    case 'active':
      return 'bg-green-900 text-green-100 border-green-700';
    case 'closed':
      return 'bg-gray-900 text-gray-100 border-gray-700';
    default:
      return 'bg-gray-800 text-gray-100 border-gray-700';
  }
}

/**
 * Validate Solana/Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Check if address is in list (case-insensitive)
 */
export function isAddressInList(address: string, list: string[]): boolean {
  return list.some((addr) => addr.toLowerCase() === address.toLowerCase());
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
