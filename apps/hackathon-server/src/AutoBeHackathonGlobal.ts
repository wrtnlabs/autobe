import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Singleton } from "tstl";

import { AutoBeHackathonConfiguration } from "./AutoBeHackathonConfiguration";

export class AutoBeHackathonGlobal {
  public static get prisma(): PrismaClient {
    return prisma.get();
  }
}

const prisma = new Singleton(
  () =>
    new PrismaClient({
      adapter: new PrismaPg(
        {
          connectionString:
            AutoBeHackathonConfiguration.env().HACKATHON_POSTGRES_URL,
        },
        {
          schema: AutoBeHackathonConfiguration.env().HACKATHON_POSTGRES_SCHEMA,
        },
      ),
    }),
);
