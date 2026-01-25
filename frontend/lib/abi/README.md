# Frontend Smart Contract ABIs and Types

This directory can contain the smart contract ABIs needed for type-safe contract interactions.

## File Structure

```
abi/
├── BugBountyPlatform.json    # Main bounty contract
├── ReputationNFT.json         # Reputation NFT contract
└── Safe.json                  # Safe (multisig) interface
```

## Usage

Import ABIs in your contract hooks:

```typescript
import BugBountyABI from '@/lib/abi/BugBountyPlatform.json';
import { useReadContract } from 'wagmi';

// Type-safe contract reads
const { data } = useReadContract({
  address: CONTRACTS.BugBountyPlatform,
  abi: BugBountyABI,
  functionName: 'getBounty',
  args: [bountyId],
});
```

## Generating ABIs

After compiling your Anchor/Rust smart contracts:

```bash
# For Anchor projects
cat target/idl/bug_bounty_platform.json > frontend/lib/abi/BugBountyPlatform.json

# Then convert IDL to contract ABI as needed
```

## Type Generation

Generate TypeScript types from ABIs:

```bash
npm install -D @wagmi/cli
npx wagmi generate
```

Update `wagmi.config.ts` for your contract addresses and ABIs.
