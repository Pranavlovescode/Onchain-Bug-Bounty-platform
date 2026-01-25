'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * Landing Page
 * Product overview and main CTAs
 */
export default function LandingPage() {
  const { connected } = useWallet();

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <div className="inline-block">
            <div className="text-6xl mb-4">🛡️</div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            On-Chain Bug Bounty Platform
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Decentralized security through transparent, tamper-proof bounty programs. Projects
            create bounties, hackers find bugs, DAOs approve fixes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            {connected ? (
              <>
                <Link href="/bounties">
                  <Button size="lg" variant="primary">
                    Browse Active Bounties
                  </Button>
                </Link>
                <Link href="/submit">
                  <Button size="lg" variant="secondary">
                    Submit Vulnerability
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button size="lg" variant="primary">
                  Connect Wallet to Get Started
                </Button>
                <Link href="/bounties">
                  <Button size="lg" variant="secondary">
                    View Bounties
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-800 border-y border-gray-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">128</div>
              <p className="text-gray-300">Active Bounties</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting submissions</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">$2.4M</div>
              <p className="text-gray-300">Total Payouts</p>
              <p className="text-sm text-gray-500 mt-1">Paid to researchers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">847</div>
              <p className="text-gray-300">Critical Bugs Fixed</p>
              <p className="text-sm text-gray-500 mt-1">Vulnerabilities resolved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '🔐',
              title: 'On-Chain Escrow',
              description: 'Funds are locked in smart contracts, eliminating disputes',
            },
            {
              icon: '🗳️',
              title: 'Decentralized Governance',
              description: 'DAOs and multisigs approve payouts transparently',
            },
            {
              icon: '📋',
              title: 'IPFS Reports',
              description: 'Immutable vulnerability documentation on decentralized storage',
            },
            {
              icon: '🏆',
              title: 'Reputation NFTs',
              description: 'Earn verifiable reputation badges for successful submissions',
            },
            {
              icon: '⚡',
              title: 'Instant Payouts',
              description: 'Automatic reward distribution upon approval',
            },
            {
              icon: '🔗',
              title: 'Web3 Native',
              description: 'Built for Solana and multi-chain future',
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-800 border-y border-gray-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'Create Bounty',
                description: 'Project deposits funds and defines vulnerability tiers',
              },
              {
                step: '2',
                title: 'Submit Report',
                description: 'Researchers submit vulnerability reports with IPFS proofs',
              },
              {
                step: '3',
                title: 'Review & Vote',
                description: 'DAO/multisig members review and vote on legitimacy',
              },
              {
                step: '4',
                title: 'Get Paid',
                description: 'Approved researchers receive funds automatically',
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-100 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-300">{item.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/4 -right-3 text-gray-600 text-2xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-linear-to-r from-blue-900 to-purple-900 border border-blue-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Ready to Secure Your Protocol?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of projects and researchers securing the Web3 ecosystem
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button size="lg" variant="primary">
                Create a Bounty
              </Button>
            </Link>
            <Link href="/bounties">
              <Button size="lg" variant="secondary">
                Find Bounties
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
