import { ExceptionManager } from "@nestia/core";
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/sdk";
import path from "path";

import { AutoBePlaygroundGlobal } from "./AutoBePlaygroundGlobal";

export namespace AutoBePlaygroundConfiguration {
  export const ROOT = (() => {
    const split: string[] = __dirname.split(path.sep);
    return split.at(-1) === "src" && split.at(-2) === "bin"
      ? path.resolve(__dirname + "/../..")
      : path.resolve(__dirname + "/..");
  })().replaceAll("\\", "/");

  export const API_PORT = () =>
    Number(AutoBePlaygroundGlobal.env.PLAYGROUND_API_PORT);
}

ExceptionManager.insert(Prisma.PrismaClientKnownRequestError, (exp) => {
  switch (exp.code) {
    case "P2025":
      return new NotFoundException(exp.message);
    case "P2002":
      return new ConflictException(exp.message);
    default:
      return new InternalServerErrorException(exp.message);
  }
});
process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});
