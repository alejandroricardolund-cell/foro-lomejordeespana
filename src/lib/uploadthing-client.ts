'use client';

import {
  generateUploadButton,
  generateUploadDropzone,
  useUploadThing,
} from "@uploadthing/react";
import type { OurFileRouter } from "./uploadthing";

// Componentes pre-generados de UploadThing
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Re-exportar el hook
export { useUploadThing };
