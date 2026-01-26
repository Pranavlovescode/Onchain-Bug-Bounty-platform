import { NextRequest, NextResponse } from 'next/server';
import * as Client from '@web3-storage/w3up-client';
import * as Signer from '@ucanto/principal/ed25519';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import * as Proof from '@web3-storage/w3up-client/proof';

/**
 * Storacha IPFS Upload API
 * 
 * Uses a pre-generated delegation proof for authentication.
 * No email verification needed at runtime!
 * 
 * Setup:
 * 1. Run: w3 key create
 * 2. Run: w3 delegation create <DID_FROM_STEP_1> --can 'space/*' --can 'store/*' --can 'upload/*' --base64
 * 3. Set STORACHA_KEY (from step 1) and STORACHA_PROOF (from step 2) in .env.local
 */

// Cache the client
let cachedClient: Client.Client | null = null;

async function getClient(): Promise<Client.Client> {
  if (cachedClient) {
    return cachedClient;
  }

  const key = process.env.STORACHA_KEY;
  const proof = process.env.STORACHA_PROOF;

  if (!key || !proof) {
    throw new Error(
      'STORACHA_KEY and STORACHA_PROOF environment variables are required. ' +
      'See .env.example for setup instructions.'
    );
  }

  // Parse the key to create a signer
  const principal = Signer.parse(key);
  
  // Create client with the key
  const client = await Client.create({ 
    principal, 
    store: new StoreMemory() 
  });

  // Parse and add the delegation proof using the official helper
  const delegation = await Proof.parse(proof);
  
  const space = await client.addSpace(delegation);
  await client.setCurrentSpace(space.did());

  cachedClient = client;
  console.log('Storacha client initialized successfully');
  
  return client;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const client = await getClient();

    let cid: string;
    
    if (files.length === 1) {
      // Single file upload
      const result = await client.uploadFile(files[0]);
      cid = result.toString();
    } else {
      // Multiple files as directory
      const result = await client.uploadDirectory(files);
      cid = result.toString();
    }

    return NextResponse.json({
      success: true,
      cid,
      gateway: `https://w3s.link/ipfs/${cid}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
