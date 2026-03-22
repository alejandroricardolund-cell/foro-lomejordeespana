import { NextResponse } from 'next/server';

// Este endpoint GET retorna el token de Blob Store
// IMPORTANTE: Usamos GET porque Vercel pasa las env vars a GET pero no a POST
export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    return NextResponse.json({ 
      error: 'Token no configurado',
      hint: 'Verifica BLOB_READ_WRITE_TOKEN en las variables de entorno'
    }, { status: 500 });
  }
  
  return NextResponse.json({ 
    token,
    storeId: 'foro-files-public'
  });
}
