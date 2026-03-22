'use server';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'forum';
  
  if (!file) {
    return { success: false, error: 'No hay archivo' };
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    return { success: false, error: 'Sin token en servidor' };
  }

  try {
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    
    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Usar API REST directamente
    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-content-type': file.type || 'application/octet-stream',
      },
      body: buffer,
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Error API: ${response.status} - ${text.substring(0, 200)}` };
    }

    const data = await response.json();
    
    return {
      success: true,
      file: {
        url: data.url,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        key: data.url,
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}
