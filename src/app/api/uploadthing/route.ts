import { createRouteHandler } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  fileUploader: f({
    maxFileSize: "32MB",
    maxFileCount: 10,
  })({
    middleware: async () => ({ userId: "admin" }),
    onUploadComplete: async ({ file }) => ({ uploadedBy: "admin" }),
  }),
};

export type OurFileRouter = typeof ourFileRouter;

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
