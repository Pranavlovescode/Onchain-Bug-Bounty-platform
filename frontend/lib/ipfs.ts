import { IPFS_CONFIG } from './web3-config';

/**
 * IPFS / Storacha integration
 * Handles uploading vulnerability reports and retrieving them
 * 
 * Uses a Next.js API route for server-side uploads to Storacha
 */

export interface UploadOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Upload file to Storacha via API route
 * @param file File to upload
 * @param onProgress Progress callback (0-100)
 * @returns IPFS hash (CID)
 */
export async function uploadToIPFS(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    onProgress?.(10);

    const formData = new FormData();
    formData.append('files', file);

    onProgress?.(30);

    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    });

    onProgress?.(80);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    onProgress?.(100);
    
    console.log('Upload complete! CID:', result.cid);
    return result.cid;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple files to Storacha as a directory
 * @param files Array of files to upload
 * @param onProgress Progress callback (0-100)
 * @returns IPFS hash (CID) for the directory
 */
export async function uploadFilesToIPFS(
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  try {
    onProgress?.(10);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    onProgress?.(30);

    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    });

    onProgress?.(80);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    onProgress?.(100);
    
    console.log('Upload complete! CID:', result.cid);
    return result.cid;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Upload JSON data to IPFS
 * @param data Object to upload as JSON
 * @param fileName Optional custom filename
 * @returns IPFS hash
 */
export async function uploadJSONToIPFS(
  data: Record<string, unknown>,
  fileName: string = 'report.json'
): Promise<string> {
  const jsonString = JSON.stringify(data, null, 2);
  const file = new File([jsonString], fileName, { type: 'application/json' });
  return uploadToIPFS(file);
}

/**
 * Upload a vulnerability report with attachments
 * @param report Report data
 * @param attachments Optional file attachments
 * @param onProgress Progress callback
 * @returns CID of the uploaded report
 */
export async function uploadVulnerabilityReport(
  report: {
    title: string;
    severity: string;
    description: string;
    stepsToReproduce: string;
    impact: string;
    suggestedFix?: string;
    submitterAddress: string;
    bountyId: string;
    timestamp: number;
  },
  attachments?: File[],
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    // Create report JSON file
    const reportJson = JSON.stringify(report, null, 2);
    const reportFile = new File([reportJson], 'report.json', { type: 'application/json' });
    
    // Combine report with attachments
    const allFiles = [reportFile, ...(attachments || [])];
    
    // Upload all files as a directory
    const cid = await uploadFilesToIPFS(allFiles, onProgress);
    
    return cid;
  } catch (error) {
    console.error('Failed to upload vulnerability report:', error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for a CID
 * @param cid Content Identifier
 * @param filename Optional filename within the CID directory
 * @returns Full URL to content
 */
export function getIPFSGatewayUrl(cid: string, filename?: string): string {
  // Remove 'ipfs://' prefix if present
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  
  if (filename) {
    return `${IPFS_CONFIG.gatewayUrl}/${cleanCid}/${filename}`;
  }
  
  return `${IPFS_CONFIG.gatewayUrl}/${cleanCid}`;
}

/**
 * Get alternative gateway URLs for fallback
 * w3s.link is the Storacha gateway and should be tried first for content uploaded there
 */
export function getAlternativeGatewayUrls(cid: string, filename?: string): string[] {
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  const path = filename ? `/${cleanCid}/${filename}` : `/${cleanCid}`;
  
  return [
    `https://w3s.link/ipfs${path}`,
    `https://${cleanCid}.ipfs.w3s.link${filename ? `/${filename}` : ''}`,
    `https://dweb.link/ipfs${path}`,
    `https://${cleanCid}.ipfs.dweb.link${filename ? `/${filename}` : ''}`,
    `https://ipfs.io/ipfs${path}`,
    `https://gateway.pinata.cloud/ipfs${path}`,
    `https://cloudflare-ipfs.com/ipfs${path}`,
  ];
}

/**
 * Fetch content from IPFS using server-side proxy (avoids CORS issues)
 * @param cid Content Identifier
 * @param filename Optional filename within CID directory
 * @returns Content as text
 */
export async function fetchFromIPFS(cid: string, filename?: string): Promise<string> {
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  
  // Use server-side proxy to avoid CORS issues
  const params = new URLSearchParams({ cid: cleanCid });
  if (filename) {
    params.append('filename', filename);
  }
  
  const response = await fetch(`/api/ipfs/fetch?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch from IPFS');
  }
  
  const result = await response.json();
  
  if (typeof result.data === 'string') {
    return result.data;
  }
  
  return JSON.stringify(result.data);
}

/**
 * Fetch JSON from IPFS using server-side proxy
 * @param cid Content Identifier
 * @param filename Optional filename (defaults to report.json)
 * @returns Parsed JSON data
 */
export async function fetchJSONFromIPFS(
  cid: string,
  filename: string = 'report.json'
): Promise<Record<string, unknown>> {
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  
  // Use server-side proxy to avoid CORS issues
  const params = new URLSearchParams({ cid: cleanCid });
  if (filename) {
    params.append('filename', filename);
  }
  
  const response = await fetch(`/api/ipfs/fetch?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch from IPFS');
  }
  
  const result = await response.json();
  
  // Server already parsed JSON if possible
  if (typeof result.data === 'object') {
    return result.data;
  }
  
  // Parse if it's a string
  return JSON.parse(result.data);
}

/**
 * Fetch a vulnerability report from IPFS
 * @param cid Content Identifier
 * @returns Parsed report data
 */
export async function fetchVulnerabilityReport(cid: string): Promise<{
  title: string;
  severity: string;
  description: string;
  stepsToReproduce: string;
  impact: string;
  suggestedFix?: string;
  submitterAddress: string;
  bountyId: string;
  timestamp: number;
}> {
  const data = await fetchJSONFromIPFS(cid, 'report.json');
  return data as any;
}

/**
 * Check if a CID exists and is accessible
 * @param cid Content Identifier
 * @returns Boolean indicating if content is accessible
 */
export async function checkIPFSContent(cid: string): Promise<boolean> {
  try {
    const url = getIPFSGatewayUrl(cid);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get status of an upload (checks if content is available on gateways)
 * @param cid Content Identifier
 * @returns Upload status info
 */
export async function getUploadStatus(cid: string): Promise<{
  cid: string;
  available: boolean;
  gateways: Array<{ url: string; available: boolean }>;
} | null> {
  try {
    const gateways = getAlternativeGatewayUrls(cid);
    const gatewayStatus = await Promise.all(
      gateways.map(async (url) => {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          return { url, available: response.ok };
        } catch {
          return { url, available: false };
        }
      })
    );

    return {
      cid,
      available: gatewayStatus.some(g => g.available),
      gateways: gatewayStatus,
    };
  } catch (error) {
    console.error('Failed to get upload status:', error);
    return null;
  }
}
