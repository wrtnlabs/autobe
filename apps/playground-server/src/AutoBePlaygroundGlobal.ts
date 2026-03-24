import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/sdk";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Singleton } from "tstl";
import typia from "typia";

import { AutoBePlaygroundConfiguration } from "./AutoBePlaygroundConfiguration";

export class AutoBePlaygroundGlobal {
  public static testing: boolean = false;

  public static get env(): IEnvironments {
    return envSingleton.get();
  }

  public static get prisma(): PrismaClient {
    return prismaSingleton.get();
  }
}

interface IEnvironments {
  PLAYGROUND_API_PORT: `${number}`;
  PLAYGROUND_COMPILERS: `${number}`;
  PLAYGROUND_TIMEOUT?: `${number}` | "NULL" | undefined;
  PLAYGROUND_ENCRYPTION_KEY: string;
  PLAYGROUND_ENCRYPTION_IV: string;
}

const envSingleton = new Singleton(() => {
  const env = dotenv.config();
  dotenvExpand.expand(env);
  return typia.assert<IEnvironments>(process.env);
});

const prismaSingleton = new Singleton(
  () =>
    new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: `${AutoBePlaygroundConfiguration.ROOT}/prisma/db.sqlite`,
      }),
    }),
);
