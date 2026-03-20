import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const testContent = 'Test file content - ' + new Date().toISOString();
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    const blob = await put('test/test-' + Date.now() + '.txt', testFile, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      message: 'Upload funcionando correctamente',
      testFileUrl: blob.url,
      tokenExists: !!process.env.BLOB_READ_WRITE_TOKEN,
      tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      tokenExists: !!process.env.BLOB_READ_WRITE_TOKEN,
      tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Usa POST para probar el upload',
    tokenExists: !!process.env.BLOB_READ_WRITE_TOKEN,
    tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0
  });
}
