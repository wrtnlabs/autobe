import { PrismaClient } from "@prisma/client";

export namespace AutoBeHackathonGlobal {
  export const prisma: PrismaClient = new PrismaClient();
}
