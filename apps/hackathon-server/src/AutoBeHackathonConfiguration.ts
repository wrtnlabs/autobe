import { ExceptionManager } from "@nestia/core";
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import fs from "fs";
import path from "path/win32";
import { Singleton } from "tstl";
import typia from "typia";

export namespace AutoBeHackathonConfiguration {
  export const CODE: string = "20250912";
  export const env = () => environments.get();

  export const ROOT = (() => {
    const split: string[] = __dirname.split(path.sep);
    return split.at(-1) === "src" && split.at(-2) === "bin"
      ? path.resolve(__dirname + "/../..")
      : fs.existsSync(__dirname + "/.env")
        ? __dirname
        : path.resolve(__dirname + "/..");
  })().replaceAll("\\", "/");
}

const environments = new Singleton(() => {
  const env = dotenv.config();
  dotenvExpand.expand(env);
  return typia.assert<IEnvironments>(process.env);
});

interface IEnvironments {
  HACKATHON_API_PORT: `${number}`;
  HACKATHON_SEMAPHORE: `${number}`;

  HACKATHON_JWT_SECRET_KEY: string;
  HACKATHON_JWT_REFRESH_KEY: string;

  HACKATHON_POSTGRES_HOST: string;
  HACKATHON_POSTGRES_PORT: `${number}`;
  HACKATHON_POSTGRES_DATABASE: string;
  HACKATHON_POSTGRES_SCHEMA: string;
  HACKATHON_POSTGRES_USERNAME: string;
  HACKATHON_POSTGRES_PASSWORD: string;

  OPENAI_API_KEY: string;
  OPENROUTER_API_KEY: string;
}

ExceptionManager.insert(Prisma.PrismaClientKnownRequestError, (exp) => {
  switch (exp.code) {
    case "P2025":
      return new NotFoundException(exp.message);
    case "P2002": // UNIQUE CONSTRAINT
      return new ConflictException(exp.message);
    default:
      return new InternalServerErrorException(exp.message);
  }
});
process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});
