import { NextRequest, NextResponse } from 'next/server';
import { sha256 } from 'js-sha256';

// Function to obfuscate the hash
function obfuscateHash(hash: string, timestamp: number): string {
  const noise = sha256(timestamp.toString());
  return hash.split('').map((char, i) => {
    return char + noise[i % noise.length];
  }).join('');
}

// Function to add timestamp validation
function isTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  const fiveSecondsAgo = now - 5000;
  return timestamp >= fiveSecondsAgo && timestamp <= now;
}

export async function POST(req: NextRequest) {
  try {
    const { epoch, address, timestamp } = await req.json();
    
    // Validate timestamp to prevent replay attacks
    if (!timestamp || !isTimestampValid(timestamp)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Get private string from environment variable (no NEXT_PUBLIC prefix)
    const privateString = process.env.PRIVATE_STRING;
    
    if (!privateString) {
      throw new Error('Private string not configured');
    }

    const cubedEpoch = Math.pow(epoch, 3);
    const dataToHash = "." + cubedEpoch + privateString + address;
    const hashedData = sha256(dataToHash);

    // Obfuscate the hash before sending
    const obfuscatedHash = obfuscateHash(hashedData, timestamp);

    return NextResponse.json({ 
      data: obfuscatedHash,
      t: timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate hash' },
      { status: 500 }
    );
  }
} 