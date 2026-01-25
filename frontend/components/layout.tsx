'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAppStore } from '@/lib/store';
import { formatAddress } from '@/lib/utils';

/**
 * Wallet connection button with address display
 * Uses Solana Wallet Adapter for wallet management
 */
export function WalletButton() {
  const { publicKey } = useWallet();
  const { setUserAddress } = useAppStore();

  useEffect(() => {
    if (publicKey) {
      setUserAddress(publicKey.toBase58());
    } else {
      setUserAddress(null);
    }
  }, [publicKey, setUserAddress]);

  return (
    <div className="flex items-center gap-2">
      {publicKey && (
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex flex-col items-end">
            <p className="text-sm font-semibold text-gray-100">
              {formatAddress(publicKey.toBase58())}
            </p>
          </div>
        </div>
      )}
      <WalletMultiButton className="bg-blue-600! hover:bg-blue-700! rounded-lg! text-white!" />
    </div>
  );
}

/**
 * Navbar component with navigation and wallet connection
 */
export function Navbar() {
  const { connected } = useWallet();

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-700 bg-gray-900 bg-opacity-95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🛡️</span>
            </div>
            <span className="font-bold text-gray-100 text-lg group-hover:text-blue-400 transition-colors">
              BugBounty
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/bounties"
              className="text-gray-300 hover:text-gray-100 transition-colors text-sm font-medium"
            >
              Bounties
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-gray-100 transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
            {connected && (
              <>
                <Link
                  href="/submit"
                  className="text-gray-300 hover:text-gray-100 transition-colors text-sm font-medium"
                >
                  Submit Report
                </Link>
                <Link
                  href="/governance"
                  className="text-gray-300 hover:text-gray-100 transition-colors text-sm font-medium"
                >
                  Governance
                </Link>
              </>
            )}
          </div>

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}

/**
 * Footer component
 */
export function Footer() {
  return (
    <footer className="border-t border-gray-700 bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-gray-100 font-bold mb-4">On-Chain Bug Bounty</h3>
            <p className="text-gray-400 text-sm">
              Security through transparency and decentralization.
            </p>
          </div>
          <div>
            <h4 className="text-gray-200 font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/bounties" className="text-gray-400 hover:text-gray-200 text-sm transition-colors">
                  Browse Bounties
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-gray-400 hover:text-gray-200 text-sm transition-colors">
                  Create Bounty
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-200 font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#docs"
                  className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#security"
                  className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
                >
                  Security
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-200 font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-gray-200 text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gray-200 text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8">
          <p className="text-gray-400 text-sm text-center">
            © 2026 On-Chain Bug Bounty Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
