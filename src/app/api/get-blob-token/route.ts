import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    token: process.env.BLOB_READ_WRITE_TOKEN || null
  });
}
