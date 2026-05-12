import { defineConfig } from "uploadthing/next";

export default defineConfig({
  router: {
    fileUploader: {
      maxFileSize: "32MB",
      maxFileCount: 10,
    },
  },
});
