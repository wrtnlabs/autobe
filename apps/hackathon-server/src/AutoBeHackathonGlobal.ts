import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Singleton } from "tstl";
import typia from "typia";

export namespace AutoBeHackathonGlobal {
  export const prisma: PrismaClient = new PrismaClient();
  export const env = () => environments.get();
}

const environments = new Singleton(() => {
  const env = dotenv.config();
  dotenvExpand.expand(env);
  return typia.assert<IEnvironments>(process.env);
});

interface IEnvironments {
  HACKATHON_API_PORT: `${number}`;

  HACKATHON_JWT_SECRET_KEY: string;
  HACKATHON_JWT_REFRESH_KEY: string;

  HACKATHON_POSTGRES_HOST: string;
  HACKATHON_POSTGRES_PORT: `${number}`;
  HACKATHON_POSTGRES_DATABASE: string;
  HACKATHON_POSTGRES_SCHEMA: string;
  HACKATHON_POSTGRES_USERNAME: string;
  HACKATHON_POSTGRES_PASSWORD: string;
}
