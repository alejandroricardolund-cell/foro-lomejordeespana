'use server';

import { put } from '@vercel/blob';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'forum';
  
  if (!file) {
    return { success: false, error: 'No hay archivo' };
  }

  try {
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
    });

    return {
      success: true,
      file: {
        url: blob.url,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        key: blob.url,
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}
