import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  return NextResponse.json({
    tokenExists: !!token,
    tokenLength: token?.length || 0,
    tokenStart: token ? token.substring(0, 10) + '...' : null,
    nodeEnv: process.env.NODE_ENV,
    allEnvVars: Object.keys(process.env).filter(k => k.includes('BLOB') || k.includes('TOKEN')).sort()
  });
}
