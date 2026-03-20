import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function GET() {
  try {
    // Intentar subir un archivo de prueba muy pequeño
    const content = 'test';
    const blob = await put('debug/test.txt', content, { access: 'public' });
    
    return NextResponse.json({
      success: true,
      url: blob.url,
      message: 'Upload funcionó correctamente'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorName: error?.name,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
  }
}
