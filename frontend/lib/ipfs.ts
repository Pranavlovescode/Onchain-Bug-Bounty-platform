import { IPFS_CONFIG } from './web3-config';

/**
 * IPFS / Web3.Storage integration
 * Handles uploading vulnerability reports and retrieving them
 */

export interface UploadOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Upload file to Web3.Storage (IPFS)
 * @param file File to upload
 * @param onProgress Progress callback (0-100)
 * @returns IPFS hash (CID v1)
 */
export async function uploadToIPFS(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  // Validate inputs
  if (!file) {
    throw new Error('No file provided');
  }

  if (!IPFS_CONFIG.token) {
    throw new Error('Web3.Storage token not configured');
  }

  try {
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress updates (in production, use actual progress events)
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 90) {
        clearInterval(progressInterval);
        progress = 90;
      }
      onProgress?.(Math.floor(progress));
    }, 100);

    // Upload to Web3.Storage
    const response = await fetch(`${IPFS_CONFIG.apiUrl}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${IPFS_CONFIG.token}`,
      },
      body: formData,
    });

    clearInterval(progressInterval);
    onProgress?.(100);

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json() as { cid: string };
    return data.cid;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Upload JSON data to IPFS
 * @param data Object to upload as JSON
 * @returns IPFS hash
 */
export async function uploadJSONToIPFS(data: Record<string, unknown>): Promise<string> {
  const jsonString = JSON.stringify(data);
  const file = new File([jsonString], 'report.json', { type: 'application/json' });
  return uploadToIPFS(file);
}

/**
 * Get IPFS gateway URL for a CID
 * @param cid Content Identifier
 * @returns Full URL to content
 */
export function getIPFSGatewayUrl(cid: string): string {
  // Remove 'ipfs://' prefix if present
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  return `${IPFS_CONFIG.gatewayUrl}/${cleanCid}`;
}

/**
 * Fetch content from IPFS
 * @param cid Content Identifier
 * @returns Content as text
 */
export async function fetchFromIPFS(cid: string): Promise<string> {
  const url = getIPFSGatewayUrl(cid);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    return response.text();
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw error;
  }
}

/**
 * Fetch JSON from IPFS
 * @param cid Content Identifier
 * @returns Parsed JSON data
 */
export async function fetchJSONFromIPFS(cid: string): Promise<Record<string, unknown>> {
  const text = await fetchFromIPFS(cid);
  return JSON.parse(text);
}
