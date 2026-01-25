# Solana Ecosystem Migration Guide

This frontend has been successfully migrated from Ethereum (wagmi/viem) to the **Solana ecosystem**.

## Key Changes

### 1. **Dependencies Updated** (package.json)
- ✅ Removed: `wagmi`, `viem`, `@wagmi/connectors`
- ✅ Added: `@solana/web3.js`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-wallets`
- ✅ Web3 library integration complete with Solana's standard tooling

### 2. **Web3 Configuration** (lib/web3-config.ts)
- Replaced Ethereum chain config with **Solana networks** (mainnet, devnet, localhost)
- `createSolanaConnection()` - Establishes connection to Solana RPC
- `PROGRAMS` - Smart contract program addresses (Anchor programs)
- Utility functions: `isValidPublicKey()`, `toPublicKey()`
- IPFS configuration retained for file uploads

### 3. **Web3 Provider** (providers/Web3Provider.tsx)
- Uses `ConnectionProvider` + `WalletProvider` from Solana Wallet Adapter
- Supports multiple wallets: Phantom, Solflare, Torus, Ledger, Sollet
- Integrated `WalletModalProvider` for wallet selection UI
- Kept `QueryClientProvider` for async state management

### 4. **Layout Components** (components/layout.tsx)
- `WalletButton`: Now uses `useWallet()` hook from Solana Wallet Adapter
- Uses `WalletMultiButton` component for wallet connection UI
- Removed ENS name resolution (Solana uses Bonfida domains instead)
- Displays formatted Solana public key (Base58)

### 5. **Contract Interaction Hooks**

#### useBountyContract.ts
- Replaced viem contract calls with **Solana Transaction** building
- Uses `useWallet()` + `useConnection()` hooks
- Transaction methods accept program instruction data
- Ready for Anchor program integration
- Methods: `createBounty()`, `submitReport()`, `approveReport()`, `fetchBounties()`

#### useTransaction.ts
- Replaced ethers confirmation polling with **Solana signature status** checking
- `waitForConfirmation()` - Waits for transaction finality
- `getExplorerUrl()` - Generates Solscan explorer links
- Works with mainnet, devnet, and localhost networks

### 6. **Environment Variables** (.env.example)
```env
# Solana RPC endpoints
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://api.devnet.solana.com

# Program addresses (replace with your deployed programs)
NEXT_PUBLIC_BOUNTY_PROGRAM=your_bounty_program_address
NEXT_PUBLIC_REPUTATION_NFT=your_reputation_nft_address

# IPFS for storing vulnerability reports
NEXT_PUBLIC_WEB3_STORAGE_TOKEN=your_web3_storage_token
```

## Integration Points

### Root Layout (app/layout.tsx)
✅ Web3Provider wrapped around entire app ensuring all components have wallet context

### Smart Contract Integration (Pending)
The hooks are structured to work with **Anchor programs**. To complete integration:

1. Generate Anchor IDL from your Rust program
2. Install `@coral-xyz/anchor` and `@coral-xyz/anchor-client`
3. Create program client in hooks using:
   ```typescript
   import { Program, AnchorProvider } from '@coral-xyz/anchor';
   const program = new Program(IDL, PROGRAMS.BugBountyPlatform, provider);
   ```
4. Replace commented instruction building with actual IDL methods

### Wallet Support
**Currently supported wallets:**
- 🔷 Phantom (Mobile + Browser)
- 🟠 Solflare (Mobile + Browser)
- 🟡 Torus
- 💜 Ledger Hardware Wallet
- 🟢 Sollet (Web wallet)

Add more wallets by importing from `@solana/wallet-adapter-wallets`:
```typescript
import { BackpackWalletAdapter, CoinbaseWalletAdapter } from '@solana/wallet-adapter-wallets';
```

## Testing

### Local Development
1. Set network to **devnet**: `DEFAULT_NETWORK = 'devnet'` in web3-config.ts
2. Use devnet SOL from [Solana Faucet](https://solfaucet.com)
3. Ensure localStorage has wallet connections enabled

### Anchor Program Testing
1. Deploy program to devnet: `anchor deploy --provider.cluster devnet`
2. Update `NEXT_PUBLIC_BOUNTY_PROGRAM` in .env.local
3. Test transaction building without actual execution (use `simulate` mode)

## Transaction Flow

1. **User connects wallet** → `WalletMultiButton` → `useWallet()` provides `publicKey`
2. **User submits form** → Bounty/Report creation triggered
3. **Hook builds transaction** → Constructs Solana Transaction with instruction(s)
4. **Wallet signs** → `sendTransaction()` prompts user signature
5. **Network confirms** → `useTransaction().waitForConfirmation()` polls signature status
6. **Explorer link** → `getExplorerUrl()` provides Solscan link for verification

## IPFS Integration

File uploads to IPFS remain unchanged:
- `lib/ipfs.ts` - Web3.Storage integration
- Supports report attachments, vulnerability proofs, project documentation
- Returns IPFS CID for on-chain storage reference

## Known Limitations

- ⚠️ Solana doesn't have native multisig like Ethereum Safe - use **Squads Protocol** for governance
- ⚠️ No ENS equivalent - use **Bonfida Domains** or direct public key display
- ⚠️ Anchor program generation required - IDL not yet integrated

## Next Steps

1. **Deploy Anchor program** to devnet
2. **Generate IDL** and place in `lib/abi/bug_bounty_platform.json`
3. **Install Anchor client**: `npm install @coral-xyz/anchor`
4. **Update hooks** with actual program instructions
5. **Test end-to-end** transaction flow
6. **Deploy to mainnet** when ready

## Support

- Solana Docs: https://docs.solana.com
- Anchor Framework: https://www.anchor-lang.com
- Wallet Adapter: https://github.com/solana-labs/wallet-adapter
- Web3.js SDK: https://solana-labs.github.io/solana-web3.js
