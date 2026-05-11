'use server';

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get('file') as File;

    if (!file) {
      return { error: 'No se encontró archivo' };
    }

    // UploadThing permite hasta 32MB en su plan gratis
    const maxSize = 32 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: 'Archivo muy grande. Máx: 32MB' };
    }

    // Subir el archivo usando UploadThing
    const response = await utapi.uploadFiles(file);

    if (!response || response.error) {
      return { error: response?.error || 'Error al subir archivo' };
    }

    return {
      success: true,
      file: {
        url: response.data.url,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        key: response.data.key,
      }
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      error: 'Error al subir archivo',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
