import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side IPFS Fetch API
 * Proxies IPFS requests to avoid CORS issues and handle gateway fallbacks
 */

// Use subdomain-style URLs which are more reliable
const getGatewayUrls = (cid: string, filename?: string): string[] => {
  const path = filename ? `/${filename}` : '';
  return [
    // Subdomain style (preferred, follows redirects)
    `https://${cid}.ipfs.w3s.link${path}`,
    `https://${cid}.ipfs.dweb.link${path}`,
    // Path style
    `https://w3s.link/ipfs/${cid}${path}`,
    `https://dweb.link/ipfs/${cid}${path}`,
    `https://ipfs.io/ipfs/${cid}${path}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}${path}`,
    `https://4everland.io/ipfs/${cid}${path}`,
  ];
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cid = searchParams.get('cid');
  const filename = searchParams.get('filename');

  if (!cid) {
    return NextResponse.json({ error: 'CID is required' }, { status: 400 });
  }

  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  const urls = getGatewayUrls(cleanCid, filename || undefined);

  let lastError: string = 'Unknown error';

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow', // Follow redirects
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'BugBounty-Platform/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'text/plain';
        const text = await response.text();
        
        console.log(`Successfully fetched from ${url}`);
        
        // Try to parse as JSON if it looks like JSON
        if (contentType.includes('json') || text.trim().startsWith('{')) {
          try {
            const json = JSON.parse(text);
            return NextResponse.json({ success: true, data: json, gateway: url });
          } catch {
            // Not valid JSON, return as text
          }
        }
        
        return NextResponse.json({ success: true, data: text, gateway: url });
      } else {
        lastError = `${url} returned ${response.status}`;
        console.warn(lastError);
      }
    } catch (error) {
      lastError = `${url}: ${(error as Error).message}`;
      console.warn(`Failed to fetch from ${url}:`, (error as Error).message);
    }
  }

  // All gateways failed
  return NextResponse.json(
    { 
      error: 'Failed to fetch from all IPFS gateways', 
      lastError,
      cid: cleanCid,
    },
    { status: 502 }
  );
}
