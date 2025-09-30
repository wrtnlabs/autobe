import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Singleton } from "tstl";
import typia from "typia";

import { MyConfiguration } from "./MyConfiguration";

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
      adapter: new PrismaBetterSQLite3({
        url: `${MyConfiguration.ROOT}/prisma/db.sqlite`,
      }),
    }),
);
