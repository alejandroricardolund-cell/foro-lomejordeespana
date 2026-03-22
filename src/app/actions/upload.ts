'use server';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'forum';
  
  if (!file) {
    return { success: false, error: 'No hay archivo' };
  }

  try {
    // Obtener token via GET (que sí funciona)
    const tokenRes = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/get-blob-token`);
    const tokenData = await tokenRes.json();
    const token = tokenData.token;
    
    if (!token) {
      return { success: false, error: 'No se pudo obtener token' };
    }

    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Error: ${response.status}` };
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
