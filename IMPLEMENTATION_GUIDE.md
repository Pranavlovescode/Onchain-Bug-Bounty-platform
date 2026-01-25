# Implementation Guide: On-Chain Bug Bounty Platform Frontend

## Overview

This document provides a complete guide for setting up, customizing, and deploying the Web3 bug bounty platform frontend.

## 1. Initial Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```
# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_id_from_walletconnect_cloud

# Smart Contracts
NEXT_PUBLIC_BOUNTY_CONTRACT=0x...  # Address after deployment
NEXT_PUBLIC_REPUTATION_NFT=0x...   # Address after deployment

# IPFS
NEXT_PUBLIC_WEB3_STORAGE_TOKEN=your_api_token

# Optional: RPC Endpoints
NEXT_PUBLIC_MAINNET_RPC=https://...
NEXT_PUBLIC_SEPOLIA_RPC=https://...
```

### Step 3: Get API Keys

#### WalletConnect
1. Visit https://cloud.walletconnect.com/
2. Sign up and create a project
3. Copy your Project ID

#### Web3.Storage
1. Go to https://web3.storage/
2. Sign in with GitHub
3. Create an API token
4. Copy and paste into `.env.local`

#### RPC Endpoints
- Use Alchemy, Infura, or QuickNode
- Get free tier RPC endpoint
- Add to environment variables

## 2. Smart Contract Integration

### Add Your Contract ABI

After deploying your smart contracts:

```bash
# Copy your contract ABI to frontend
cp ../target/idl/bug_bounty_platform.json lib/abi/BugBountyPlatform.json
```

### Update Contract Addresses

Edit `lib/web3-config.ts`:

```typescript
export const CONTRACTS = {
  BugBountyPlatform: '0xYourContractAddress...',
  ReputationNFT: '0xYourNFTAddress...',
};
```

### Add Contract Functions

Update `hooks/useBountyContract.ts` with actual contract calls:

```typescript
export function useBountyContract() {
  // Update walletClient.sendTransaction calls with:
  // 1. Proper ABI imports
  // 2. Function names from your contract
  // 3. Correct argument encoding
}
```

## 3. Customization

### Change Branding

Edit `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Your Platform Name',
  description: 'Your description',
};
```

Edit `components/layout.tsx`:
```typescript
<span className="font-bold text-gray-100 text-lg">Your Logo</span>
```

### Update Colors

Edit `app/globals.css`:
```css
:root {
  /* Add your color variables */
}
```

Tailwind uses gray-900 (dark) as base. Adjust color values as needed.

### Customize Pages

Edit individual pages in `app/*/page.tsx`:
- Update copy and descriptions
- Modify form fields
- Adjust layout and styling

## 4. Development Workflow

### Create a New Page

```typescript
// app/new-page/page.tsx
'use client';

import { Button, Card } from '@/components/ui';

export default function NewPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-100">New Page</h1>
      {/* Your content */}
    </div>
  );
}
```

### Create a New Component

```typescript
// components/MyComponent.tsx
'use client';

export interface MyComponentProps {
  title: string;
  description?: string;
}

export function MyComponent({ title, description }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
```

### Add Web3 Functionality

```typescript
// In your component
'use client';

import { useBountyContract } from '@/hooks';

export function MyComponent() {
  const { submitReport } = useBountyContract();

  const handleSubmit = async () => {
    try {
      const { txId, hash } = await submitReport(
        'bountyId123',
        'QmIpfsHash...',
        'critical',
      );
      console.log('Submitted:', hash);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

## 5. Testing

### Test Wallet Connection

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click wallet button
4. Connect with MetaMask or WalletConnect
5. Verify address displays

### Test Forms

1. Fill in form fields
2. Verify validation works
3. Check error messages
4. Test submission flow

### Test Responsive Design

1. Open DevTools (F12)
2. Toggle device toolbar
3. Test at breakpoints:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1024px

## 6. Deployment

### Local Testing

```bash
npm run build
npm run start
# Open http://localhost:3000
```

### Deploy to Vercel

```bash
# Push code to GitHub
git add .
git commit -m "Initial deployment"
git push origin main

# Visit https://vercel.com/import
# Select your repository
# Add environment variables
# Deploy
```

### Deploy to Other Platforms

#### Netlify
```bash
# Install CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### AWS Amplify
```bash
# Install CLI
npm install -g @aws-amplify/cli

# Configure
amplify init

# Deploy
amplify publish
```

## 7. Monitoring & Maintenance

### Check Logs

- Vercel Dashboard → Deployments → Logs
- Browser Console → DevTools (F12)

### Monitor Transactions

Update `hooks/useTransaction.ts` to:
- Watch transaction status
- Display confirmation count
- Handle failures gracefully

### Update Content

Edit pages to:
- Add new bounties
- Update descriptions
- Modify CTAs
- Change styling

## 8. Security Checklist

- [ ] Never commit `.env.local`
- [ ] Use environment variables for all secrets
- [ ] Validate all form inputs
- [ ] Check contract addresses before deployment
- [ ] Use testnet first
- [ ] Test wallet connection
- [ ] Verify IPFS uploads
- [ ] Check for console errors
- [ ] Test on mobile devices
- [ ] Audit smart contracts

## 9. Performance Optimization

### Image Optimization

Use Next.js Image component:
```typescript
import Image from 'next/image';

<Image src="/image.jpg" alt="Alt text" width={300} height={200} />
```

### Code Splitting

Next.js automatically splits code by route. No additional setup needed.

### Database Queries

Minimize contract calls by:
- Caching responses
- Batching reads
- Using The Graph (Subgraph)

### Bundle Analysis

```bash
npm install -D @next/bundle-analyzer

# Then run:
npx next build
```

## 10. Adding Features

### Add New Bounty Filter

Edit `components/forms.tsx`:
```typescript
export function BountyFilters({ onFilterChange }: BountyFiltersProps) {
  // Add new filter input
}
```

### Add Transaction Toast Notifications

```typescript
import { TransactionToast } from '@/components/forms';

<TransactionToast
  hash="0x..."
  status="success"
  message="Success!"
  explorerUrl="https://etherscan.io"
/>
```

### Add IPFS File Upload

```typescript
import { uploadToIPFS } from '@/lib/ipfs';

const cid = await uploadToIPFS(file, (progress) => {
  console.log(`Uploaded ${progress}%`);
});
```

## 11. Troubleshooting

### Wallet Not Connecting
- Check `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- Verify network is supported
- Clear browser cache

### IPFS Upload Fails
- Verify `NEXT_PUBLIC_WEB3_STORAGE_TOKEN`
- Check file size (max 5GB per file)
- Ensure network connectivity

### Contract Calls Fail
- Verify contract address is correct
- Check ABI is properly imported
- Ensure wallet is connected
- Verify network matches contract deployment

### Styling Issues
- Clear Tailwind cache: `rm -rf .next`
- Rebuild: `npm run build`
- Check CSS is imported in `layout.tsx`

## 12. Going to Mainnet

1. Deploy contracts to mainnet
2. Update contract addresses in `.env.local`
3. Change RPC endpoints to mainnet
4. Deploy frontend
5. Monitor for issues
6. Update documentation

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [wagmi Docs](https://wagmi.sh)
- [Web3.Storage Docs](https://web3.storage/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For issues:
1. Check browser console (F12)
2. Review environment variables
3. Test on testnet
4. Check GitHub issues
5. Create detailed bug report

---

**Last Updated**: January 2025
