import { NextRequest, NextResponse } from 'next/server';
import { sha256 } from 'js-sha256';

export async function POST(req: NextRequest) {
  try {
    const { epoch, address } = await req.json();
    
    // Get private string from environment variable (no NEXT_PUBLIC prefix)
    const privateString = process.env.PRIVATE_STRING;
    
    if (!privateString) {
      throw new Error('Private string not configured');
    }

    const cubedEpoch = Math.pow(epoch, 3);
    const dataToHash = "." + cubedEpoch + privateString + address;
    const hashedData = sha256(dataToHash);

    return NextResponse.json({ hashedData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate hash' },
      { status: 500 }
    );
  }
} 