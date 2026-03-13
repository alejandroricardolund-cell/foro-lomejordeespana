import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter para la aplicación del foro
// Permite: imágenes, audio, presentaciones y documentos
export const ourFileRouter = {
  // Uploader general para imágenes
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      // Verificar que el usuario está autenticado
      const session = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/session`, {
        headers: req.headers,
      });
      const data = await session.json();
      
      if (!data.authenticated) {
        throw new UploadThingError("Unauthorized");
      }
      
      return { userId: data.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId, url: file.url, key: file.key };
    }),

  // Uploader para audio
  audioUploader: f({
    audio: {
      maxFileSize: "32MB",
      maxFileCount: 3,
    },
  })
    .middleware(async ({ req }) => {
      const session = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/session`, {
        headers: req.headers,
      });
      const data = await session.json();
      
      if (!data.authenticated) {
        throw new UploadThingError("Unauthorized");
      }
      
      return { userId: data.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Audio upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.url, key: file.key };
    }),

  // Uploader para documentos y presentaciones (PDF, PPT, PPTX, etc.)
  documentUploader: f({
    "application/pdf": {
      maxFileSize: "16MB",
      maxFileCount: 3,
    },
    "application/vnd.ms-powerpoint": {
      maxFileSize: "16MB",
      maxFileCount: 3,
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
      maxFileSize: "16MB",
      maxFileCount: 3,
    },
  })
    .middleware(async ({ req }) => {
      const session = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/session`, {
        headers: req.headers,
      });
      const data = await session.json();
      
      if (!data.authenticated) {
        throw new UploadThingError("Unauthorized");
      }
      
      return { userId: data.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.url, key: file.key };
    }),

  // Uploader mixto (imágenes + audio + documentos)
  mediaUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 3 },
    audio: { maxFileSize: "32MB", maxFileCount: 2 },
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 2 },
  })
    .middleware(async ({ req }) => {
      const session = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/session`, {
        headers: req.headers,
      });
      const data = await session.json();
      
      if (!data.authenticated) {
        throw new UploadThingError("Unauthorized");
      }
      
      return { userId: data.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Media upload complete:", file.ufsUrl);
      return { uploadedBy: metadata.userId, url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
