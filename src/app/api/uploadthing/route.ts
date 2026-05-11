import { createRouteHandler } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  fileUploader: f({
    maxFileSize: "32MB",
    maxFileCount: 10,
  })({
    middleware: async () => {
      return { userId: "admin" };
    },
    onUploadComplete: async ({ file }) => {
      return { uploadedBy: "admin" };
    },
  }),
};

export type OurFileRouter = typeof ourFileRouter;
