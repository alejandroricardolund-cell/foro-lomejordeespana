import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
await prisma.accessAttempt.deleteMany({});
const admin = await prisma.user.create({
  data: {
    email: "admin@foro.es",
    name: "Admin",
    accessKey: "A1B2C3D4E5F6A7B8",
    role: "ADMIN",
    isActive: true,
  }
});
console.log("IP DESBLOQUEADA y ADMIN CREADO. Tu clave es:", admin.accessKey);
await prisma.$disconnect();
