import { NextRequest, NextResponse } from 'next/server';

/**
 * IPFS CID Registry API
 * Maps shortened on-chain hashes to full IPFS CIDs
 * 
 * In production, this should use a database (Redis, PostgreSQL, etc.)
 * For now, we use an in-memory store
 */

// In-memory store (replace with database in production)
const cidRegistry = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { shortHash, fullCid } = await request.json();
    
    if (!shortHash || !fullCid) {
      return NextResponse.json(
        { error: 'shortHash and fullCid are required' },
        { status: 400 }
      );
    }
    
    cidRegistry.set(shortHash, fullCid);
    console.log(`Registered CID mapping: ${shortHash} -> ${fullCid}`);
    
    return NextResponse.json({ success: true, shortHash, fullCid });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shortHash = searchParams.get('shortHash');
  
  if (!shortHash) {
    return NextResponse.json(
      { error: 'shortHash is required' },
      { status: 400 }
    );
  }
  
  const fullCid = cidRegistry.get(shortHash);
  
  if (fullCid) {
    return NextResponse.json({ success: true, fullCid });
  }
  
  return NextResponse.json(
    { error: 'CID not found in registry' },
    { status: 404 }
  );
}
