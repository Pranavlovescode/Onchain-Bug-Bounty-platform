import { useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { SOLANA_NETWORK } from '@/lib/web3-config';

/**
 * Hook for handling Solana transaction status and confirmations
 */
export function useTransaction() {
  const { connection } = useConnection();

  /**
   * Wait for transaction confirmation
   * @param signature Transaction signature
   * @param maxWait Max time to wait in ms
   */
  const waitForConfirmation = useCallback(
    async (signature: string, maxWait = 60000) => {
      const startTime = Date.now();

      while (Date.now() - startTime < maxWait) {
        try {
          const status = await connection.getSignatureStatus(signature);
          
          if (status.value?.confirmationStatus === 'finalized') {
            return { status: 'success', confirmations: status.value.confirmations || 32 };
          }
          
          if (status.value?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
          }

          // Wait 1 second before checking again
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Error checking transaction:', error);
          throw error;
        }
      }

      throw new Error('Transaction confirmation timeout');
    },
    [connection],
  );

  /**
   * Get Solana explorer URL for transaction signature
   */
  const getExplorerUrl = useCallback((signature: string) => {
    const networkName = SOLANA_NETWORK.name;
    const baseUrl = `https://solscan.io/tx/${signature}`;
    const clusterParam = networkName === 'mainnet-beta' ? '' : `?cluster=${networkName}`;
    return `${baseUrl}${clusterParam}`;
  }, []);

  return {
    waitForConfirmation,
    getExplorerUrl,
  };
}
