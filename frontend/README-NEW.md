# On-Chain Bug Bounty Platform Frontend

A production-ready Web3 frontend for a decentralized bug bounty platform built with Next.js, TypeScript, Tailwind CSS, and wagmi.

## 🎯 Overview

This is the frontend for a **Web3-native bug bounty platform** where:

- **Security Researchers** submit vulnerability reports and earn rewards
- **Project Teams** create bounties with on-chain escrowed funds
- **DAOs/Multisigs** govern approvals and payouts
- **Reputation NFTs** verify researcher credentials

## 🚀 Features

### User Flows

1. **Landing Page** - Product overview, stats, and CTAs
2. **Bounty Dashboard** - Browse active bounties with filtering
3. **Bounty Detail** - Full bounty information and reward tiers
4. **Submit Report** - Form for submitting vulnerability reports with IPFS
5. **Researcher Dashboard** - Track submissions, earnings, and reputation
6. **Governance Panel** - Review and approve reports (multisig only)
7. **Create Bounty** - Form for project teams to create bounties

### Technical Features

- ✅ Wallet connection (WalletConnect + MetaMask)
- ✅ ENS name resolution
- ✅ IPFS report uploads (Web3.Storage)
- ✅ On-chain smart contract interactions (wagmi + viem)
- ✅ Transaction tracking and status updates
- ✅ Responsive design (desktop & tablet)
- ✅ Dark mode (default)
- ✅ Form validation and error handling
- ✅ Loading states and optimistic updates
- ✅ Accessibility-friendly UI

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Web3**: wagmi v2, viem v2
- **State**: Zustand (lightweight global state)
- **Forms**: React Hook Form
- **Storage**: IPFS via Web3.Storage
- **Date**: date-fns

## 📦 Project Structure

```
frontend/
├── app/                        # App Router pages
│   ├── layout.tsx              # Root layout with navbar/footer
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles
│   ├── bounties/               # Bounty routes
│   ├── dashboard/page.tsx       # Researcher dashboard
│   ├── governance/page.tsx      # Governance/review panel
│   └── create/page.tsx          # Create bounty form
├── components/                 # React components
│   ├── ui/                     # Base UI components
│   ├── layout.tsx              # Navbar, Footer
│   ├── cards.tsx               # Card components
│   └── forms.tsx               # Form components
├── lib/                        # Utilities and config
│   ├── web3-config.ts          # wagmi config
│   ├── store.ts                # Zustand state
│   ├── types.ts                # TypeScript types
│   ├── utils.ts                # Helper functions
│   └── ipfs.ts                 # IPFS integration
├── hooks/                      # Custom React hooks
├── providers/                  # Provider components
└── public/                     # Static assets
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your environment variables
```

### Development

```bash
# Start dev server
npm run dev

# Open http://localhost:3000
```

### Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm start
```

## 🔐 Environment Variables

Required variables in `.env.local`:

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_id
NEXT_PUBLIC_BOUNTY_CONTRACT=0x...
NEXT_PUBLIC_WEB3_STORAGE_TOKEN=your_token
```

See `.env.example` for complete list.

## 🎨 Key Components

### UI Components (`components/ui/`)
- `Button` - Variant styles (primary, secondary, danger, ghost)
- `Card` - Content container
- `Badge` - Status/severity indicators
- `Input` - Form input with validation
- `Textarea` - Multi-line input

### Feature Components
- `WalletButton` - Wallet connection UI
- `Navbar` - Navigation with wallet button
- `BountyCard` - Bounty display component
- `ReportCard` - Report display component
- `VulnerabilityReportForm` - Submission form
- `IPFSUploadProgress` - Upload status

## 🌐 Web3 Integration

### Using Hooks

```typescript
import { useBountyContract } from '@/hooks';

export function MyComponent() {
  const { submitReport } = useBountyContract();
  
  const handleSubmit = async () => {
    const { hash } = await submitReport('bountyId', 'ipfsHash', 'critical');
  };
}
```

### IPFS Integration

```typescript
import { uploadJSONToIPFS, getIPFSGatewayUrl } from '@/lib/ipfs';

// Upload to IPFS
const cid = await uploadJSONToIPFS({ title: 'Bug Report' });

// Get gateway URL
const url = getIPFSGatewayUrl(cid);
```

## 📝 Pages

| Page | Path | Purpose |
|------|------|---------|
| Landing | `/` | Product overview |
| Bounties | `/bounties` | Browse bounties |
| Bounty Detail | `/bounties/[id]` | Full bounty info |
| Submit Report | `/bounties/[id]/submit` | Submit vulnerability |
| Dashboard | `/dashboard` | Researcher stats |
| Governance | `/governance` | Review reports |
| Create | `/create` | Create bounty |

## 🧪 Development Workflow

1. Create components in `components/`
2. Add pages in `app/`
3. Use hooks in `hooks/`
4. Update types in `lib/types.ts`
5. Add utilities in `lib/utils.ts`

## 🚀 Production Checklist

- [ ] All environment variables set
- [ ] Contract addresses verified
- [ ] Test on testnet first
- [ ] Security audit completed
- [ ] IPFS credentials working
- [ ] Wallet connection tested
- [ ] Forms validated
- [ ] Mobile responsive checked
- [ ] Error handling in place
- [ ] Deployed to production

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [wagmi Docs](https://wagmi.sh)
- [Tailwind CSS](https://tailwindcss.com)
- [Web3.Storage](https://web3.storage)

## 📄 License

MIT License
