import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fund = searchParams.get('fund');
  
  const response = await fetch(`https://web3ninja.eu/get_prices.php?fund=${fund}`);
  const data = await response.json();
  
  return NextResponse.json(data);
} 