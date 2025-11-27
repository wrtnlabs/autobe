import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/sdk";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Singleton } from "tstl";
import typia from "typia";

/* eslint-disable */
export class MyGlobal {
  public static testing: boolean = false;

  public static get env(): MyGlobal.IEnvironments {
    return environments.get();
  }

  public static get prisma(): PrismaClient {
    return prisma.get();
  }
}

export namespace MyGlobal {
  export interface IEnvironments {
    API_PORT: `${number}`;
    JWT_SECRET_KEY: string;

    POSTGRES_HOST: string;
    POSTGRES_PORT: `${number}`;
    POSTGRES_DATABASE: string;
    POSTGRES_SCHEMA: string;
    POSTGRES_USERNAME: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_URL: string;
  }
}
const environments = new Singleton(() => {
  const env = dotenv.config();
  dotenvExpand.expand(env);
  return typia.assert<MyGlobal.IEnvironments>(process.env);
});
const prisma = new Singleton(
  () =>
    new PrismaClient({
      adapter: new PrismaPg(
        { connectionString: environments.get().POSTGRES_URL },
        { schema: environments.get().POSTGRES_SCHEMA },
      ),
    }),
);
